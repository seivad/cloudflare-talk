import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import bcrypt from 'bcryptjs'
import { SlideRoom } from './durable-objects/SlideRoom'
import { PollRoom } from './durable-objects/PollRoom'
import { ContainerStatus } from './durable-objects/ContainerStatus'
import { generateQRCode, generateQRCodeSVG } from './utils/qr-generator'
import { voteQueueConsumer } from './queue/vote-processor'
import { SLIDES_HTML, AUDIENCE_HTML } from './html-content'
import { WELCOME_HTML } from './welcome-html'
import { PRESENTER_HTML } from './presenter-html'
import { AUDIENCE_ENTRY_HTML } from './audience-entry-html'
import { ADMIN_HTML } from './admin-html'
import { LOGIN_HTML } from './pages/login-html'
import { SETUP_HTML } from './pages/setup-html'
import { TESTING_HTML } from './testing-html'
import { runImport } from './utils/import-json'
import { generateSessionCode, generatePresenterToken } from './utils/session-code'
import { PresentationQueries, AIPollOption } from './db/queries'
import * as db from './auth/db-utils'

export { SlideRoom, PollRoom, ContainerStatus }

interface Env {
	SLIDE_ROOM: DurableObjectNamespace
	POLL_ROOM: DurableObjectNamespace
	CONTAINER_STATUS: DurableObjectNamespace
	VOTE_QUEUE: Queue
	DB: D1Database
	ASSETS_BUCKET: R2Bucket
	AI: any // CloudFlare AI binding
	AUDIENCE_URL: string
	ADMIN_KEY: string
	JWT_SECRET: string
	__STATIC_CONTENT: any // Wrangler's static asset binding
}

const app = new Hono<{ Bindings: Env }>()

// Enable CORS for all routes
app.use('*', cors())

// ====== PUBLIC ROUTES ======

// Main route shows welcome page
app.get('/', (c) => {
	return c.html(WELCOME_HTML)
})

// Login page
app.get('/login', (c) => {
	return c.html(LOGIN_HTML)
})

// Setup page for first user
app.get('/setup', async (c) => {
	const userCount = await db.getUserCount(c.env.DB)
	if (userCount > 0) {
		return c.redirect('/login')
	}
	return c.html(SETUP_HTML)
})

// ====== AUTHENTICATION ENDPOINTS ======

// Check if users exist (for setup flow)
app.get('/api/auth/check-users', async (c) => {
	try {
		const userCount = await db.getUserCount(c.env.DB)
		return c.json({ userCount })
	} catch (error) {
		return c.json({ error: 'Failed to check users' }, 500)
	}
})

// Login endpoint
app.post('/api/auth/login', async (c) => {
	try {
		const { email, password } = await c.req.json()

		// Get user by email
		const user = await db.getUserByEmail(c.env.DB, email)
		if (!user) {
			return c.json({ error: 'Invalid email or password' }, 401)
		}

		// Verify password
		const passwordValid = await bcrypt.compare(password, user.password_hash)
		if (!passwordValid) {
			return c.json({ error: 'Invalid email or password' }, 401)
		}

		// Create JWT token
		const token = await sign(
			{
				sub: user.id,
				email: user.email,
				name: user.name,
				exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
			},
			c.env.JWT_SECRET
		)

		// Set cookie
		setCookie(c, 'auth_token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'Lax',
			maxAge: 86400, // 24 hours
			path: '/',
		})

		return c.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		})
	} catch (error) {
		console.error('Login error:', error)
		return c.json({ error: 'Login failed' }, 500)
	}
})

