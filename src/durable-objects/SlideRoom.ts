import { DurableObjectState, DurableObjectNamespace } from '@cloudflare/workers-types';
import { AIContentGenerator, slugify } from '../utils/ai-generator';

interface Env {
  ASSETS_BUCKET: R2Bucket;
  POLL_ROOM: DurableObjectNamespace;
  DB: D1Database;
  AI: any;
}

interface SlideState {
  currentSlideIndex: number;
  currentNodeId: string;
  history: string[];
  adventureData?: any;
  participantCount: number;
  visitedSlides: Set<number>;
  sessionCode?: string;
  presentationId?: string;
  presenterToken?: string;
  generatedContent?: Map<number, any>; // Store AI-generated content per slide
  originalSlideContent?: Map<number, any>; // Store original slide content
}

export class SlideRoom {
  private state: DurableObjectState;
  private env: Env;
  private clients: Set<WebSocket>;
  private slideState: SlideState;
  private activePoll: any;
  private pollTimer: any;
  private sql: any; // Durable Object SQL storage
  private presentationData: any[] = [];
  private presentationInfo: any = null;
  private participantMap: Map<WebSocket, any>;
  private prizeWinners: Set<string>; // Track winner IDs to prevent duplicate wins

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
    this.sql = state.storage.sql;
    this.participantMap = new Map();
    this.prizeWinners = new Set();
    this.slideState = {
      currentSlideIndex: 0,
      currentNodeId: 'start',
      history: ['start'],
      participantCount: 0,
      visitedSlides: new Set([0]), // Start with welcome slide as visited
      generatedContent: new Map(),
      originalSlideContent: new Map()
    };
    
