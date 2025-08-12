interface Env {
  ASSETS_BUCKET: R2Bucket;
  POLL_ROOM: DurableObjectNamespace;
}

interface SlideState {
  currentSlideIndex: number;
  currentNodeId: string;
  history: string[];
  adventureData?: any;
  participantCount: number;
  visitedSlides: Set<number>;
}

export class SlideRoom {
  private state: DurableObjectState;
  private env: Env;
  private clients: Set<WebSocket>;
  private slideState: SlideState;
  private activePoll: any;
  private pollTimer: any;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
    this.slideState = {
      currentSlideIndex: 0,
      currentNodeId: 'start',
      history: ['start'],
      participantCount: 0,
      visitedSlides: new Set([0]) // Start with welcome slide as visited
    };
  }

  private async loadState() {
    const storedState = await this.state.storage.get('slideState');
    if (storedState) {
      this.slideState = {
        ...storedState as any,
        visitedSlides: new Set((storedState as any).visitedSlides || [0])
      };
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log('SlideRoom received request:', url.pathname);

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
          currentSlide: slideInfo
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
        case 'startPoll':
          // Start a new poll
          await this.startNewPoll(data.data);
          break;
        case 'pickWinner':
          await this.forcePickWinner(data.optionId, data.strategy);
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
          console.log('Client joined room:', data.roomId);
          const currentSlide = this.getSlideData(this.slideState.currentSlideIndex);
          ws.send(JSON.stringify({
            type: 'state',
            data: {
              ...this.slideState,
              currentSlide
            }
          }));
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  }

  async webSocketClose(ws: WebSocket) {
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
        duration: body.duration || 30000,
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
        endsAt: Date.now() + (body.duration || 30000)
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
        message: error.toString()
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
    
    // Check if user already voted
    if (!this.activePoll.voters) {
      this.activePoll.voters = new Set<string>();
    }
    
    if (this.activePoll.voters.has && this.activePoll.voters.has(body.userId)) {
      return new Response(JSON.stringify({ error: 'Already voted' }), { status: 400 });
    }
    
    // Record vote
    this.activePoll.votes[body.optionId] = (this.activePoll.votes[body.optionId] || 0) + 1;
    if (this.activePoll.voters.add) {
      this.activePoll.voters.add(body.userId);
    } else {
      // If voters is not a Set (from storage), convert it
      this.activePoll.voters = new Set(Array.from(this.activePoll.voters as any));
      this.activePoll.voters.add(body.userId);
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
  }

  private getSlideData(index: number) {
    const slideData = [
      {
        title: 'Welcome to the Edge! ⚡',
        content: ['Cloudflare Workers: Choose Your Own Adventure'],
        bullets: []
      },
      {
        title: 'Workers: Baristas Everywhere ⚡',
        content: ['Tiny, serverless functions that run everywhere.'],
        bullets: [
          'Cold starts? Basically non-existent',
          'No servers to manage - focus on code',
          'Runs within 50ms of your users'
        ]
      },
      {
        title: 'Durable Objects: Perfect Memory 🎯',
        content: ['Remembers everything across the globe.'],
        bullets: [
          'Single source of truth',
          'WebSocket coordination',
          'State that survives',
          'Perfect for: real-time games, collaboration'
        ]
      },
      {
        title: 'D1: Your Lightweight Database 💾',
        content: ['SQLite-compatible at the edge'],
        bullets: [
          'Perfect for smaller, quick queries',
          'Read replicas globally distributed',
          'Automatic backups'
        ]
      },
      {
        title: 'Queues: Your Traffic Manager 🚦',
        content: ['Only lets in the right number of people'],
        bullets: [
          'Smooth traffic spikes',
          'Automatic retries',
          'Dead letter queues',
          'Batch processing'
        ]
      },
      {
        title: 'R2: Zero Egress Storage 🗄️',
        content: ['Your own attic - grab anything free!'],
        bullets: [
          'S3-compatible API',
          'ZERO egress fees',
          'Automatic replication',
          'Perfect for: images, backups, datasets'
        ]
      },
      {
        title: 'AI: Your Smart Neighbor 🤖',
        content: ['Smart neighbor next door - Instant feedback!'],
        bullets: [
          'Run inference close to users',
          'Low latency responses',
          'Multiple model support',
          'Pay per inference'
        ]
      },
      {
        title: 'Workflows: Your Process Orchestra 🎭',
        content: ['Orchestrate complex, long-running processes with ease'],
        bullets: [
          'Built-in retries and error handling',
          'Durable execution across restarts',
          'Human-in-the-loop approvals',
          'Perfect for: ETL, batch jobs, multi-step APIs'
        ]
      },
      {
        title: 'Containers: Bring Your Own Runtime 📦',
        content: ['Run any Docker container at the edge'],
        bullets: [
          'Full compatibility with existing containers',
          'GPU support for ML workloads',
          'Seamless integration with Workers',
          'Perfect for: legacy apps, custom runtimes'
        ]
      },
      {
        title: 'Load Balancers: Traffic Control Tower 🎮',
        content: ['Intelligent traffic distribution across the globe'],
        bullets: [
          'Health checks and failover',
          'Geographic steering',
          'Session affinity',
          'Perfect for: multi-region apps, zero downtime'
        ]
      },
      {
        title: 'AI Models: Your Brain Trust 🧠',
        content: ['Pre-trained models ready to use instantly'],
        bullets: [
          'LLMs, image generation, embeddings',
          'No infrastructure to manage',
          'Pay per inference, not idle time',
          'Perfect for: chat, vision, translation'
        ]
      },
      {
        title: 'AI Agents: Your Digital Workforce 🤖',
        content: ['Autonomous agents that think and act'],
        bullets: [
          'Tool calling and function execution',
          'Multi-step reasoning',
          'Context-aware responses',
          'Perfect for: automation, support, analysis'
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
    };
  }
  
  private async navigateToSlide(index: number) {
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
    
    // Store active poll
    this.activePoll = {
      ...pollData,
      votes: {},
      voters: new Set<string>(),
      startTime: Date.now()
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
    }, (pollData.duration || 30) * 1000);
    
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
    
    // Navigate to the winning slide
    if (winningOption) {
      const nextSlideIndex = this.getSlideIndexFromOption(winningOption);
      if (nextSlideIndex !== null) {
        await this.navigateToSlide(nextSlideIndex);
      }
    }
    
    // Broadcast poll end
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
    
    // Clear active poll
    this.activePoll = null;
    this.pollTimer = null;
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