// Register first user
app.post('/api/auth/register', async (c) => {
	try {
		// Check if users already exist
		const userCount = await db.getUserCount(c.env.DB)
		if (userCount > 0) {
			return c.json({ error: 'Users already exist. Please login.' }, 403)
		}

		const { email, name, password } = await c.req.json()

		// Validate password
		if (password.length < 8) {
			return c.json({ error: 'Password must be at least 8 characters' }, 400)
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 10)

		// Create user
		const userId = await db.createUser(c.env.DB, { email, name, passwordHash })

		// Auto-login: create JWT token
		const token = await sign(
			{
				sub: userId,
				email,
				name,
				exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
			},
			c.env.JWT_SECRET
		)

		// Set cookie
		setCookie(c, 'auth_token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'Lax',
			maxAge: 86400,
			path: '/',
		})

		return c.json({
			success: true,
			user: { id: userId, email, name },
		})
	} catch (error) {
		console.error('Registration error:', error)
		return c.json({ error: 'Registration failed' }, 500)
	}
})

// Logout endpoint
app.post('/api/auth/logout', (c) => {
	deleteCookie(c, 'auth_token', { path: '/' })
	return c.json({ success: true })
})

// ====== PROTECTED ROUTES MIDDLEWARE ======

// Helper function to verify JWT manually for better error handling
async function requireAuth(c: any, next: any) {
	try {
		const token = getCookie(c, 'auth_token')

		if (!token) {
			// No token, redirect to login
			return c.redirect('/login?redirect=' + c.req.path)
		}

		// Verify the token
		const payload = await verify(token, c.env.JWT_SECRET)

		// Check if token is expired
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			deleteCookie(c, 'auth_token')
			return c.redirect('/login?redirect=' + c.req.path)
		}

		// Set the payload for use in the route
		c.set('jwtPayload', payload)

		await next()
	} catch (error) {
		console.error('Auth error:', error)
		// Invalid token, clear it and redirect to login
		deleteCookie(c, 'auth_token')
		return c.redirect('/login?redirect=' + c.req.path)
	}
}

// Presenter dashboard (protected)
app.get('/presenter', requireAuth, async (c) => {
	const payload = c.get('jwtPayload')
	return c.html(PRESENTER_HTML)
})

// Slide manager (protected)
app.get('/presenter/:presentationId/slides', requireAuth, async (c) => {
	const { SLIDE_MANAGER_HTML } = await import('./pages/slide-manager-html')
	return c.html(SLIDE_MANAGER_HTML)
})

// Presentation editor (protected) - redirects to slide manager for now
app.get('/presenter/:presentationId/edit', requireAuth, async (c) => {
	const presentationId = c.req.param('presentationId')
	return c.redirect(`/presenter/${presentationId}/slides`)
})

// Admin dashboard (protected)
app.get('/admin', requireAuth, async (c) => {
	return c.html(ADMIN_HTML)
})

// Testing tools page (protected)
app.get('/testing', requireAuth, async (c) => {
	return c.html(TESTING_HTML)
})

// Presenter slides view
app.get('/slides', async (c) => {
	// Check if this is a session-based view
	const sessionCode = c.req.query('session')
	const presenterToken = c.req.query('token')

	if (sessionCode && presenterToken) {
		// TODO: Validate session and token
		// For now, just serve the slides with session info embedded
		let html = SLIDES_HTML
		html = html.replace('{{SESSION_CODE}}', sessionCode)
		html = html.replace('{{PRESENTER_TOKEN}}', presenterToken)
		return c.html(html)
	}

	return c.html(SLIDES_HTML)
})

// Audience entry page (enter session code)
app.get('/audience', async (c) => {
	return c.html(AUDIENCE_ENTRY_HTML)
})

// Room-specific audience participation view
app.get('/audience/:roomId', async (c) => {
	const roomId = c.req.param('roomId')

	// Validate room ID (6 digits)
	if (!/^\d{6}$/.test(roomId)) {
		return c.text('Invalid room ID. Please use a 6-digit room ID.', 400)
	}

	return c.html(AUDIENCE_HTML.replace('{{ROOM_ID}}', roomId))
})