    // Initialize SQL tables on construction
    this.initializeSQLTables();
    // Load prize winners from storage
    this.loadPrizeWinners();
  }

  private async initializeSQLTables() {
    try {
      // Check if SQL is available
      if (!this.sql || typeof this.sql.exec !== 'function') {
        console.log('SQL storage not available yet, skipping table initialization');
        return;
      }
      
      // Create participants table with name fields
      await this.sql.exec(`
        CREATE TABLE IF NOT EXISTS participants (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          joined_at INTEGER NOT NULL,
          last_seen INTEGER NOT NULL,
          is_presenter INTEGER DEFAULT 0,
          first_name TEXT,
          last_name TEXT
        )
      `);
      
      // Create poll votes table
      await this.sql.exec(`
        CREATE TABLE IF NOT EXISTS poll_votes (
          id TEXT PRIMARY KEY,
          poll_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          option_id TEXT NOT NULL,
          voted_at INTEGER NOT NULL
        )
      `);
      
      // Create unique index for preventing duplicate votes
      await this.sql.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_unique 
        ON poll_votes(poll_id, user_id)
      `);
      
      // Create session info table
      await this.sql.exec(`
        CREATE TABLE IF NOT EXISTS session_info (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
      
      console.log('SQL tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQL tables:', error);
      // Don't throw - allow the DO to continue working without SQL features
    }
  }

  private async loadPrizeWinners() {
    try {
      const winners = await this.state.storage.get('prizeWinners');
      if (winners) {
        this.prizeWinners = new Set(winners as string[]);
        console.log(`Loaded ${this.prizeWinners.size} previous winners`);
      }
    } catch (error) {
      console.error('Failed to load prize winners:', error);
    }
  }
  
  private async savePrizeWinners() {
    try {
      await this.state.storage.put('prizeWinners', Array.from(this.prizeWinners));
    } catch (error) {
      console.error('Failed to save prize winners:', error);
    }
  }
  
  private generateParticipantId(): string {
    return `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private filterProfanity(text: string): string {
    // Same profanity filter as client side
    const profanityList = [
      'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'piss',
      'dick', 'cock', 'pussy', 'bastard', 'slut', 'whore', 'fag',
      'cunt', 'nigger', 'nigga', 'retard', 'gay', 'homo'
    ];
    
    let filtered = text;
    const specialChars = ['$', '@', '#', '%', '&', '*', '!', '^'];
    
    profanityList.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, (match) => {
        return match.split('').map(() => 
          specialChars[Math.floor(Math.random() * specialChars.length)]
        ).join('');
      });
    });
    
    return filtered;
  }
  
  private async getActiveParticipants(excludeWinners = false) {
    let participants = [];
    
    // Ensure participantMap exists
    if (!this.participantMap) {
      this.participantMap = new Map();
    }
    
    if (!this.sql || typeof this.sql.exec !== 'function') {
      // Fall back to in-memory participant map
      participants = Array.from(this.participantMap.values());
      console.log(`Using in-memory participants: ${participants.length} found`);
    } else {
      try {
        const result = await this.sql.exec(
          `SELECT id, first_name, last_name, joined_at FROM participants 
           WHERE last_seen > ? 
           ORDER BY joined_at DESC`,
          Date.now() - 3600000 // Active in last hour
        );
        participants = result.results || [];
        console.log(`Found ${participants.length} participants from SQL`);
        
        // If SQL is empty but we have in-memory participants, use those
        if (participants.length === 0 && this.participantMap.size > 0) {
          participants = Array.from(this.participantMap.values());
          console.log(`SQL empty, using ${participants.length} in-memory participants`);
        }
      } catch (error) {
        console.error('Failed to get participants from SQL:', error);
        participants = Array.from(this.participantMap.values());
        console.log(`SQL error, falling back to ${participants.length} in-memory participants`);
      }
    }
    
    // Filter out winners if requested
    if (excludeWinners && this.prizeWinners.size > 0) {
      participants = participants.filter(p => !this.prizeWinners.has(p.id));
      console.log(`Filtered out ${this.prizeWinners.size} previous winners, ${participants.length} eligible participants remaining`);
    }
    
    return participants;
  }
  
  private async loadState() {
    const storedState = await this.state.storage.get('slideState');
    if (storedState) {
      this.slideState = {
        ...storedState as any,
        visitedSlides: new Set((storedState as any).visitedSlides || [0])
      };
    }
    
    // Load presentation data if we have a presentationId
    if (this.slideState.presentationId && this.presentationData.length === 0) {
      await this.loadPresentationFromD1(this.slideState.presentationId);
    }
  }
  
  private async loadPresentationFromD1(presentationId: string) {
    try {
      console.log(`Loading presentation ${presentationId} from D1...`);
      
      // Query presentation info
      const presentationResult = await this.env.DB.prepare(
        `SELECT * FROM presentations WHERE id = ?`
      ).bind(presentationId).first();
      
      if (presentationResult) {
        this.presentationInfo = presentationResult;
      }
      
      // Query slides from D1
      const result = await this.env.DB.prepare(
        `SELECT * FROM slides WHERE presentation_id = ? ORDER BY order_number ASC`
      ).bind(presentationId).all();
      
      if (result.results && result.results.length > 0) {
        this.presentationData = result.results;
        console.log(`Loaded ${this.presentationData.length} slides for presentation ${presentationId}`);
        
        // Log first and last slide for verification
        const first = this.presentationData[0] as any;
        const last = this.presentationData[this.presentationData.length - 1] as any;
        console.log(`First slide: ${first.title} (order: ${first.order_number})`);
        console.log(`Last slide: ${last.title} (order: ${last.order_number})`);
        
        // Broadcast update to all connected clients
        this.broadcast({
          type: 'presentationLoaded',
          data: {
            totalSlides: this.presentationData.length,
            currentSlide: this.getSlideData(this.slideState.currentSlideIndex)
          }
        });
      } else {
        console.warn(`No slides found for presentation ${presentationId}`);
        this.presentationData = [];
      }
    } catch (error) {
      console.error('Failed to load presentation from D1:', error);
      this.presentationData = [];
    }
  }
  
  async initializeSession(presentationId: string, sessionCode: string, presenterToken?: string) {
    console.log(`Initializing session with code ${sessionCode} for presentation ${presentationId}`);
    
    // Clear ALL existing state to ensure fresh start
    await this.state.storage.deleteAll();
    
    // Reset all in-memory state
    this.slideState = {
      currentSlideIndex: 0,
      currentNodeId: 'start',
      history: ['start'],
      participantCount: 0,
      visitedSlides: new Set([0]),
      presentationId: presentationId,
      sessionCode: sessionCode,
      presenterToken: presenterToken
    };
    
    // Clear any existing presentation data to force reload
    this.presentationData = [];
    
    // Clear participants and polls
    this.participantMap.clear();
    this.prizeWinners.clear();
    this.activePoll = null;
    
    // Re-initialize SQL tables (they get cleared with deleteAll)
    await this.initializeSQLTables();
    
    // Save the new clean state
    await this.saveState();
    
    // Load fresh presentation data from D1
    await this.loadPresentationFromD1(presentationId);
    
    // Store session info in SQL if available
    if (this.sql && typeof this.sql.exec === 'function') {
      try {
        await this.sql.exec(
          `INSERT OR REPLACE INTO session_info (key, value) VALUES (?, ?), (?, ?), (?, ?)`,
          'presentation_id', presentationId,
          'session_code', sessionCode,
          'started_at', Date.now().toString()
        );
      } catch (error) {
        console.error('Failed to store session info in SQL:', error);
        // Continue without SQL storage
      }
    }
    
    console.log('Session initialized successfully');
    
    return {
      success: true,
      sessionCode,
      presentationId
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log('SlideRoom received request:', url.pathname);
    
    // Load state on first request
    // Note: State will be completely refreshed when initializeSession is called
    if (!this.slideState.sessionCode) {
      await this.loadState();
    }

    // WebSocket upgrade for real-time sync
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      this.state.acceptWebSocket(server);
      this.clients.add(server);
      
      // Update participant count
      this.slideState.participantCount = this.clients.size;
      await this.state.storage.put('participantCount', this.slideState.participantCount);

      // Send initial state to new client with current slide data
      const slideInfo = this.getSlideData(this.slideState.currentSlideIndex);
      server.send(JSON.stringify({
        type: 'state',
        data: {
          ...this.slideState,
          currentSlide: slideInfo,
          visitedSlides: Array.from(this.slideState.visitedSlides) // Convert Set to Array for JSON
        }
      }));
      
      // Broadcast updated participant count to all clients
      this.broadcast({
        type: 'participantUpdate',
        data: { count: this.slideState.participantCount }
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // Internal API endpoints
    switch (url.pathname) {
      case '/internal/init':
        return this.handleInitSession(request);
      case '/internal/goto':
        return this.handleGoto(request);
      case '/internal/startPoll':
        return this.handleStartPoll(request);
      case '/internal/advanceNode':
        return this.handleAdvanceNode(request);
      case '/internal/state':
        return this.handleGetState();
      case '/internal/finale':
        return this.handleFinale();
      case '/internal/vote':
        return this.handleVote(request);
      case '/internal/poll-options':
        return this.handleGetPollOptions();
      case '/internal/add-participant':
        return this.handleAddParticipant(request);
      case '/internal/pick-prize-winner':
        return this.handlePickPrizeWinner();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'navigate':
          await this.navigateToSlide(data.index);
          break;
        case 'reloadPresentation':
          // Reload presentation data from D1 (useful after editing slides)
          if (this.slideState.presentationId) {
            await this.loadPresentationFromD1(this.slideState.presentationId);
            const currentSlide = this.getSlideData(this.slideState.currentSlideIndex);
            ws.send(JSON.stringify({
              type: 'presentationReloaded',
              data: {
                currentSlide,
                totalSlides: this.presentationData.length
              }
            }));
          }
          break;
        case 'startPoll':
          // Start a new poll
          await this.startNewPoll(data.data);
          break;
        case 'pickWinner':
          await this.forcePickWinner(data.optionId, data.strategy);
          break;
        case 'pickPrizeWinner':
          await this.pickAndBroadcastPrizeWinner();
          break;
        case 'requestParticipantList':
          // Send full participant list to the requester
          const participants = await this.getActiveParticipants(false);
          
          // Deduplicate participants by name
          const uniqueParticipants = new Map();
          participants.forEach(p => {
            const firstName = p.firstName || p.first_name;
            const lastName = p.lastName || p.last_name || '';
            const key = firstName + '_' + lastName;
            if (!uniqueParticipants.has(key)) {
              uniqueParticipants.set(key, {
                firstName: firstName,
                lastName: lastName,
                lastInitial: lastName.charAt(0)
              });
            }
          });
          
          const participantList = Array.from(uniqueParticipants.values());
          
          ws.send(JSON.stringify({
            type: 'participantList',
            data: {
              participants: participantList,
              count: participantList.length
            }
          }));
          break;
        case 'ping':
          // Respond to ping with pong to keep connection alive
          try {
            ws.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }));
          } catch (error) {
            console.error('Failed to send pong:', error);
          }
          break;
        case 'join':
          // Re-send current state when client rejoins
          console.log('Client joined/rejoined room:', data.roomId, 'with participant:', data.participant);
          
          // Store participant info if provided
          if (data.participant && data.participant.firstName && data.participant.firstName !== 'Anonymous') {
            const participantId = this.generateParticipantId();
            // Apply profanity filter to names
            const participant = {
              id: participantId,
              firstName: this.filterProfanity(data.participant.firstName || 'Anonymous'),
              lastName: this.filterProfanity(data.participant.lastName || ''),
              joinedAt: Date.now(),
              wsId: ws
            };
            
            // Store in SQL if available
            if (this.sql && typeof this.sql.exec === 'function') {
              try {
                // Note: SQL columns are first_name and last_name (with underscore)
                await this.sql.exec(
                  `INSERT OR REPLACE INTO participants (id, user_id, joined_at, last_seen, is_presenter, first_name, last_name) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  participantId,
                  participantId,
                  Date.now(),
                  Date.now(),
                  0,
                  participant.firstName,
                  participant.lastName
                );
                console.log('Stored participant:', participant.firstName, participant.lastName);
              } catch (error) {
                console.error('Failed to store participant in SQL:', error);
              }
            }
            
            // Store WebSocket to participant mapping
            if (!this.participantMap) {
              this.participantMap = new Map();
            }
            this.participantMap.set(ws, participant);
            
            // Broadcast new participant joined to ALL clients (including presenters)
            // This ensures the presenter sees a greeting when someone joins or rejoins
            console.log('Broadcasting participantJoined for:', participant.firstName, participant.lastName);
            
            // Add a small delay to ensure all clients are ready to receive the message
            setTimeout(() => {
              console.log('Sending participantJoined broadcast to', this.clients.size, 'connected clients');
              this.broadcast({
                type: 'participantJoined',
                data: {
                  firstName: participant.firstName,
                  lastName: participant.lastName,
                  lastInitial: participant.lastName ? participant.lastName.charAt(0) : '',
                  timestamp: Date.now()
                }
              });
              console.log('Broadcast complete');
            }, 100);
          }
          
          const currentSlide = this.getSlideData(this.slideState.currentSlideIndex);
          
          // Send comprehensive state update
          try {
            ws.send(JSON.stringify({
              type: 'state',
              data: {
                ...this.slideState,
                currentSlide,
                visitedSlides: Array.from(this.slideState.visitedSlides),
                timestamp: Date.now()
              }
            }));
            console.log('Sent state to rejoined client');
            
            // If there's an active poll, send that too
            if (this.activePoll) {
              ws.send(JSON.stringify({
                type: 'pollStart',
                data: this.activePoll
              }));
              console.log('Sent active poll to rejoined client');
            }
          } catch (error) {
            console.error('Failed to send state to rejoined client:', error);
          }
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    // Remove the participant from our tracking when they disconnect
    const participant = this.participantMap.get(ws);
    if (participant) {
      console.log(`Participant disconnected: ${participant.firstName} ${participant.lastInitial || ''}`);
      this.participantMap.delete(ws);
      
      // Also try to mark as inactive in SQL if available
      if (this.sql && typeof this.sql.exec === 'function' && participant.id) {
        try {
          await this.sql.exec(
            `UPDATE participants SET last_seen = ? WHERE id = ?`,
            Date.now() - 7200000, // Mark as very old (2 hours ago) so they don't show in active list
            participant.id
          );
        } catch (error) {
          console.error('Failed to update participant last_seen:', error);
        }
      }
      
      // Broadcast that a participant left
      this.broadcast({
        type: 'participantLeft',
        data: {
          firstName: participant.firstName,
          lastInitial: participant.lastInitial || '',
          timestamp: Date.now()
        }
      });
    }
    
    this.clients.delete(ws);
    
    // Update participant count when someone disconnects
    this.slideState.participantCount = this.clients.size;
    await this.state.storage.put('participantCount', this.slideState.participantCount);
    
    // Broadcast updated participant count
    this.broadcast({
      type: 'participantUpdate',
      data: { count: this.slideState.participantCount }
    });
  }

  private async handleInitSession(request: Request): Promise<Response> {
    const body = await request.json() as { 
      presentationId: string; 
      sessionCode: string; 
      presenterToken?: string 
    };
    const result = await this.initializeSession(
      body.presentationId,
      body.sessionCode,
      body.presenterToken
    );
    return new Response(JSON.stringify(result));
  }
  
  private async handleAddParticipant(request: Request): Promise<Response> {
    const body = await request.json() as { 
      userId: string; 
      isPresenter?: boolean 
    };
    
    try {
      // If SQL is available, use it for participant tracking
      if (this.sql && typeof this.sql.exec === 'function') {
        try {
          // Add participant to SQL
          const id = crypto.randomUUID();
          await this.sql.exec(
            `INSERT OR REPLACE INTO participants (id, user_id, joined_at, last_seen, is_presenter) 
             VALUES (?, ?, ?, ?, ?)`,
            id, body.userId, Date.now(), Date.now(), body.isPresenter ? 1 : 0
          );
          
          // Update participant count
          const countResult = await this.sql.exec(
            `SELECT COUNT(*) as count FROM participants WHERE last_seen > ?`,
            Date.now() - 300000 // Active in last 5 minutes
          );
          
          if (countResult && countResult[0]) {
            this.slideState.participantCount = countResult[0].count;
          }
        } catch (sqlError) {
          console.error('SQL participant tracking failed:', sqlError);
          // Fall back to simple counting
          this.slideState.participantCount = this.clients.size;
        }
      } else {
        // No SQL - just use WebSocket client count
        this.slideState.participantCount = this.clients.size;
      }
      
      // Broadcast participant count
      this.broadcast({
        type: 'participantUpdate',
        data: { count: this.slideState.participantCount }
      });
      
      return new Response(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Failed to add participant:', error);
      return new Response(JSON.stringify({ error: 'Failed to add participant' }), { status: 500 });
    }
  }

  private async handleGoto(request: Request): Promise<Response> {
    const body = await request.json() as { index: number };
    await this.navigateToSlide(body.index);
    return new Response(JSON.stringify({ success: true }));
  }

  private async handleStartPoll(request: Request): Promise<Response> {
    const body = await request.json() as { nodeId?: string; duration?: number };
    
    // Load adventure data if not loaded
    if (!this.slideState.adventureData) {
      await this.loadAdventureData();
    }

    const nodeId = body.nodeId || this.slideState.currentNodeId;
    const node = this.slideState.adventureData?.nodes[nodeId];

    if (!node?.poll) {
      return new Response(JSON.stringify({ error: 'No poll for this node' }), { status: 400 });
    }

    // Create poll in PollRoom
    const pollId = `poll-${nodeId}-${Date.now()}`;
    const pollRoomId = this.env.POLL_ROOM.idFromName('current');
    const pollStub = this.env.POLL_ROOM.get(pollRoomId);

    await pollStub.fetch('http://internal/create', {
      method: 'POST',
      body: JSON.stringify({
        pollId,
        question: node.poll.question,
        options: node.poll.options,
        duration: body.duration || 20000,
        routes: node.poll.routes
      })
    });

    // Broadcast to all clients
    this.broadcast({
      type: 'pollStarted',
      data: {
        pollId,
        question: node.poll.question,
        options: node.poll.options,
        endsAt: Date.now() + (body.duration || 20000)
      }
    });

    return new Response(JSON.stringify({ success: true, pollId }));
  }

  private async handleAdvanceNode(request: Request): Promise<Response> {
    const body = await request.json() as { winnerId: string; pollId: string };
    
    if (!this.slideState.adventureData) {
      await this.loadAdventureData();
    }

    const currentNode = this.slideState.adventureData?.nodes[this.slideState.currentNodeId];
    const nextNodeId = currentNode?.poll?.routes[body.winnerId];

    if (!nextNodeId) {
      return new Response(JSON.stringify({ error: 'No route for winner' }), { status: 400 });
    }

    const nextNode = this.slideState.adventureData?.nodes[nextNodeId];
    if (!nextNode) {
      return new Response(JSON.stringify({ error: 'Next node not found' }), { status: 404 });
    }

    // Update state
    this.slideState.currentNodeId = nextNodeId;
    this.slideState.currentSlideIndex = nextNode.slideIndex;
    this.slideState.history.push(nextNodeId);

    // Save state
    await this.saveState();

    // Broadcast update
    this.broadcast({
      type: 'nodeAdvanced',
      data: {
        nodeId: nextNodeId,
        slideIndex: nextNode.slideIndex,
        history: this.slideState.history
      }
    });

    return new Response(JSON.stringify({ success: true }));
  }

  private async handleGetState(): Promise<Response> {
    return new Response(JSON.stringify(this.slideState));
  }

  private async handleGetPollOptions(): Promise<Response> {
    try {
      // Ensure we have the latest state from storage
      await this.loadState();
      
      // Define all available slide options
      const allSlideOptions = [
        { id: 'workers', label: 'Workers: Baristas Everywhere', slideIndex: 1 },
        { id: 'durable', label: 'Durable Objects: Perfect Memory', slideIndex: 2 },
        { id: 'd1', label: 'D1: Lightweight Database', slideIndex: 3 },
        { id: 'queues', label: 'Queues: Traffic Manager', slideIndex: 4 },
        { id: 'r2', label: 'R2: Zero Egress Storage', slideIndex: 5 },
        { id: 'ai', label: 'AI: Smart Neighbor', slideIndex: 6 },
        { id: 'workflows', label: 'Workflows: Process Orchestra', slideIndex: 7 },
        { id: 'containers', label: 'Containers: Bring Your Runtime', slideIndex: 8 },
        { id: 'loadbalancers', label: 'Load Balancers: Traffic Control', slideIndex: 9 },
        { id: 'aimodels', label: 'AI Models: Brain Trust', slideIndex: 10 },
        { id: 'aiagents', label: 'AI Agents: Digital Workforce', slideIndex: 11 }
      ];

      // Filter out visited slides
      const availableOptions = allSlideOptions.filter(option => 
        !this.slideState.visitedSlides.has(option.slideIndex)
      );

      // If fewer than 3 options, reset visited slides (except current)
      if (availableOptions.length < 3) {
        this.slideState.visitedSlides = new Set([this.slideState.currentSlideIndex]);
        await this.saveState();
        
        // Re-filter with reset visited slides
        const resetOptions = allSlideOptions.filter(option => 
          !this.slideState.visitedSlides.has(option.slideIndex)
        );
        
        return new Response(JSON.stringify({
          question: 'Which Cloudflare product should we explore next?',
          options: resetOptions.slice(0, 3), // Take first 3
          reset: true
        }));
      }

      // Randomly select 3 options from available ones
      const shuffled = availableOptions.sort(() => 0.5 - Math.random());
      const selectedOptions = shuffled.slice(0, Math.min(3, shuffled.length));

      return new Response(JSON.stringify({
        question: 'Which Cloudflare product should we explore next?',
        options: selectedOptions,
        reset: false
      }));
    } catch (error) {
      console.error('Error in handleGetPollOptions:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to get poll options',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleFinale(): Promise<Response> {
    this.broadcast({
      type: 'finale',
      data: {
        message: 'Thanks for joining!',
        contact: {
          github: 'https://github.com/your-username',
          twitter: '@your-handle',
          linkedin: 'your-profile'
        }
      }
    });

    return new Response(JSON.stringify({ success: true }));
  }
  
  private async handlePickPrizeWinner(): Promise<Response> {
    const result = await this.pickRandomParticipant();
    
    if (!result) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No participants available' 
      }), { status: 404 });
    }
    
    // Check if this is an error response
    if (result.error) {
      // Broadcast the "all won" message
      this.broadcast({
        type: 'allWinnersSelected',
        data: {
          message: result.message,
          totalWinners: this.prizeWinners.size
        }
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error,
        message: result.message 
      }), { status: 200 });
    }
    
    const winner = result;
    
    // Broadcast winner to all clients
    this.broadcast({
      type: 'prizeWinner',
      data: {
        winner: {
          firstName: winner.firstName || winner.first_name,
          lastName: winner.lastName || winner.last_name,
          fullName: `${winner.firstName || winner.first_name} ${(winner.lastName || winner.last_name || '').charAt(0)}${(winner.lastName || winner.last_name) ? '.' : ''}`
        },
        timestamp: Date.now(),
        totalWinners: this.prizeWinners.size
      }
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      winner,
      totalWinners: this.prizeWinners.size
    }));
  }
  
  private async pickAndBroadcastPrizeWinner() {
    const result = await this.pickRandomParticipant();
    
    if (result && !result.error) {
      const winner = result;
      console.log(`Broadcasting winner: ${winner.firstName} ${winner.lastName}`);
      this.broadcast({
        type: 'prizeWinner',
        data: {
          winner: {
            firstName: winner.firstName || winner.first_name,
            lastName: winner.lastName || winner.last_name,
            fullName: `${winner.firstName || winner.first_name} ${(winner.lastName || winner.last_name || '').charAt(0)}${(winner.lastName || winner.last_name) ? '.' : ''}`
          },
          timestamp: Date.now(),
          totalWinners: this.prizeWinners.size
        }
      });
    } else if (result && result.error === 'all_won') {
      console.log('Broadcasting all winners selected message');
      this.broadcast({
        type: 'allWinnersSelected',
        data: {
          message: result.message,
          totalWinners: this.prizeWinners.size
        }
      });
    } else {
      // No participants available
      console.log('No participants to select from - not broadcasting anything');
      // Optionally, we could broadcast a message to the presenter
      this.broadcast({
        type: 'noParticipants',
        data: {
          message: 'No participants available. Make sure audience members have joined from their phones.'
        }
      });
    }
  }
  
  private async pickRandomParticipant() {
    console.log('Starting prize winner selection...');
    console.log(`Prize winners so far: ${this.prizeWinners.size}`);
    
    // Get participants excluding previous winners
    const participants = await this.getActiveParticipants(true);
    console.log(`Eligible participants for prize: ${participants.length}`);
    
    if (participants.length === 0) {
      // Check if all participants have won
      const allParticipants = await this.getActiveParticipants(false);
      console.log(`Total participants (including winners): ${allParticipants.length}`);
      
      if (allParticipants.length > 0 && this.prizeWinners.size > 0) {
        console.log('All participants have already won prizes!');
        return { 
          error: 'all_won', 
          message: 'All participants have already won prizes!' 
        };
      } else {
        console.log('No participants available for prize selection');
        console.log('Make sure audience members have joined from their phones');
        return null;
      }
    }
    
    // Pick a random participant
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];
    
    // Add winner to the set and save
    this.prizeWinners.add(winner.id);
    await this.savePrizeWinners();
    
    console.log(`Prize winner selected: ${winner.firstName || winner.first_name} ${winner.lastName || winner.last_name} (ID: ${winner.id})`);
    console.log(`Total winners so far: ${this.prizeWinners.size}`);
    
    return winner;
  }

  private async handleVote(request: Request): Promise<Response> {
    const body = await request.json() as { pollId: string; optionId: string; userId: string };
    
    console.log('Vote received:', body);
    
    if (!this.activePoll || this.activePoll.pollId !== body.pollId) {
      // Load from storage if not in memory
      const storedPoll = await this.state.storage.get('activePoll');
      if (storedPoll) {
        this.activePoll = storedPoll as any;
        console.log('Loaded poll from storage');
      }
    }
    
    if (!this.activePoll || this.activePoll.pollId !== body.pollId) {
      return new Response(JSON.stringify({ error: 'Poll not active' }), { status: 400 });
    }
    
    // Track voters in memory if SQL is not available
    if (!this.activePoll.voters) {
      this.activePoll.voters = new Set<string>();
    }
    
    // Check if user already voted
    if (this.activePoll.voters instanceof Set && this.activePoll.voters.has(body.userId)) {
      return new Response(JSON.stringify({ error: 'Already voted' }), { status: 400 });
    }
    
    try {
      // Try to use SQL if available
      if (this.sql && typeof this.sql.exec === 'function') {
        try {
          // Check if user already voted using SQL
          const existingVote = await this.sql.exec(
            `SELECT * FROM poll_votes WHERE poll_id = ? AND user_id = ?`,
            body.pollId, body.userId
          );
          
          if (existingVote && existingVote.length > 0) {
            return new Response(JSON.stringify({ error: 'Already voted' }), { status: 400 });
          }
          
          // Record vote in SQL
          const voteId = crypto.randomUUID();
          await this.sql.exec(
            `INSERT INTO poll_votes (id, poll_id, user_id, option_id, voted_at) 
             VALUES (?, ?, ?, ?, ?)`,
            voteId, body.pollId, body.userId, body.optionId, Date.now()
          );
          
          // Get updated vote counts from SQL for accuracy
          const voteCounts = await this.sql.exec(
            `SELECT option_id, COUNT(*) as count 
             FROM poll_votes 
             WHERE poll_id = ? 
             GROUP BY option_id`,
            body.pollId
          );
          
          if (voteCounts && Array.isArray(voteCounts)) {
            // Reset votes and update from SQL
            Object.keys(this.activePoll.votes).forEach(key => {
              this.activePoll.votes[key] = 0;
            });
            
            voteCounts.forEach((row: any) => {
              if (row.option_id && row.count !== undefined) {
                this.activePoll.votes[row.option_id] = row.count;
              }
            });
          } else {
            // SQL succeeded but format unexpected, just increment in-memory
            this.activePoll.votes[body.optionId] = (this.activePoll.votes[body.optionId] || 0) + 1;
          }
        } catch (sqlError) {
          console.error('SQL vote recording failed, using in-memory:', sqlError);
          // SQL failed, increment in-memory count
          this.activePoll.votes[body.optionId] = (this.activePoll.votes[body.optionId] || 0) + 1;
        }
      } else {
        // No SQL available, just use in-memory counting
        this.activePoll.votes[body.optionId] = (this.activePoll.votes[body.optionId] || 0) + 1;
      }
      
      // Add to voters set
      if (this.activePoll.voters instanceof Set) {
        this.activePoll.voters.add(body.userId);
      } else {
        this.activePoll.voters = new Set([body.userId]);
      }
      
      console.log('Vote recorded. Current votes:', this.activePoll.votes);
      
      // Save to storage
      await this.state.storage.put('activePoll', this.activePoll);
      
      // Broadcast updated vote counts immediately
      this.broadcast({
        type: 'pollUpdate',
        data: {
          pollId: this.activePoll.pollId,
          votes: this.activePoll.votes
        }
      });
      
      console.log('Broadcasted poll update to all clients');
      
      return new Response(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Failed to record vote:', error);
      return new Response(JSON.stringify({ error: 'Failed to record vote' }), { status: 500 });
    }
  }

  private getSlideData(index: number) {
    // If we have presentation data from D1, use it
    if (this.presentationData && this.presentationData.length > 0) {
      // Sort slides by order_number to ensure correct sequence
      const sortedSlides = [...this.presentationData].sort((a: any, b: any) => a.order_number - b.order_number);
      
      // Ensure index is within bounds
      if (index >= sortedSlides.length) {
        console.warn(`Slide index ${index} out of bounds (max: ${sortedSlides.length - 1})`);
        return {
          title: 'End of Presentation',
          content: ['Thank you for attending!'],
          bullets: [],
          totalSlides: sortedSlides.length
        };
      }
      
      // Get slide by index position (not order_number)
      const slide = sortedSlides[index];
      if (slide) {
        // Check if this slide is being restored to original content
        const isAIPoll = slide.slide_type === 'ai_poll';
        const hasGeneratedContent = this.slideState.generatedContent?.has(index);
        const originalContent = this.slideState.originalSlideContent?.get(index);
        
        // Determine what content to show
        let displayContent = {
          title: slide.title,
          content: slide.content ? JSON.parse(slide.content) : [],
          bullets: slide.bullets ? JSON.parse(slide.bullets) : []
        };
        
        // If this is an AI Poll slide, include special handling
        if (isAIPoll) {
          // Check if we should show generated content or original
          if (hasGeneratedContent) {
            // Show generated content state
            const generatedData = this.slideState.generatedContent?.get(index);
            displayContent = {
              ...displayContent,
              hasGeneratedContent: true,
              generatedContent: generatedData,
              restoreOriginal: false
            } as any;
          } else if (originalContent) {
            // Restore original content
            displayContent = {
              ...originalContent,
              restoreOriginal: true
            } as any;
          }
        }
        
        return {
          ...displayContent,
          gif: slide.gif && slide.gif !== 'null' ? slide.gif : null,
          isBioSlide: slide.is_bio_slide === 1,
          slideType: slide.slide_type,
          slide_type: slide.slide_type, // Include both for compatibility
          pollQuestion: slide.poll_question,
          pollOptions: slide.poll_options ? JSON.parse(slide.poll_options) : null,
          pollRoutes: slide.poll_routes ? JSON.parse(slide.poll_routes) : null,
          ai_poll_prompts: slide.ai_poll_prompts, // Include AI poll prompts
          totalSlides: sortedSlides.length
        };
      }
    }
    
    // No fallback - if no D1 data, return empty slide
    console.warn('No presentation data loaded from D1');
    return {
      title: 'Loading...',
      content: ['Presentation data is being loaded'],
      bullets: [],
      totalSlides: 0
    };
    
    // DISABLED: Old fallback data (only shown for reference)
    /*const slideData = [
      {
        title: 'Welcome to the Edge! ⚡',
        content: ['Cloudflare Workers: Choose Your Own Adventure'],
        bullets: []
      },
      {
        title: "Workers: Your Monolith's Best Friend ⚡",
        content: ['Offload heavy lifting without rewriting everything'],
        bullets: [
          '🎯 Deploy API endpoints in 5 seconds, globally',
          '💡 0ms cold starts - faster than Lambda\'s 100-1000ms',
          '🔥 Handle 10 million requests for ~$5',
          '✨ Perfect for: auth middleware, image optimization, API rate limiting'
        ]
      },
      {
        title: 'Durable Objects: Stateful Magic 🎯',
        content: ['Single-threaded JavaScript with guaranteed consistency'],
        bullets: [
          '🎯 Build real-time features WITHOUT Redis/Socket.io',
          '💡 Handles 1000+ WebSocket connections per object',
          '🔥 Automatic regional failover with state intact',
          '✨ This presentation runs on it - polls, votes, sync!'
        ]
      },
      {
        title: 'D1: SQLite Goes Global 💾',
        content: ["Your monolith's read-heavy queries, but faster"],
        bullets: [
          '🎯 5ms read latency from anywhere on Earth',
          '💡 Import your existing SQLite DB in one command',
          '🔥 Free tier: 5GB storage + 5 billion reads/month',
          '✨ Perfect for: user preferences, config, session data'
        ]
      },
      {
        title: 'Queues: Decouple Your Monolith 🚦',
        content: ['Process heavy tasks without blocking your main app'],
        bullets: [
          '🎯 Process up to 100 messages/second per queue',
          '💡 Automatic retries with exponential backoff built-in',
          '🔥 Batch up to 100 messages - save 90% on processing',
          '✨ Perfect for: email sending, PDF generation, webhooks'
        ]
      },
      {
        title: 'R2: Escape the AWS Egress Tax 🗄️',
        content: ['S3-compatible storage with ZERO egress fees'],
        bullets: [
          '🎯 Save 80%+ on storage costs vs S3',
          '💡 Automatic image resizing with Workers',
          '🔥 10GB free storage + 10M requests/month',
          '✨ One company saved $370k/year just by switching!'
        ]
      },
      {
        title: 'AI: No GPU Required 🤖',
        content: ['Add AI features without infrastructure headaches'],
        bullets: [
          '🎯 Run Llama, Mistral, Stable Diffusion at the edge',
          '💡 50ms inference latency globally',
          '🔥 $0.01 per 1000 neurons - 10x cheaper than OpenAI',
          '✨ Perfect for: content moderation, personalization, search'
        ]
      },
      {
        title: 'Workflows: Background Jobs That Actually Work 🎭',
        content: ['Replace your job queues with durable workflows'],
        bullets: [
          '🎯 Sleep for days/months without consuming resources',
          '💡 Automatic replay from any step on failure',
          '🔥 Built-in observability - see every step in UI',
          '✨ Perfect for: payment processing, data pipelines, onboarding'
        ]
      },
      {
        title: 'Containers: Your Monolith, But Global 📦',
        content: ['Run your existing Docker containers at the edge'],
        bullets: [
          '🎯 Deploy your monolith to 300+ cities instantly',
          '💡 GPU support - run AI models at the edge',
          '🔥 Mix Workers + Containers in same request',
          '✨ Perfect for: Python/Ruby apps, ML models, legacy code'
        ]
      },
      {
        title: 'Load Balancers: Smart Traffic Routing 🎮',
        content: ['Route users to the best server automatically'],
        bullets: [
          '🎯 Instant failover - 0 second downtime',
          '💡 Geo-steering: EU users → EU servers automatically',
          '🔥 Health checks every 15 seconds from 300+ locations',
          '✨ Perfect for: blue-green deployments, A/B testing'
        ]
      },
      {
        title: 'AI Models: OpenAI Alternative at the Edge 🧠',
        content: ['Run LLMs without API keys or rate limits'],
        bullets: [
          '🎯 Llama 3.1 70B, Mistral, and more built-in',
          '💡 Generate images in <2 seconds globally',
          '🔥 Embeddings API: 50M tokens for $1',
          '✨ No cold starts - models always warm'
        ]
      },
      {
        title: 'AI Agents: Autonomous Workers 🤖',
        content: ['Build agents that interact with your APIs'],
        bullets: [
          '🎯 Connect to your monolith APIs via tool calling',
          '💡 Built-in memory and context management',
          '🔥 Chain multiple models for complex tasks',
          '✨ Perfect for: customer support, data extraction, testing'
        ]
      },
      {
        title: 'Thanks for Joining! 🙏',
        content: ['Connect with me'],
        bullets: [],
        isBioSlide: true
      }
    ];
    
    return slideData[index] || { 
      title: `Slide ${index + 1}`,
      content: [],
      bullets: []
    };*/
  }
  
  private async navigateToSlide(index: number) {
    // Ensure presentation data is loaded
    if (!this.presentationData || this.presentationData.length === 0) {
      console.error('Cannot navigate - no presentation data loaded');
      if (this.slideState.presentationId) {
        // Try to load it
        await this.loadPresentationFromD1(this.slideState.presentationId);
      }
      if (!this.presentationData || this.presentationData.length === 0) {
        return; // Still no data, can't navigate
      }
    }
    
    const totalSlides = this.presentationData.length;
    
    // Ensure index is within bounds
    if (index < 0) {
      index = 0;
    } else if (index >= totalSlides) {
      console.log(`Navigation requested to slide ${index}, but only ${totalSlides} slides available`);
      index = totalSlides - 1; // Stay on last slide
    }
    
    // Check if the target slide has generated AI content
    const targetSlide = this.presentationData[index];
    const hasGeneratedContent = this.slideState.generatedContent?.has(index);
    
    // Check if we're leaving a slide that had AI content generated
    const previousIndex = this.slideState.currentSlideIndex;
    const previousSlide = this.presentationData[previousIndex];
    const wasAIPoll = previousSlide && previousSlide.slide_type === 'ai_poll';
    
    this.slideState.currentSlideIndex = index;
    this.slideState.visitedSlides.add(index); // Track visited slide
    await this.saveState();
    
    const currentSlide = this.getSlideData(index);
    
    this.broadcast({
      type: 'slideChanged',
      data: { 
        index,
        ...currentSlide
      }
    });
  }

  private async saveState() {
    // Convert Set to Array for JSON serialization
    const stateToStore = {
      ...this.slideState,
      visitedSlides: Array.from(this.slideState.visitedSlides)
    };
    await this.state.storage.put('slideState', stateToStore);
  }

  private async startPollForCurrentNode() {
    if (!this.slideState.adventureData) {
      await this.loadAdventureData();
    }

    const node = this.slideState.adventureData?.nodes[this.slideState.currentNodeId];
    if (!node?.poll) return;

    // Delegate to handleStartPoll
    await this.handleStartPoll(new Request('http://internal/startPoll', {
      method: 'POST',
      body: JSON.stringify({})
    }));
  }

  private async forcePickWinner(optionId?: string, strategy?: 'highest' | 'random') {
    const pollRoomId = this.env.POLL_ROOM.idFromName('current');
    const pollStub = this.env.POLL_ROOM.get(pollRoomId);

    await pollStub.fetch('http://internal/pickWinner', {
      method: 'POST',
      body: JSON.stringify({ optionId, strategy })
    });
  }

  private async loadAdventureData() {
    const adventureFile = await this.env.ASSETS_BUCKET.get('adventure.json');
    if (adventureFile) {
      this.slideState.adventureData = await adventureFile.json();
    }
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    const deadClients = new Set<WebSocket>();
    
    this.clients.forEach(client => {
      try {
        // Check if WebSocket is still open
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(messageStr);
        } else {
          console.log('Client not open, readyState:', client.readyState);
          deadClients.add(client);
        }
      } catch (error) {
        console.error('Broadcast error:', error);
        deadClients.add(client);
      }
    });
    
    // Clean up dead clients
    deadClients.forEach(client => {
      this.clients.delete(client);
      console.log('Removed dead client, remaining clients:', this.clients.size);
    });
    
    // Update participant count if changed
    if (deadClients.size > 0) {
      this.slideState.participantCount = this.clients.size;
      this.broadcast({
        type: 'participantUpdate',
        data: { count: this.slideState.participantCount }
      });
    }
  }

  private async startNewPoll(pollData: any) {
    console.log('Starting new poll with data:', pollData);
    
    // If poll has routes (from database), map them to slide indices
    if (pollData.pollRoutes && this.presentationData && this.presentationData.length > 0) {
      const sortedSlides = [...this.presentationData].sort((a: any, b: any) => a.order_number - b.order_number);
      
      // Map each option to include the correct slideIndex based on the route
      pollData.options = pollData.options.map((option: any) => {
        const routeSlideId = pollData.pollRoutes[option.id];
        if (routeSlideId) {
          // Find the slide index for this ID
          const slideIndex = sortedSlides.findIndex((slide: any) => slide.id === routeSlideId);
          if (slideIndex !== -1) {
            option.slideIndex = slideIndex;
            console.log(`Mapped poll option ${option.id} to slide index ${slideIndex}`);
          }
        }
        return option;
      });
    }
    
    // Store active poll
    this.activePoll = {
      ...pollData,
      votes: {},
      voters: new Set<string>(),
      startTime: Date.now(),
      isAIPoll: pollData.isAIPoll || false  // Preserve AI poll flag
    };
    
    // Initialize vote counts
    pollData.options.forEach((option: any) => {
      this.activePoll.votes[option.id] = 0;
    });
    
    // Store in durable object storage
    await this.state.storage.put('activePoll', this.activePoll);
    
    // Broadcast poll start to all clients
    console.log(`Broadcasting pollStart to ${this.clients.size} clients`);
    this.broadcast({
      type: 'pollStart',
      data: pollData
    });
    
    // Set up timer to end poll
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(() => {
      this.endPoll();
    }, (pollData.duration || 20) * 1000);
    
    // Also set up interval to broadcast updates
    const updateInterval = setInterval(() => {
      if (!this.activePoll) {
        clearInterval(updateInterval);
        return;
      }
      
      // Broadcast current vote tallies
      this.broadcast({
        type: 'pollUpdate',
        data: {
          pollId: this.activePoll.pollId,
          votes: this.activePoll.votes
        }
      });
    }, 1000);
    
    // Store interval to clear later
    this.activePoll.updateInterval = updateInterval;
  }
  
  private async endPoll() {
    if (!this.activePoll) return;
    
    // Clear timers
    if (this.activePoll.updateInterval) {
      clearInterval(this.activePoll.updateInterval);
    }
    
    // Find winner(s) - handle ties
    let maxVotes = 0;
    let winners: string[] = [];
    Object.entries(this.activePoll.votes).forEach(([optionId, votes]: [string, any]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winners = [optionId];
      } else if (votes === maxVotes && votes > 0) {
        winners.push(optionId);
      }
    });
    
    // If there's a tie, choose randomly from unvisited slides
    let finalWinner = null;
    if (winners.length > 1) {
      // Get slide indices for the tied winners
      const winnerSlideIndices = winners.map(optionId => {
        const option = this.activePoll.options.find((o: any) => o.id === optionId);
        return this.getSlideIndexFromOption(option);
      }).filter(index => index !== null && !this.slideState.visitedSlides.has(index));
      
      if (winnerSlideIndices.length > 0) {
        // Choose randomly from unvisited tied options
        const randomIndex = Math.floor(Math.random() * winnerSlideIndices.length);
        const chosenSlideIndex = winnerSlideIndices[randomIndex];
        finalWinner = winners.find(optionId => {
          const option = this.activePoll.options.find((o: any) => o.id === optionId);
          return this.getSlideIndexFromOption(option) === chosenSlideIndex;
        });
      } else {
        // All tied options are visited, just pick the first one
        finalWinner = winners[0];
      }
    } else if (winners.length === 1) {
      finalWinner = winners[0];
    }
    
    // Get winning option details
    const winningOption = this.activePoll.options.find((o: any) => o.id === finalWinner);
    const nextTopic = winningOption ? winningOption.label : 'Next Topic';
    
    // Check if this is an AI Poll
    const sortedSlides = [...this.presentationData].sort((a: any, b: any) => a.order_number - b.order_number);
    const currentSlide = sortedSlides[this.slideState.currentSlideIndex];
    const isAIPoll = this.activePoll.isAIPoll || (currentSlide && currentSlide.slide_type === 'ai_poll');
    
    if (isAIPoll && winningOption && currentSlide.ai_poll_prompts) {
      // Store original slide content before generating AI content
      if (!this.slideState.originalSlideContent?.has(this.slideState.currentSlideIndex)) {
        this.slideState.originalSlideContent?.set(this.slideState.currentSlideIndex, {
          title: currentSlide.title,
          content: currentSlide.content,
          bullets: currentSlide.bullets
        });
      }
      
      // Parse AI poll prompts
      const aiPrompts = JSON.parse(currentSlide.ai_poll_prompts);
      const winningPrompt = aiPrompts[finalWinner];
      
      if (winningPrompt) {
        // Broadcast poll end with AI generation pending
        this.broadcast({
          type: 'pollEnd',
          data: {
            pollId: this.activePoll.pollId,
            winner: finalWinner,
            votes: this.activePoll.votes,
            nextTopic,
            isTie: winners.length > 1,
            isAIPoll: true,
            aiGenerationPending: true,
            winningOption: {
              key: winningPrompt.key,
              type: winningPrompt.type
            }
          }
        });
        
        // Trigger AI content generation
        await this.generateAIContent(winningPrompt, currentSlide, finalWinner);
      }
    } else {
      // Navigate to the winning slide for regular polls
      if (winningOption) {
        const nextSlideIndex = this.getSlideIndexFromOption(winningOption);
        if (nextSlideIndex !== null) {
          await this.navigateToSlide(nextSlideIndex);
        }
      }
      
      // Broadcast regular poll end
      this.broadcast({
        type: 'pollEnd',
        data: {
          pollId: this.activePoll.pollId,
          winner: finalWinner,
          votes: this.activePoll.votes,
          nextTopic,
          isTie: winners.length > 1
        }
      });
    }
    
    // Clear active poll
    this.activePoll = null;
    this.pollTimer = null;
  }
  
  private async generateAIContent(prompt: any, slide: any, optionId: string) {
    try {
      // Initialize AI content generator
      const aiGenerator = new AIContentGenerator(this.env);
      
      // Get presentation name for slug
      const presentationName = this.presentationInfo?.name || 'presentation';
      const presentationSlug = slugify(presentationName);
      
      // Generate AI content
      const generatedContent = await aiGenerator.generateContent(
        {
          id: optionId,
          ...prompt
        },
        this.slideState.presentationId || '',
        presentationSlug,
        slide.id,
        this.slideState.sessionCode || 'default'
      );
      
      // Store generated content
      this.slideState.generatedContent?.set(this.slideState.currentSlideIndex, generatedContent);
      
      // Broadcast AI content to all clients
      this.broadcast({
        type: 'aiContentGenerated',
        data: {
          slideIndex: this.slideState.currentSlideIndex,
          content: generatedContent,
          optionKey: prompt.key
        }
      });
      
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      
      // Broadcast error
      this.broadcast({
        type: 'aiGenerationError',
        data: {
          error: 'Failed to generate AI content'
        }
      });
    }
  }
  
  private getSlideIndexFromOption(option: any): number | null {
    if (!option) return null;
    
    // Use the slideIndex from the option itself (set by handleGetPollOptions)
    return option.slideIndex || null;
  }
  
  async alarm() {
    // Could be used for auto-advance or other timed actions
    if (this.activePoll) {
      await this.endPoll();
    }
  }
}