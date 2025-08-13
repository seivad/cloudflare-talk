import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SlideRoom } from './durable-objects/SlideRoom';
import { PollRoom } from './durable-objects/PollRoom';
import { ContainerStatus } from './durable-objects/ContainerStatus';
import { generateQRCode, generateQRCodeSVG } from './utils/qr-generator';
import { voteQueueConsumer } from './queue/vote-processor';
import { SLIDES_HTML, AUDIENCE_HTML } from './html-content';
import { WELCOME_HTML } from './welcome-html';
import { PRESENTER_HTML } from './presenter-html';
import { AUDIENCE_ENTRY_HTML } from './audience-entry-html';
import { ADMIN_HTML } from './admin-html';
import { runImport } from './utils/import-json';
import { generateSessionCode, generatePresenterToken } from './utils/session-code';
import { PresentationQueries } from './db/queries';

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

// Presenter dashboard
app.get('/presenter', async (c) => {
  return c.html(PRESENTER_HTML);
});

// Admin dashboard
app.get('/admin', async (c) => {
  return c.html(ADMIN_HTML);
});

// Presenter slides view
app.get('/slides', async (c) => {
  // Check if this is a session-based view
  const sessionCode = c.req.query('session');
  const presenterToken = c.req.query('token');
  
  if (sessionCode && presenterToken) {
    // TODO: Validate session and token
    // For now, just serve the slides with session info embedded
    let html = SLIDES_HTML;
    html = html.replace('{{SESSION_CODE}}', sessionCode);
    html = html.replace('{{PRESENTER_TOKEN}}', presenterToken);
    return c.html(html);
  }
  
  return c.html(SLIDES_HTML);
});

// Audience entry page (enter session code)
app.get('/audience', async (c) => {
  return c.html(AUDIENCE_ENTRY_HTML);
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

// WebSocket endpoint for slide synchronization (legacy - create default session)
app.get('/ws/slides', async (c) => {
  try {
    // For legacy support, use a default session code
    const defaultSessionCode = '123456';
    const id = c.env.SLIDE_ROOM.idFromName(`room-${defaultSessionCode}`);
    const stub = c.env.SLIDE_ROOM.get(id);
    
    // Try to get a presentation ID from D1
    let presentationId = null;
    try {
      const result = await c.env.DB.prepare(
        `SELECT id FROM presentations WHERE is_active = 1 LIMIT 1`
      ).first();
      if (result) {
        presentationId = result.id as string;
      }
    } catch (dbError) {
      console.log('No presentations in database yet, using fallback');
    }
    
    // If we have a presentation, initialize the session
    if (presentationId) {
      await stub.fetch(new Request('http://localhost/internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId,
          sessionCode: defaultSessionCode,
          presenterToken: 'default-presenter-token'
        })
      }));
    }
    
    // Return the WebSocket connection regardless
    return stub.fetch(c.req.raw);
  } catch (error) {
    console.error('Error in /ws/slides:', error);
    // Still try to return the WebSocket connection
    const id = c.env.SLIDE_ROOM.idFromName('room-123456');
    const stub = c.env.SLIDE_ROOM.get(id);
    return stub.fetch(c.req.raw);
  }
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
    return c.json({ error: errorText }, response.status as any);
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

  const data = await response.json();
  return c.json(data as any);
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

  const data = await response.json();
  return c.json(data as any);
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
  const data = await response.json();
  return c.json(data as any);
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
    return c.json({ error: errorText }, response.status as any);
  }
  
  const data = await response.json();
  return c.json(data as any);
});

// API: Get slides for a presentation
app.get('/api/presentations/:presentationId/slides', async (c) => {
  try {
    const presentationId = c.req.param('presentationId');
    const result = await c.env.DB.prepare(
      `SELECT * FROM slides WHERE presentation_id = ? ORDER BY order_number`
    ).bind(presentationId).all();
    
    return c.json(result.results || []);
  } catch (error) {
    console.error('Failed to fetch slides:', error);
    return c.json({ error: 'Failed to fetch slides' }, 500);
  }
});

// API: Get all presentations
app.get('/api/presentations', async (c) => {
  try {
    const queries = new PresentationQueries(c.env.DB);
    const presentations = await queries.getAllPresentations();
    
    // Add slide counts (simplified for now)
    const presentationsWithCounts = presentations.map(p => ({
      ...p,
      slide_count: 13 // TODO: Get actual count from slides table
    }));
    
    return c.json(presentationsWithCounts);
  } catch (error) {
    console.error('Failed to fetch presentations:', error);
    return c.json({ error: 'Failed to fetch presentations' }, 500);
  }
});

// API: Add participant to session
app.post('/api/session/:sessionCode/add-participant', async (c) => {
  try {
    const sessionCode = c.req.param('sessionCode');
    const body = await c.req.json<{ userId: string; isPresenter?: boolean }>();
    
    // Get the SlideRoom Durable Object for this session
    const roomId = c.env.SLIDE_ROOM.idFromName(`room-${sessionCode}`);
    const roomStub = c.env.SLIDE_ROOM.get(roomId);
    
    // Add participant to the session
    const response = await roomStub.fetch(new Request('http://localhost/internal/add-participant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));
    
    if (!response.ok) {
      throw new Error('Failed to add participant');
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to add participant:', error);
    return c.json({ error: 'Failed to add participant' }, 500);
  }
});

// API: Start a new presentation session
app.post('/api/presenter/start-session', async (c) => {
  try {
    const body = await c.req.json<{ presentationId: string }>();
    
    // Generate session code and presenter token
    const sessionCode = generateSessionCode();
    const presenterToken = generatePresenterToken();
    
    // Get the SlideRoom Durable Object for this session
    const roomId = c.env.SLIDE_ROOM.idFromName(`room-${sessionCode}`);
    const roomStub = c.env.SLIDE_ROOM.get(roomId);
    
    // Initialize the session in the Durable Object
    const initResponse = await roomStub.fetch(new Request('http://localhost/internal/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presentationId: body.presentationId,
        sessionCode,
        presenterToken
      })
    }));
    
    if (!initResponse.ok) {
      throw new Error('Failed to initialize session');
    }
    
    return c.json({
      success: true,
      sessionCode,
      presenterToken,
      presentationId: body.presentationId
    });
  } catch (error) {
    console.error('Failed to start session:', error);
    return c.json({ error: 'Failed to start session' }, 500);
  }
});

// Admin: Import default presentation
app.post('/admin/import-default', async (c) => {
  const adminKey = c.req.header('X-Admin-Key');
  if (adminKey !== c.env.ADMIN_KEY) {
    return c.text('Unauthorized', 401);
  }

  try {
    const presentationId = await runImport(c.env.DB);
    return c.json({ 
      success: true, 
      presentationId,
      message: 'Default presentation imported successfully'
    });
  } catch (error) {
    console.error('Import failed:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Export queue consumer
export default {
  fetch: app.fetch,
  queue: voteQueueConsumer
};