// QR Code generator endpoint
app.get('/qr/:text', async (c) => {
	const text = decodeURIComponent(c.req.param('text'))
	const size = parseInt(c.req.query('size') || '300')

	try {
		// Generate QR code as SVG (works reliably in Workers)
		const svgString = await generateQRCodeSVG(text, size)

		return new Response(svgString, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=3600',
				'Access-Control-Allow-Origin': '*',
			},
		})
	} catch (error) {
		console.error('QR SVG generation failed:', error)

		try {
			// Fallback to data URL generation
			const qrCodeDataUrl = await generateQRCode(text, size)

			if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/svg+xml;base64,')) {
				const base64Data = qrCodeDataUrl.split(',')[1]
				const svgContent = atob(base64Data)

				return new Response(svgContent, {
					headers: {
						'Content-Type': 'image/svg+xml',
						'Cache-Control': 'public, max-age=3600',
						'Access-Control-Allow-Origin': '*',
					},
				})
			}
		} catch (dataUrlError) {
			console.error('QR data URL generation also failed:', dataUrlError)
		}
	}

	// If all QR generation fails, redirect to external service
	console.log('Using external QR service as final fallback')
	const externalUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
	return Response.redirect(externalUrl, 302)
})

// WebSocket endpoint for slide synchronization (legacy - create default session)
app.get('/ws/slides', async (c) => {
	try {
		// For legacy support, use a default session code
		const defaultSessionCode = '123456'
		const id = c.env.SLIDE_ROOM.idFromName(`room-${defaultSessionCode}`)
		const stub = c.env.SLIDE_ROOM.get(id)

		// Try to get a presentation ID from D1
		let presentationId = null
		try {
			const result = await c.env.DB.prepare(`SELECT id FROM presentations WHERE is_active = 1 LIMIT 1`).first()
			if (result) {
				presentationId = result.id as string
			}
		} catch (dbError) {
			console.log('No presentations in database yet, using fallback')
		}

		// If we have a presentation, initialize the session
		if (presentationId) {
			await stub.fetch(
				new Request('http://localhost/internal/init', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						presentationId,
						sessionCode: defaultSessionCode,
						presenterToken: 'default-presenter-token',
					}),
				})
			)
		}

		// Return the WebSocket connection regardless
		return stub.fetch(c.req.raw)
	} catch (error) {
		console.error('Error in /ws/slides:', error)
		// Still try to return the WebSocket connection
		const id = c.env.SLIDE_ROOM.idFromName('room-123456')
		const stub = c.env.SLIDE_ROOM.get(id)
		return stub.fetch(c.req.raw)
	}
})

// Room-based WebSocket endpoint for slide synchronization
app.get('/ws/slides/:roomId', async (c) => {
	const roomId = c.req.param('roomId')

	// Validate room ID
	if (!/^\d{6}$/.test(roomId)) {
		return c.text('Invalid room ID', 400)
	}

	const id = c.env.SLIDE_ROOM.idFromName(`room-${roomId}`)
	const stub = c.env.SLIDE_ROOM.get(id)
	return stub.fetch(c.req.raw)
})

// WebSocket endpoint for poll updates
app.get('/ws/poll/:pollId', async (c) => {
	const pollId = c.req.param('pollId') || 'current'
	const id = c.env.POLL_ROOM.idFromName(pollId)
	const stub = c.env.POLL_ROOM.get(id)
	return stub.fetch(c.req.raw)
})

// WebSocket endpoint for container status
app.get('/ws/container', async (c) => {
	const id = c.env.CONTAINER_STATUS.idFromName('main')
	const stub = c.env.CONTAINER_STATUS.get(id)
	return stub.fetch(c.req.raw)
})

