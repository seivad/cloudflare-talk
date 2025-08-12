import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SlideRoom } from './durable-objects/SlideRoom';
import { PollRoom } from './durable-objects/PollRoom';
import { ContainerStatus } from './durable-objects/ContainerStatus';
import { generateQRCode, generateQRCodeSVG } from './utils/qr-generator';
import { voteQueueConsumer } from './queue/vote-processor';
import { SLIDES_HTML, AUDIENCE_HTML } from './html-content';
import { WELCOME_HTML } from './welcome-html';

export { SlideRoom, PollRoom, ContainerStatus };

interface Env {
  SLIDE_ROOM: DurableObjectNamespace;
  POLL_ROOM: DurableObjectNamespace;
  CONTAINER_STATUS: DurableObjectNamespace;
  VOTE_QUEUE: Queue;
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  AUDIENCE_URL: string;
  ADMIN_KEY: string;
  __STATIC_CONTENT: any; // Wrangler's static asset binding
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use('*', cors());

// Main route shows welcome page
app.get('/', (c) => {
  return c.html(WELCOME_HTML);
});

// Presenter slides view
app.get('/slides', async (c) => {
  return c.html(SLIDES_HTML);
});

// Audience participation view (legacy - redirect to room-based URL)
app.get('/audience', async (c) => {
  // Redirect to a default room ID for backward compatibility
  const defaultRoomId = '123456';
  return c.redirect(`/audience/${defaultRoomId}`);
});

// Room-specific audience participation view
app.get('/audience/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  
  // Validate room ID (6 digits)
  if (!/^\d{6}$/.test(roomId)) {
    return c.text('Invalid room ID. Please use a 6-digit room ID.', 400);
  }
  
  return c.html(AUDIENCE_HTML.replace('{{ROOM_ID}}', roomId));
});


