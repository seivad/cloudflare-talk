interface Env {
  DB: D1Database;
  SLIDE_ROOM: DurableObjectNamespace;
  VOTE_QUEUE: Queue;
}

interface Poll {
  pollId: string;
  question: string;
  options: Array<{
    id: string;
    label: string;
    emoji?: string;
  }>;
  routes?: Record<string, string>;
  startedAt: number;
  endsAt: number;
  duration: number;
  isActive: boolean;
  winner?: string;
  finalTallies?: Record<string, number>;
}

interface VoteTally {
  [optionId: string]: number;
}

export class PollRoom {
  private state: DurableObjectState;
  private env: Env;
  private clients: Set<WebSocket>;
  private currentPoll: Poll | null;
  private voteTallies: VoteTally;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
    this.currentPoll = null;
    this.voteTallies = {};
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for real-time updates
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      this.state.acceptWebSocket(server);
      this.clients.add(server);

      // Send current poll state to new client
      if (this.currentPoll) {
        server.send(JSON.stringify({
          type: 'pollState',
          data: {
            poll: this.currentPoll,
            tallies: this.voteTallies
          }
        }));
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    // Internal API endpoints
    switch (url.pathname) {
      case '/internal/create':
        return this.handleCreatePoll(request);
      case '/internal/updateTally':
        return this.handleUpdateTally(request);
      case '/internal/pickWinner':
        return this.handlePickWinner(request);
      case '/internal/end':
        return this.handleEndPoll();
      case '/internal/state':
        return this.handleGetState();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.clients.delete(ws);
  }

  private async handleCreatePoll(request: Request): Promise<Response> {
    const body = await request.json() as {
      pollId: string;
      question: string;
      options: Array<{ id: string; label: string; emoji?: string }>;
      duration: number;
      routes?: Record<string, string>;
    };

    // End current poll if active
    if (this.currentPoll?.isActive) {
      await this.endPoll();
    }

    // Create new poll
    this.currentPoll = {
      pollId: body.pollId,
      question: body.question,
      options: body.options,
      routes: body.routes,
      startedAt: Date.now(),
      endsAt: Date.now() + body.duration,
      duration: body.duration,
      isActive: true
    };

    // Initialize tallies
    this.voteTallies = {};
    body.options.forEach(option => {
      this.voteTallies[option.id] = 0;
    });

    // Save to D1
    await this.savePollToDatabase();

    // Set alarm for auto-end
    await this.state.storage.setAlarm(new Date(this.currentPoll.endsAt));

    // Broadcast poll start
    this.broadcast({
      type: 'pollStarted',
      data: {
        poll: this.currentPoll,
        tallies: this.voteTallies
      }
    });

    return new Response(JSON.stringify({ success: true, poll: this.currentPoll }));
  }

  private async handleUpdateTally(request: Request): Promise<Response> {
    const body = await request.json() as {
      pollId: string;
      optionId: string;
      increment: number;
    };

    if (!this.currentPoll || this.currentPoll.pollId !== body.pollId || !this.currentPoll.isActive) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive poll' }), { status: 400 });
    }

    // Update tally
    if (this.voteTallies[body.optionId] !== undefined) {
      this.voteTallies[body.optionId] += body.increment;
    }

    // Broadcast update
    this.broadcast({
      type: 'tallyUpdate',
      data: {
        pollId: body.pollId,
        tallies: this.voteTallies,
        timeRemaining: Math.max(0, this.currentPoll.endsAt - Date.now())
      }
    });

    return new Response(JSON.stringify({ success: true }));
  }

  private async handlePickWinner(request: Request): Promise<Response> {
    const body = await request.json() as {
      optionId?: string;
      strategy?: 'highest' | 'random';
    };

    if (!this.currentPoll || !this.currentPoll.isActive) {
      return new Response(JSON.stringify({ error: 'No active poll' }), { status: 400 });
    }

    let winner: string;

    if (body.optionId) {
      // Manual selection
      winner = body.optionId;
    } else if (body.strategy === 'random') {
      // Random selection
      const options = this.currentPoll.options;
      winner = options[Math.floor(Math.random() * options.length)].id;
    } else {
      // Highest votes (default)
      winner = this.getHighestVotedOption();
    }

    // End poll with winner
    await this.endPoll(winner);

    return new Response(JSON.stringify({ success: true, winner }));
  }

  private async handleEndPoll(): Promise<Response> {
    if (!this.currentPoll || !this.currentPoll.isActive) {
      return new Response(JSON.stringify({ error: 'No active poll' }), { status: 400 });
    }

    const winner = this.getHighestVotedOption();
    await this.endPoll(winner);

    return new Response(JSON.stringify({ success: true, winner }));
  }

  private async handleGetState(): Promise<Response> {
    return new Response(JSON.stringify({
      poll: this.currentPoll,
      tallies: this.voteTallies
    }));
  }

  private async endPoll(winner?: string) {
    if (!this.currentPoll) return;

    // Determine winner if not provided
    if (!winner) {
      winner = this.getHighestVotedOption();
    }

    // Update poll state
    this.currentPoll.isActive = false;
    this.currentPoll.winner = winner;
    this.currentPoll.finalTallies = { ...this.voteTallies };

    // Save final state to database
    await this.updatePollInDatabase();

    // Broadcast poll end
    this.broadcast({
      type: 'pollEnded',
      data: {
        pollId: this.currentPoll.pollId,
        winner,
        finalTallies: this.voteTallies,
        winnerLabel: this.currentPoll.options.find(o => o.id === winner)?.label
      }
    });

    // Notify SlideRoom to advance if routes exist
    if (this.currentPoll.routes && winner) {
      const slideRoomId = this.env.SLIDE_ROOM.idFromName('main');
      const slideStub = this.env.SLIDE_ROOM.get(slideRoomId);
      
      await slideStub.fetch('http://internal/advanceNode', {
        method: 'POST',
        body: JSON.stringify({
          winnerId: winner,
          pollId: this.currentPoll.pollId
        })
      });
    }

    // Clear alarm
    await this.state.storage.deleteAlarm();
  }

  private getHighestVotedOption(): string {
    let maxVotes = -1;
    let winner = this.currentPoll?.options[0].id || '';

    for (const [optionId, votes] of Object.entries(this.voteTallies)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = optionId;
      }
    }

    return winner;
  }

  private async savePollToDatabase() {
    if (!this.currentPoll) return;

    await this.env.DB.prepare(
      'INSERT INTO polls (id, question, created_at, ended_at) VALUES (?, ?, ?, NULL)'
    ).bind(
      this.currentPoll.pollId,
      this.currentPoll.question,
      this.currentPoll.startedAt
    ).run();

    for (const option of this.currentPoll.options) {
      await this.env.DB.prepare(
        'INSERT INTO poll_options (id, poll_id, label, display_order) VALUES (?, ?, ?, ?)'
      ).bind(
        option.id,
        this.currentPoll.pollId,
        option.label,
        this.currentPoll.options.indexOf(option)
      ).run();
    }
  }

  private async updatePollInDatabase() {
    if (!this.currentPoll) return;

    await this.env.DB.prepare(
      'UPDATE polls SET ended_at = ?, winner_option_id = ? WHERE id = ?'
    ).bind(
      Date.now(),
      this.currentPoll.winner,
      this.currentPoll.pollId
    ).run();
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      try {
        client.send(messageStr);
      } catch (error) {
        this.clients.delete(client);
      }
    });
  }

  async alarm() {
    // Auto-end poll when timer expires
    if (this.currentPoll?.isActive) {
      await this.endPoll();
    }
  }
}