// API: Vote submission
app.post('/api/vote', async (c) => {
	const body = await c.req.json<{
		pollId: string
		optionId: string
		userId: string
		roomId?: string
	}>()

	// Extract room ID from body or use default
	const roomId = body.roomId || '123456'

	// Send vote directly to SlideRoom (which manages the active poll)
	const slideId = c.env.SLIDE_ROOM.idFromName(`room-${roomId}`)
	const slideStub = c.env.SLIDE_ROOM.get(slideId)

	const response = await slideStub.fetch(
		new Request('http://localhost/internal/vote', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})
	)

	if (!response.ok) {
		const errorText = await response.text()
		console.error('Vote failed:', errorText)
		return c.json({ error: errorText }, response.status as any)
	}

	return c.json({ success: true })
})

// API: Start poll (admin)
app.post('/api/poll/start', async (c) => {
	const adminKey = c.req.header('X-Admin-Key')
	if (adminKey !== c.env.ADMIN_KEY) {
		return c.text('Unauthorized', 401)
	}

	const body = await c.req.json<{
		nodeId?: string
		duration?: number
	}>()

	// Get slide room to coordinate
	const slideId = c.env.SLIDE_ROOM.idFromName('main')
	const slideStub = c.env.SLIDE_ROOM.get(slideId)

	const response = await slideStub.fetch('http://internal/startPoll', {
		method: 'POST',
		body: JSON.stringify(body),
	})

	const data = await response.json()
	return c.json(data as any)
})

// API: Force poll winner (admin)
app.post('/api/poll/pick', async (c) => {
	const adminKey = c.req.header('X-Admin-Key')
	if (adminKey !== c.env.ADMIN_KEY) {
		return c.text('Unauthorized', 401)
	}

	const body = await c.req.json<{
		optionId?: string
		strategy?: 'highest' | 'random'
	}>()

	const pollId = c.env.POLL_ROOM.idFromName('current')
	const pollStub = c.env.POLL_ROOM.get(pollId)

	const response = await pollStub.fetch('http://internal/pickWinner', {
		method: 'POST',
		body: JSON.stringify(body),
	})

	const data = await response.json()
	return c.json(data as any)
})

// API: Navigate to slide (admin)
app.post('/api/slide/goto', async (c) => {
	const adminKey = c.req.header('X-Admin-Key')
	if (adminKey !== c.env.ADMIN_KEY) {
		return c.text('Unauthorized', 401)
	}

	const body = await c.req.json<{ index: number }>()

	const slideId = c.env.SLIDE_ROOM.idFromName('main')
	const slideStub = c.env.SLIDE_ROOM.get(slideId)

	const response = await slideStub.fetch('http://internal/goto', {
		method: 'POST',
		body: JSON.stringify(body),
	})

	return c.json({ success: true })
})

// API: Trigger container demo
app.post('/api/container/start', async (c) => {
	const adminKey = c.req.header('X-Admin-Key')
	if (adminKey !== c.env.ADMIN_KEY) {
		return c.text('Unauthorized', 401)
	}

	const containerId = c.env.CONTAINER_STATUS.idFromName('main')
	const containerStub = c.env.CONTAINER_STATUS.get(containerId)

	// Simulate container progress
	const steps = ['finding', 'zipping', 'uploading', 'done']
	for (const step of steps) {
		await containerStub.fetch('http://internal/updateStatus', {
			method: 'POST',
			body: JSON.stringify({ step }),
		})

		// Wait between steps
		await new Promise((resolve) => setTimeout(resolve, step === 'zipping' ? 3000 : 1500))
	}

	// Store fake zip file in R2
	const zipContent = new Uint8Array([0x50, 0x4b, 0x03, 0x04]) // ZIP header
	await c.env.ASSETS_BUCKET.put('exports/votes.zip', zipContent)

	return c.json({ success: true, url: '/public/exports/votes.zip' })
})

