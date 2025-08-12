interface ContainerState {
  currentStep: 'idle' | 'finding' | 'zipping' | 'uploading' | 'done' | 'error';
  startedAt?: number;
  completedAt?: number;
  progress: number;
  message?: string;
  resultUrl?: string;
}

export class ContainerStatus {
  private state: DurableObjectState;
  private env: any;
  private clients: Set<WebSocket>;
  private containerState: ContainerState;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
    this.containerState = {
      currentStep: 'idle',
      progress: 0
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for real-time status updates
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      this.state.acceptWebSocket(server);
      this.clients.add(server);

      // Send initial state to new client
      server.send(JSON.stringify({
        type: 'containerStatus',
        data: this.containerState
      }));

      return new Response(null, { status: 101, webSocket: client });
    }

    // Internal API endpoints
    switch (url.pathname) {
      case '/internal/updateStatus':
        return this.handleUpdateStatus(request);
      case '/internal/reset':
        return this.handleReset();
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

  private async handleUpdateStatus(request: Request): Promise<Response> {
    const body = await request.json() as {
      step: ContainerState['currentStep'];
      message?: string;
      progress?: number;
      resultUrl?: string;
    };

    // Update state based on step
    this.containerState.currentStep = body.step;
    this.containerState.message = body.message;

    switch (body.step) {
      case 'finding':
        this.containerState.progress = body.progress || 10;
        this.containerState.startedAt = Date.now();
        this.containerState.message = 'Searching for vote data files...';
        break;
      case 'zipping':
        this.containerState.progress = body.progress || 40;
        this.containerState.message = 'Compressing vote data...';
        break;
      case 'uploading':
        this.containerState.progress = body.progress || 70;
        this.containerState.message = 'Uploading to R2 storage...';
        break;
      case 'done':
        this.containerState.progress = 100;
        this.containerState.completedAt = Date.now();
        this.containerState.message = 'Export complete!';
        this.containerState.resultUrl = body.resultUrl || '/public/exports/votes.zip';
        break;
      case 'error':
        this.containerState.message = body.message || 'An error occurred';
        break;
      case 'idle':
        this.containerState.progress = 0;
        this.containerState.message = undefined;
        break;
    }

    // Save state
    await this.state.storage.put('containerState', this.containerState);

    // Broadcast update
    this.broadcast({
      type: 'statusUpdate',
      data: this.containerState
    });

    // If done, reset after 30 seconds
    if (body.step === 'done') {
      await this.state.storage.setAlarm(new Date(Date.now() + 30000));
    }

    return new Response(JSON.stringify({ success: true }));
  }

  private async handleReset(): Promise<Response> {
    this.containerState = {
      currentStep: 'idle',
      progress: 0
    };

    await this.state.storage.put('containerState', this.containerState);
    await this.state.storage.deleteAlarm();

    this.broadcast({
      type: 'statusUpdate',
      data: this.containerState
    });

    return new Response(JSON.stringify({ success: true }));
  }

  private async handleGetState(): Promise<Response> {
    return new Response(JSON.stringify(this.containerState));
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
    // Auto-reset to idle after completion
    if (this.containerState.currentStep === 'done') {
      await this.handleReset();
    }
  }
}