// QR Code generator endpoint
app.get('/qr/:text', async (c) => {
  const text = decodeURIComponent(c.req.param('text'));
  const size = parseInt(c.req.query('size') || '300');
  
  try {
    // Generate QR code as SVG (works reliably in Workers)
    const svgString = await generateQRCodeSVG(text, size);
    
    return new Response(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('QR SVG generation failed:', error);
    
    try {
      // Fallback to data URL generation
      const qrCodeDataUrl = await generateQRCode(text, size);
      
      if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/svg+xml;base64,')) {
        const base64Data = qrCodeDataUrl.split(',')[1];
        const svgContent = atob(base64Data);
        
        return new Response(svgContent, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } catch (dataUrlError) {
      console.error('QR data URL generation also failed:', dataUrlError);
    }
  }
  
  // If all QR generation fails, redirect to external service
  console.log('Using external QR service as final fallback');
  const externalUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  return Response.redirect(externalUrl, 302);
});

// WebSocket endpoint for slide synchronization (legacy)
app.get('/ws/slides', async (c) => {
  const id = c.env.SLIDE_ROOM.idFromName('main');
  const stub = c.env.SLIDE_ROOM.get(id);
  return stub.fetch(c.req.raw);
});

// Room-based WebSocket endpoint for slide synchronization
app.get('/ws/slides/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  
  // Validate room ID
  if (!/^\d{6}$/.test(roomId)) {
    return c.text('Invalid room ID', 400);
  }
  
  const id = c.env.SLIDE_ROOM.idFromName(`room-${roomId}`);
  const stub = c.env.SLIDE_ROOM.get(id);
  return stub.fetch(c.req.raw);
});

// WebSocket endpoint for poll updates
app.get('/ws/poll/:pollId', async (c) => {
  const pollId = c.req.param('pollId') || 'current';
  const id = c.env.POLL_ROOM.idFromName(pollId);
  const stub = c.env.POLL_ROOM.get(id);
  return stub.fetch(c.req.raw);
});

// WebSocket endpoint for container status
app.get('/ws/container', async (c) => {
  const id = c.env.CONTAINER_STATUS.idFromName('main');
  const stub = c.env.CONTAINER_STATUS.get(id);
  return stub.fetch(c.req.raw);
});

// API: Vote submission
app.post('/api/vote', async (c) => {
  const body = await c.req.json<{
    pollId: string;
    optionId: string;
    userId: string;
    roomId?: string;
  }>();

  // Extract room ID from body or use default
  const roomId = body.roomId || '123456';
  
  // Send vote directly to SlideRoom (which manages the active poll)
  const slideId = c.env.SLIDE_ROOM.idFromName(`room-${roomId}`);
  const slideStub = c.env.SLIDE_ROOM.get(slideId);
  
  const response = await slideStub.fetch(new Request('http://localhost/internal/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vote failed:', errorText);
    return c.json({ error: errorText }, response.status);
  }

  return c.json({ success: true });
});

// API: Start poll (admin)
app.post('/api/poll/start', async (c) => {
  const adminKey = c.req.header('X-Admin-Key');
  if (adminKey !== c.env.ADMIN_KEY) {
    return c.text('Unauthorized', 401);
  }

  const body = await c.req.json<{
    nodeId?: string;
    duration?: number;
  }>();

  // Get slide room to coordinate
  const slideId = c.env.SLIDE_ROOM.idFromName('main');
  const slideStub = c.env.SLIDE_ROOM.get(slideId);
  
  const response = await slideStub.fetch('http://internal/startPoll', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return c.json(await response.json());
});

// API: Force poll winner (admin)
app.post('/api/poll/pick', async (c) => {
  const adminKey = c.req.header('X-Admin-Key');
  if (adminKey !== c.env.ADMIN_KEY) {
    return c.text('Unauthorized', 401);
  }

  const body = await c.req.json<{
    optionId?: string;
    strategy?: 'highest' | 'random';
  }>();

  const pollId = c.env.POLL_ROOM.idFromName('current');
  const pollStub = c.env.POLL_ROOM.get(pollId);
  
  const response = await pollStub.fetch('http://internal/pickWinner', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return c.json(await response.json());
});

// API: Navigate to slide (admin)
app.post('/api/slide/goto', async (c) => {
  const adminKey = c.req.header('X-Admin-Key');
  if (adminKey !== c.env.ADMIN_KEY) {
    return c.text('Unauthorized', 401);
  }

  const body = await c.req.json<{ index: number }>();

  const slideId = c.env.SLIDE_ROOM.idFromName('main');
  const slideStub = c.env.SLIDE_ROOM.get(slideId);
  
  const response = await slideStub.fetch('http://internal/goto', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return c.json({ success: true });
});

// API: Trigger container demo
app.post('/api/container/start', async (c) => {
  const adminKey = c.req.header('X-Admin-Key');
  if (adminKey !== c.env.ADMIN_KEY) {
    return c.text('Unauthorized', 401);
  }

  const containerId = c.env.CONTAINER_STATUS.idFromName('main');
  const containerStub = c.env.CONTAINER_STATUS.get(containerId);

  // Simulate container progress
  const steps = ['finding', 'zipping', 'uploading', 'done'];
  for (const step of steps) {
    await containerStub.fetch('http://internal/updateStatus', {
      method: 'POST',
      body: JSON.stringify({ step })
    });
    
    // Wait between steps
    await new Promise(resolve => setTimeout(resolve, step === 'zipping' ? 3000 : 1500));
  }

  // Store fake zip file in R2
  const zipContent = new Uint8Array([0x50, 0x4B, 0x03, 0x04]); // ZIP header
  await c.env.ASSETS_BUCKET.put('exports/votes.zip', zipContent);

  return c.json({ success: true, url: '/public/exports/votes.zip' });
});

// API: Generate dummy votes (testing)
app.post('/api/dummy-votes', async (c) => {
  const body = await c.req.json<{
    count?: number;
    pollId?: string;
    options?: string[];
  }>();

  const count = body.count || 50;
  const pollId = body.pollId || 'current';
  const options = body.options || ['option1', 'option2', 'option3'];

  for (let i = 0; i < count; i++) {
    const optionId = options[Math.floor(Math.random() * options.length)];
    await c.env.VOTE_QUEUE.send({
      pollId,
      optionId,
      userId: `dummy-${i}-${Date.now()}`,
      timestamp: Date.now()
    });
  }

  return c.json({ success: true, generated: count });
});

// API: Trigger finale (push contact info)
app.post('/api/finale', async (c) => {
  const slideId = c.env.SLIDE_ROOM.idFromName('main');
  const slideStub = c.env.SLIDE_ROOM.get(slideId);
  
  await slideStub.fetch('http://internal/finale', {
    method: 'POST'
  });

  return c.json({ success: true });
});

// API: Get current state
app.get('/api/state', async (c) => {
  const slideId = c.env.SLIDE_ROOM.idFromName('main');
  const slideStub = c.env.SLIDE_ROOM.get(slideId);
  
  const response = await slideStub.fetch('http://internal/state');
  return c.json(await response.json());
});

// API: Get available poll options (excluding visited slides)
app.get('/api/poll-options', async (c) => {
  const roomId = c.req.query('roomId') || '123456';
  const slideId = c.env.SLIDE_ROOM.idFromName(`room-${roomId}`);
  const slideStub = c.env.SLIDE_ROOM.get(slideId);
  
  const response = await slideStub.fetch(new Request('http://localhost/internal/poll-options', {
    method: 'GET'
  }));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Poll options failed:', errorText);
    return c.json({ error: errorText }, response.status);
  }
  
  return c.json(await response.json());
});

// Export queue consumer
export default {
  fetch: app.fetch,
  queue: voteQueueConsumer
};