// API: Generate dummy votes (testing)
app.post('/api/dummy-votes', async (c) => {
	const body = await c.req.json<{
		count?: number
		pollId?: string
		options?: string[]
	}>()

	const count = body.count || 50
	const pollId = body.pollId || 'current'
	const options = body.options || ['option1', 'option2', 'option3']

	for (let i = 0; i < count; i++) {
		const optionId = options[Math.floor(Math.random() * options.length)]
		await c.env.VOTE_QUEUE.send({
			pollId,
			optionId,
			userId: `dummy-${i}-${Date.now()}`,
			timestamp: Date.now(),
		})
	}

	return c.json({ success: true, generated: count })
})

// API: Trigger finale (push contact info)
app.post('/api/finale', async (c) => {
	const slideId = c.env.SLIDE_ROOM.idFromName('main')
	const slideStub = c.env.SLIDE_ROOM.get(slideId)

	await slideStub.fetch('http://internal/finale', {
		method: 'POST',
	})

	return c.json({ success: true })
})

// API: Get current state
app.get('/api/state', async (c) => {
	const slideId = c.env.SLIDE_ROOM.idFromName('main')
	const slideStub = c.env.SLIDE_ROOM.get(slideId)

	const response = await slideStub.fetch('http://internal/state')
	const data = await response.json()
	return c.json(data as any)
})

// API: Get available poll options (excluding visited slides)
app.get('/api/poll-options', async (c) => {
	const roomId = c.req.query('roomId') || '123456'
	const slideId = c.env.SLIDE_ROOM.idFromName(`room-${roomId}`)
	const slideStub = c.env.SLIDE_ROOM.get(slideId)

	const response = await slideStub.fetch(
		new Request('http://localhost/internal/poll-options', {
			method: 'GET',
		})
	)

	if (!response.ok) {
		const errorText = await response.text()
		console.error('Poll options failed:', errorText)
		return c.json({ error: errorText }, response.status as any)
	}

	const data = await response.json()
	return c.json(data as any)
})

// API: Get slides for a presentation (protected)
app.get('/api/presentations/:presentationId/slides', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const presentationId = c.req.param('presentationId')
		const slides = await db.getSlidesForPresentation(c.env.DB, presentationId, payload.sub)
		return c.json(slides)
	} catch (error) {
		console.error('Failed to fetch slides:', error)
		return c.json({ error: 'Failed to fetch slides' }, 500)
	}
})

// API: Get user's presentations (protected)
app.get('/api/presentations', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const presentations = await db.getUserPresentations(c.env.DB, payload.sub)
		return c.json(presentations)
	} catch (error) {
		console.error('Failed to fetch presentations:', error)
		return c.json({ error: 'Failed to fetch presentations' }, 500)
	}
})

// API: Add participant to session
app.post('/api/session/:sessionCode/add-participant', async (c) => {
	try {
		const sessionCode = c.req.param('sessionCode')
		const body = await c.req.json<{ userId: string; isPresenter?: boolean }>()

		// Get the SlideRoom Durable Object for this session
		const roomId = c.env.SLIDE_ROOM.idFromName(`room-${sessionCode}`)
		const roomStub = c.env.SLIDE_ROOM.get(roomId)

		// Add participant to the session
		const response = await roomStub.fetch(
			new Request('http://localhost/internal/add-participant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
		)

		if (!response.ok) {
			throw new Error('Failed to add participant')
		}

		return c.json({ success: true })
	} catch (error) {
		console.error('Failed to add participant:', error)
		return c.json({ error: 'Failed to add participant' }, 500)
	}
})

// API: Start a new presentation session (protected + PIN required)
app.post('/api/presenter/start-session', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const body = await c.req.json<{ presentationId: string; pin?: string }>()

		// Get presentation and verify ownership + PIN
		const presentation = await db.getPresentationWithOwnerCheck(c.env.DB, body.presentationId, payload.sub)

		if (!presentation) {
			return c.json({ error: 'Presentation not found or unauthorized' }, 404)
		}

		// Verify PIN if set
		if (presentation.pin_code && presentation.pin_code !== body.pin) {
			return c.json({ error: 'Invalid PIN' }, 403)
		}

		// Generate session code and presenter token
		const sessionCode = generateSessionCode()
		const presenterToken = generatePresenterToken()

		// Get the SlideRoom Durable Object for this session
		const roomId = c.env.SLIDE_ROOM.idFromName(`room-${sessionCode}`)
		const roomStub = c.env.SLIDE_ROOM.get(roomId)

		// Initialize the session in the Durable Object
		const initResponse = await roomStub.fetch(
			new Request('http://localhost/internal/init', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					presentationId: body.presentationId,
					sessionCode,
					presenterToken,
				}),
			})
		)

		if (!initResponse.ok) {
			throw new Error('Failed to initialize session')
		}

		return c.json({
			success: true,
			sessionCode,
			presenterToken,
			presentationId: body.presentationId,
		})
	} catch (error) {
		console.error('Failed to start session:', error)
		return c.json({ error: 'Failed to start session' }, 500)
	}
})

// ====== PRESENTATION MANAGEMENT ENDPOINTS (Protected) ======

// Update presentation details (title, description, PIN)
app.put('/api/presentations/:id', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const presentationId = c.req.param('id')
		const body = await c.req.json()

		const updated = await db.updatePresentation(c.env.DB, presentationId, payload.sub, body)

		if (!updated) {
			return c.json({ error: 'Presentation not found or unauthorized' }, 404)
		}

		return c.json({ success: true })
	} catch (error) {
		console.error('Failed to update presentation:', error)
		return c.json({ error: 'Failed to update presentation' }, 500)
	}
})

// Generate new PIN for presentation
app.post('/api/presentations/:id/generate-pin', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const presentationId = c.req.param('id')
		const pin = db.generatePinCode()

		const updated = await db.updatePresentation(c.env.DB, presentationId, payload.sub, { pin_code: pin })

		if (!updated) {
			return c.json({ error: 'Presentation not found or unauthorized' }, 404)
		}

		return c.json({ success: true, pin })
	} catch (error) {
		console.error('Failed to generate PIN:', error)
		return c.json({ error: 'Failed to generate PIN' }, 500)
	}
})

// ====== SLIDE MANAGEMENT ENDPOINTS (Protected) ======

// Create new slide
app.post('/api/presentations/:presentationId/slides', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const presentationId = c.req.param('presentationId')
		const body = await c.req.json()

		const slideId = await db.createSlide(c.env.DB, payload.sub, {
			presentation_id: presentationId,
			...body,
		})

		if (!slideId) {
			return c.json({ error: 'Failed to create slide or unauthorized' }, 404)
		}

		return c.json({ success: true, id: slideId })
	} catch (error) {
		console.error('Failed to create slide:', error)
		return c.json({ error: 'Failed to create slide' }, 500)
	}
})

// Update slide
app.put('/api/slides/:id', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const slideId = c.req.param('id')
		const body = await c.req.json()

		const updated = await db.updateSlide(c.env.DB, slideId, payload.sub, body)

		if (!updated) {
			return c.json({ error: 'Slide not found or unauthorized' }, 404)
		}

		return c.json({ success: true })
	} catch (error) {
		console.error('Failed to update slide:', error)
		return c.json({ error: 'Failed to update slide' }, 500)
	}
})

// Delete slide
app.delete('/api/slides/:id', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const slideId = c.req.param('id')

		const deleted = await db.deleteSlide(c.env.DB, slideId, payload.sub)

		if (!deleted) {
			return c.json({ error: 'Slide not found or unauthorized' }, 404)
		}

		return c.json({ success: true })
	} catch (error) {
		console.error('Failed to delete slide:', error)
		return c.json({ error: 'Failed to delete slide' }, 500)
	}
})

// Reorder slides
app.post('/api/presentations/:presentationId/slides/reorder', requireAuth, async (c) => {
	try {
		const payload = c.get('jwtPayload')
		const presentationId = c.req.param('presentationId')
		const body = await c.req.json<{ slideIds: string[] }>()

		if (!body.slideIds || !Array.isArray(body.slideIds)) {
			return c.json({ error: 'Invalid slideIds array' }, 400)
		}

		const success = await db.reorderSlides(c.env.DB, presentationId, payload.sub, body.slideIds)

		if (!success) {
			return c.json({ error: 'Failed to reorder or unauthorized' }, 404)
		}

		return c.json({ success: true })
	} catch (error) {
		console.error('Failed to reorder slides:', error)
		return c.json({ error: 'Failed to reorder slides' }, 500)
	}
})

// Admin: Import default presentation
app.post('/admin/import-default', async (c) => {
	const adminKey = c.req.header('X-Admin-Key')
	if (adminKey !== c.env.ADMIN_KEY) {
		return c.text('Unauthorized', 401)
	}

	try {
		const presentationId = await runImport(c.env.DB)
		return c.json({
			success: true,
			presentationId,
			message: 'Default presentation imported successfully',
		})
	} catch (error) {
		console.error('Import failed:', error)
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		)
	}
})

// API: Generate AI content for poll winner
app.post('/api/generate-ai-content', async (c) => {
	try {
		const body = await c.req.json<{
			option: AIPollOption;
			presentationId: string;
			presentationName: string;
			slideId: string;
			sessionCode: string;
		}>();

		// Import AI generator utilities
		const { AIContentGenerator, slugify } = await import('./utils/ai-generator');
		const generator = new AIContentGenerator(c.env);

		// Generate content
		const presentationSlug = slugify(body.presentationName);
		const content = await generator.generateContent(
			body.option,
			body.presentationId,
			presentationSlug,
			body.slideId,
			body.sessionCode
		);

		// Update slide with generated content URL
		await db.updateSlide(c.env.DB, body.slideId, undefined, {
			generated_content_url: content.url
		});

		return c.json(content);
	} catch (error) {
		console.error('Failed to generate AI content:', error);
		return c.json({ error: 'Failed to generate AI content' }, 500);
	}
});

// API: Stream AI text generation for presenter
app.get('/api/stream-ai-response', async (c) => {
	const prompt = c.req.query('prompt');
	const model = c.req.query('model');
	const sessionCode = c.req.query('session');

	if (!prompt) {
		return c.text('Missing prompt parameter', 400);
	}

	// Set up SSE headers
	const headers = {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
	};

	// Create a TransformStream for SSE
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();
	const encoder = new TextEncoder();

	// Start streaming in the background
	(async () => {
		try {
			const { AIContentGenerator } = await import('./utils/ai-generator');
			const generator = new AIContentGenerator(c.env);

			for await (const chunk of generator.streamText(prompt, model)) {
				const message = `data: ${JSON.stringify({ text: chunk })}\n\n`;
				await writer.write(encoder.encode(message));
			}

			// Send completion message
			await writer.write(encoder.encode('data: [DONE]\n\n'));
		} catch (error) {
			console.error('Streaming error:', error);
			const errorMessage = `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`;
			await writer.write(encoder.encode(errorMessage));
		} finally {
			await writer.close();
		}
	})();

	return new Response(readable, { headers });
});

// API: Serve R2 content
app.get('/r2/*', async (c) => {
	const path = c.req.path.replace('/r2/', '');
	
	try {
		const object = await c.env.ASSETS_BUCKET.get(path);
		
		if (!object) {
			return c.text('Not found', 404);
		}

		const headers = new Headers();
		object.httpMetadata?.contentType && headers.set('Content-Type', object.httpMetadata.contentType);
		headers.set('Cache-Control', 'public, max-age=3600');
		
		return new Response(object.body, { headers });
	} catch (error) {
		console.error('Error serving R2 content:', error);
		return c.text('Error retrieving content', 500);
	}
});

// Export queue consumer
export default {
	fetch: app.fetch,
	queue: voteQueueConsumer,
}
