// Complete slides HTML with all features
export const COMPLETE_SLIDES_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare Tech Talk - Presenter View</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #fff;
            overflow: hidden;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .slide-container {
            width: 100vw;
            height: 56.25vw;
            max-height: 100vh;
            max-width: 177.78vh;
            position: relative;
            margin: 0 auto;
        }

        .slide-wrapper {
            width: 100%;
            height: 100%;
            position: relative;
            background-image: url('/powerpoint-bg.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }

        .slide-content-area {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 1700px;
            height: 850px;
            display: flex;
            flex-direction: column;
        }
        
        .slide-content {
            flex: 1;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            margin-top: 80px;
        }
        
        .slide {
            display: none;
            width: 100%;
            color: #333;
        }
        
        .slide.active {
            display: block;
            animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .qr-container {
            position: absolute;
            bottom: -50px;
            right: 0px;
            z-index: 100;
            text-align: center;
        }

        .qr-code {
            width: 120px;
            height: 120px;
            display: block;
            object-fit: contain;
        }

        .live-indicator {
            position: absolute;
            top: 76px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            font-size: 16px;
            font-weight: 600;
            border: 1px solid rgba(0, 208, 132, 0.3);
        }

        .live-dot {
            width: 12px;
            height: 12px;
            background: #00d084;
            border-radius: 50%;
            animation: livePulse 2s infinite;
            box-shadow: 0 0 10px rgba(0, 208, 132, 0.5);
        }

        @keyframes livePulse {
            0%, 100% { 
                opacity: 1; 
                transform: scale(1);
                box-shadow: 0 0 10px rgba(0, 208, 132, 0.5);
            }
            50% { 
                opacity: 0.8; 
                transform: scale(1.3);
                box-shadow: 0 0 20px rgba(0, 208, 132, 0.8);
            }
        }

        .slide-content {
            flex: 1;
            overflow-y: auto;
            color: #333;
            position: relative;
            padding: 3rem 3rem 0 3rem;
        }

        .slide {
            display: none;
            animation: slideIn 0.4s ease-out;
        }

        .slide.active {
            display: block;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .slide h1 {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            color: #c75300;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .slide h2 {
            font-size: 3rem;
            margin-bottom: 1.2rem;
            color: #c75300;
            font-weight: 600;
        }

        .slide p {
            font-size: 1.6rem;
            line-height: 1.8;
            margin-bottom: 1rem;
            color: #444;
        }

        .slide ul {
            margin-left: 2rem;
            margin-bottom: 1rem;
        }

        .slide li {
            font-size: 1.5rem;
            line-height: 1.8;
            margin-bottom: 0.5rem;
            color: #444;
        }

        .slide .analogy {
            background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
            border-left: 4px solid #0078d4;
            padding: 1.5rem 2rem;
            margin: 2rem 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 120, 212, 0.1);
        }

        .slide .code-snippet {
            background: #2d2d2d;
            color: #f8f8f2;
            border-radius: 8px;
            padding: 1.5rem;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        
        /* Poll slide styles */
        .poll-slide {
            display: none;
            width: 100%;
            color: #333;
        }
        
        .poll-slide.active {
            display: block;
            animation: fadeIn 0.5s ease-out;
        }
        
        .poll-container {
            padding: 2rem;
        }
        
        .poll-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .poll-title {
            font-size: 2.5rem;
            color: #333;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .poll-timer {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 1rem 2rem;
            border-radius: 30px;
            font-size: 2rem;
            font-weight: bold;
            min-width: 100px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .poll-results {
            margin-top: 2rem;
        }
        
        .poll-option-result {
            margin-bottom: 1.5rem;
            position: relative;
        }
        
        .poll-option-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .poll-option-label {
            font-size: 1.4rem;
            color: #333;
            font-weight: 600;
        }
        
        .poll-option-count {
            font-size: 1.2rem;
            color: #666;
            font-weight: 500;
        }
        
        .poll-option-bar-container {
            height: 50px;
            background: #f0f0f0;
            border-radius: 25px;
            overflow: hidden;
            position: relative;
        }
        
        .poll-option-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 25px;
            transition: width 0.5s ease-out;
            display: flex;
            align-items: center;
            padding: 0 20px;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .poll-option-result.winning .poll-option-bar {
            background: linear-gradient(90deg, #00d084, #00a86b);
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        
        .poll-total {
            text-align: center;
            margin-top: 2rem;
            font-size: 1.2rem;
            color: #666;
        }
    </style>
</head>
<body class="admin-mode">
    <div class="live-indicator">
        <div class="live-dot"></div>
        <span>LIVE</span>
        <span style="margin-left: 10px;">👥</span>
        <span id="liveParticipantCount">0</span>
        <span>watching</span>
    </div>

    <div class="slide-container">
        <div class="slide-wrapper">
            <div class="slide-content-area">
                <div class="qr-container">
                    <img id="qrCode" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Join QR" class="qr-code" style="display: block;">
                </div>

                <div class="slide-content" id="slideContent">
                    <div class="slide active" data-index="0">
                        <h1>Welcome to the Edge! ⚡</h1>
                        <p style="font-size: 1.6rem; color: #0078d4; font-weight: 600;">
                            Cloudflare Workers: Choose Your Own Adventure
                        </p>
                        <ul>
                            <li>🚀 <strong>Workers:</strong> Your JavaScript, everywhere at once</li>
                            <li>🎯 <strong>Durable Objects:</strong> Single source of truth</li>
                            <li>💾 <strong>D1:</strong> SQLite that travels light</li>
                            <li>🚦 <strong>Queues:</strong> Your edge-native bouncer</li>
                        </ul>
                        <div class="analogy">
                            <strong>Think of it like:</strong> Having a barista in every coffee shop in the world,
                            all sharing the same recipe book, ready to serve instantly.
                        </div>
                    </div>

                    <div class="slide" data-index="1">
                        <h2>Workers: Baristas Everywhere ⚡</h2>
                        <p>Tiny, serverless functions that run everywhere.</p>
                        <div class="analogy">
                            <strong>Analogy:</strong> Like having baristas in every coffee shop worldwide.
                            No commute, always ready, perfect consistency.
                        </div>
                        <ul>
                            <li>Cold starts? Basically non-existent</li>
                            <li>No servers to manage - focus on code</li>
                            <li>Runs within 50ms of your users</li>
                        </ul>
                        <div class="code-snippet">
export default {
  async fetch(request) {
    return new Response("Hello from the edge!");
  }
}</div>
                    </div>

                    <div class="slide" data-index="2">
                        <h2>Durable Objects: Perfect Memory 🎯</h2>
                        <div class="analogy">
                            <strong>That Friend Who Remembers Everything:</strong>
                            One friend who remembers everyone's drink order.
                            All messages go to them, they keep the list updated.
                        </div>
                        <ul>
                            <li>Single source of truth - no conflicts</li>
                            <li>Perfect for: chat rooms, game state, collaboration</li>
                            <li>Strong consistency guarantees</li>
                            <li>WebSocket support built-in</li>
                        </ul>
                    </div>

                    <div class="slide" data-index="3">
                        <h2>D1: Your Lightweight Database 💾</h2>
                        <div class="analogy">
                            <strong>Postgres = The library downtown</strong><br>
                            <strong>D1 = Personal bookshelf in every coffee shop</strong><br>
                            Same books, much easier to reach!
                        </div>
                        <ul>
                            <li>SQLite-compatible at the edge</li>
                            <li>Perfect for smaller, quick queries</li>
                            <li>Read replicas globally distributed</li>
                            <li>Automatic backups</li>
                        </ul>
                    </div>

                    <div class="slide" data-index="4">
                        <h2>Queues: Your Traffic Manager 🚦</h2>
                        <div class="analogy">
                            <strong>The Nightclub Bouncer:</strong>
                            Only lets in the right number of people,
                            so the bar staff aren't overwhelmed.
                        </div>
                        <ul>
                            <li>Smooth traffic spikes</li>
                            <li>Automatic retries</li>
                            <li>Dead letter queues</li>
                            <li>Batch processing</li>
                        </ul>
                    </div>

                    <div class="slide" data-index="5">
                        <h2>R2: Zero Egress Storage 🗄️</h2>
                        <div class="analogy">
                            <strong>S3 = Storage unit with exit fees</strong><br>
                            <strong>R2 = Your own attic - grab anything free!</strong>
                        </div>
                        <ul>
                            <li>S3-compatible API</li>
                            <li>ZERO egress fees</li>
                            <li>Automatic replication</li>
                            <li>Perfect for: images, backups, datasets</li>
                        </ul>
                    </div>

                    <div class="slide" data-index="6">
                        <h2>AI: Your Smart Neighbor 🤖</h2>
                        <div class="analogy">
                            <strong>Traditional AI = Professor overseas</strong><br>
                            <strong>Edge AI = Smart neighbor next door</strong><br>
                            Instant feedback, no long trips!
                        </div>
                        <ul>
                            <li>Run inference close to users</li>
                            <li>Low latency responses</li>
                            <li>Multiple model support</li>
                            <li>Pay per inference</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Poll slide will be inserted dynamically -->
    </div>

    <script>
        const AUDIENCE_URL = window.location.origin + '/audience';
        let currentSlideIndex = 0;
        let slides = [];
        let ws = null;
        let currentPollData = null;
        let pollTimer = null;
        let pollVotes = {};

        // Slide data array - this should match the data in SlideRoom.ts
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
            }
        ];

        function generateSlides() {
            const slideContent = document.getElementById('slideContent');
            slideContent.innerHTML = '';
            
            slideData.forEach((slide, index) => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'slide' + (index === 0 ? ' active' : '');
                slideDiv.setAttribute('data-index', index.toString());
                
                // Add title
                const title = document.createElement(index === 0 ? 'h1' : 'h2');
                title.textContent = slide.title;
                slideDiv.appendChild(title);
                
                // Add content paragraphs
                slide.content.forEach(text => {
                    const p = document.createElement('p');
                    p.textContent = text;
                    if (index === 0) {
                        p.style.fontSize = '2rem';
                        p.style.color = '#0078d4';
                    }
                    slideDiv.appendChild(p);
                });
                
                // Add bullet points if any
                if (slide.bullets && slide.bullets.length > 0) {
                    const ul = document.createElement('ul');
                    slide.bullets.forEach(bullet => {
                        const li = document.createElement('li');
                        li.textContent = bullet;
                        ul.appendChild(li);
                    });
                    slideDiv.appendChild(ul);
                }
                
                slideContent.appendChild(slideDiv);
            });
            
            return document.querySelectorAll('.slide');
        }

        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('admin') === '1') {
                document.body.classList.add('admin-mode');
            }

            slides = generateSlides();
            generateQRCode();
            connectWebSocket();
            setupKeyboardControls();
            updateSlideDisplay();
        });

        async function generateQRCode() {
            const qrImg = document.getElementById('qrCode');
            if (!qrImg) {
                console.error('QR code image element not found');
                return;
            }
            
            console.log('Generating QR code for:', AUDIENCE_URL);
            
            // Method 1: Try the local QR generation endpoint
            try {
                const response = await fetch('/qr/' + encodeURIComponent(AUDIENCE_URL) + '?size=300');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    qrImg.src = url;
                    qrImg.style.display = 'block';
                    console.log('QR code generated locally');
                    return;
                }
            } catch (e) {
                console.log('Local QR generation failed:', e);
            }
            
            // Method 2: Use external QR service
            const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(AUDIENCE_URL);
            console.log('Using external QR service:', apiUrl);
            qrImg.src = apiUrl;
            qrImg.style.display = 'block';
            
            // Add error handler
            qrImg.onerror = function() {
                console.error('QR code failed to load, showing text fallback');
                // Create a text-based fallback
                const qrContainer = document.querySelector('.qr-container');
                if (qrContainer) {
                    qrContainer.innerHTML = '<div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">' +
                        '<div style="font-size: 18px; color: #333; margin-bottom: 10px;">Join at:</div>' +
                        '<div style="font-size: 14px; color: #0078d4; font-weight: bold;">' + AUDIENCE_URL + '</div>' +
                        '</div>';
                }
            };
        }

        let wsReconnectTimeout = null;
        
        function connectWebSocket() {
            // Prevent multiple connections
            if (ws && ws.readyState === WebSocket.OPEN) {
                return;
            }
            
            // Clear any pending reconnect
            if (wsReconnectTimeout) {
                clearTimeout(wsReconnectTimeout);
                wsReconnectTimeout = null;
            }
            
            const wsUrl = \`\${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//\${window.location.host}/ws/slides\`;
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('Presenter connected to slide sync');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                console.log('WebSocket closed');
                ws = null;
                // Only reconnect once after close
                wsReconnectTimeout = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connectWebSocket();
                }, 5000);
            };
        }

        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'state':
                    if (data.data) {
                        if (data.data.currentSlideIndex !== undefined) {
                            currentSlideIndex = data.data.currentSlideIndex;
                            updateSlideDisplay();
                        }
                        if (data.data.participantCount !== undefined) {
                            updateParticipantCount(data.data.participantCount);
                        }
                    }
                    break;
                
                case 'participantUpdate':
                    if (data.data && data.data.count !== undefined) {
                        updateParticipantCount(data.data.count);
                    }
                    break;
                
                case 'slideChanged':
                    if (data.data && data.data.index !== undefined) {
                        currentSlideIndex = data.data.index;
                        updateSlideDisplay();
                    }
                    break;
                    
                case 'pollStart':
                    // Show poll overlay when poll starts
                    if (data.data) {
                        showPollOverlay(data.data);
                    }
                    break;
                    
                case 'pollUpdate':
                    // Update poll results in real-time
                    if (data.data && data.data.votes) {
                        updatePollResults(data.data.votes);
                    }
                    break;
                    
                case 'pollEnd':
                    // Handle poll end and auto-advance
                    if (data.data) {
                        handlePollEnd(data.data);
                    }
                    break;
            }
        }

        function updateParticipantCount(count) {
            const elem = document.getElementById('liveParticipantCount');
            if (elem) {
                elem.textContent = count;
                elem.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    elem.style.transform = 'scale(1)';
                }, 200);
            }
        }

        function nextSlide() {
            if (currentSlideIndex < slides.length - 1) {
                currentSlideIndex++;
                updateSlideDisplay();
                sendSlideUpdate();
            }
        }

        function previousSlide() {
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                updateSlideDisplay();
                sendSlideUpdate();
            }
        }

        function updateSlideDisplay() {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlideIndex);
            });
            
            // Slide number element was removed with admin controls
            // No need to update it anymore
        }

        function sendSlideUpdate() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'navigate',
                    index: currentSlideIndex
                }));
            }
        }

        function setupKeyboardControls() {
            document.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowRight':
                    case ' ':
                        e.preventDefault();
                        nextSlide();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        previousSlide();
                        break;
                    case 'p':
                    case 'P':
                        e.preventDefault();
                        startPoll();
                        break;
                    case '1':
                        e.preventDefault();
                        pickOption(1);
                        break;
                    case '2':
                        e.preventDefault();
                        pickOption(2);
                        break;
                    case '3':
                        e.preventDefault();
                        pickOption(3);
                        break;
                    case 'l':
                    case 'L':
                        e.preventDefault();
                        luckyPick();
                        break;
                    case 's':
                    case 'S':
                        e.preventDefault();
                        simulatePoll();
                        break;
                    case 'c':
                    case 'C':
                        e.preventDefault();
                        startContainer();
                        break;
                    case 'f':
                    case 'F':
                        e.preventDefault();
                        triggerFinale();
                        break;
                }
            });
        }

        // Poll functions
        function startPoll() {
            console.log('🗳️ Starting poll for current slide...');
            
            // Define poll options based on current slide
            const pollOptions = getPollOptionsForSlide(currentSlideIndex);
            
            const pollData = {
                pollId: 'poll-' + Date.now(),
                question: pollOptions.question,
                options: pollOptions.options,
                duration: 30
            };
            
            // Start poll via WebSocket to notify all clients
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'startPoll',
                    data: pollData
                }));
                
                // Also show on presenter view
                showPollOverlay(pollData);
                
                // Visual feedback
                const btn = document.querySelector('.poll-btn');
                if (btn) {
                    btn.style.background = '#28a745';
                    btn.textContent = 'Poll Active';
                }
            }
        }
        
        function getPollOptionsForSlide(slideIndex) {
            // Define polls for different slides
            const polls = [
                {
                    question: 'What Cloudflare feature interests you most?',
                    options: [
                        { id: 'workers', label: '⚡ Workers - Edge Functions' },
                        { id: 'durable', label: '🎯 Durable Objects - Stateful' },
                        { id: 'd1', label: '💾 D1 - Database at Edge' }
                    ]
                },
                {
                    question: 'What type of app would you build?',
                    options: [
                        { id: 'api', label: '🔌 REST API' },
                        { id: 'realtime', label: '💬 Real-time Chat' },
                        { id: 'static', label: '📄 Static Site' }
                    ]
                },
                {
                    question: 'Which database feature is most important?',
                    options: [
                        { id: 'speed', label: '⚡ Query Speed' },
                        { id: 'global', label: '🌍 Global Replication' },
                        { id: 'consistency', label: '🔒 Strong Consistency' }
                    ]
                },
                {
                    question: 'How should we handle traffic spikes?',
                    options: [
                        { id: 'queue', label: '🚦 Use Queues' },
                        { id: 'cache', label: '💾 Aggressive Caching' },
                        { id: 'scale', label: '📈 Auto-scale Workers' }
                    ]
                },
                {
                    question: 'What excites you about R2 storage?',
                    options: [
                        { id: 'egress', label: '💰 Zero Egress Fees' },
                        { id: 's3', label: '🔄 S3 Compatibility' },
                        { id: 'global', label: '🌍 Global Distribution' }
                    ]
                },
                {
                    question: 'Which AI use case sounds best?',
                    options: [
                        { id: 'chat', label: '💬 AI Chatbot' },
                        { id: 'image', label: '🖼️ Image Generation' },
                        { id: 'analysis', label: '📊 Data Analysis' }
                    ]
                }
            ];
            
            // Return poll for current slide or a default
            return polls[slideIndex] || polls[0];
        }

        function pickOption(num) {
            console.log(\`✅ Picking option #\${num}\`);
            alert(\`Force picked option #\${num}\`);
            // Would send pick command to poll system
        }

        function luckyPick() {
            const random = Math.floor(Math.random() * 3) + 1;
            console.log(\`🎲 Lucky pick: option #\${random}\`);
            alert(\`Lucky pick selected option #\${random}!\`);
            // Would trigger random selection
        }

        function simulatePoll() {
            console.log('🔄 Simulating poll with dummy votes...');
            alert('Simulating poll with 100 dummy votes');
            // Would generate fake votes for testing
        }

        function startContainer() {
            console.log('📦 Starting container demo...');
            alert('Container demo started! Watch the progress bar.');
            // Would trigger container processing demo
        }

        function showPollOverlay(pollData) {
            currentPollData = pollData;
            pollVotes = {};
            
            // Initialize vote counts
            pollData.options.forEach(option => {
                pollVotes[option.id] = 0;
            });
            
            // Hide all regular slides
            slides.forEach(slide => slide.classList.remove('active'));
            
            // Create or update poll slide
            let pollSlide = document.getElementById('pollSlide');
            if (!pollSlide) {
                pollSlide = document.createElement('div');
                pollSlide.id = 'pollSlide';
                pollSlide.className = 'poll-slide';
                document.getElementById('slideContent').appendChild(pollSlide);
            }
            
            // Build poll HTML with same styling as regular slides
            let pollHtml = '<div class="poll-container">' +
                '<h1 style="color: #c75300; font-size: 3.5rem; margin-bottom: 2rem;">' + pollData.question + '</h1>' +
                '<div class="poll-timer-display" style="position: absolute; top: 2rem; right: 2rem; background: #c75300; color: white; padding: 1rem 2rem; border-radius: 50px; font-size: 2rem; font-weight: bold;">' +
                '<span id="pollTimer">30</span>s' +
                '</div>' +
                '<div id="pollResults" style="margin-top: 2rem;">';
            
            pollData.options.forEach(option => {
                pollHtml += '<div class="poll-option-result" data-option-id="' + option.id + '" style="margin-bottom: 2rem;">' +
                    '<div class="poll-option-header" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">' +
                    '<span class="poll-option-label" style="font-size: 1.8rem; color: #333; font-weight: 600;">' + option.label + '</span>' +
                    '<span class="poll-option-count" data-count-for="' + option.id + '" style="font-size: 1.6rem; color: #666;">0 votes</span>' +
                    '</div>' +
                    '<div class="poll-option-bar-container" style="background: #f0f0f0; height: 60px; border-radius: 30px; overflow: hidden; position: relative;">' +
                    '<div class="poll-option-bar" data-bar-for="' + option.id + '" style="width: 0%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.5s ease-out; display: flex; align-items: center; padding: 0 1rem;">' +
                    '<span data-percent-for="' + option.id + '" style="color: white; font-size: 1.4rem; font-weight: bold;">0%</span>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
            });
            
            pollHtml += '</div>' +
                '<div id="pollTotal" style="text-align: center; font-size: 1.4rem; color: #666; margin-top: 2rem;">Total votes: 0</div>' +
                '</div>';
            
            pollSlide.innerHTML = pollHtml;
            pollSlide.classList.add('active');
            
            // Start timer
            let timeRemaining = pollData.duration || 30;
            document.getElementById('pollTimer').textContent = timeRemaining;
            
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(() => {
                timeRemaining--;
                document.getElementById('pollTimer').textContent = timeRemaining;
                
                if (timeRemaining <= 0) {
                    clearInterval(pollTimer);
                }
            }, 1000);
        }
        
        function updatePollResults(votes) {
            if (!currentPollData) return;
            
            // Make sure poll slide exists and is visible
            const pollSlide = document.getElementById('pollSlide');
            if (!pollSlide || !pollSlide.classList.contains('active')) {
                console.log('Poll slide not active, skipping update');
                return;
            }
            
            pollVotes = votes;
            const total = Object.values(votes).reduce((sum, count) => sum + count, 0);
            
            // Find the option with most votes
            let maxVotes = 0;
            let winningOption = null;
            
            Object.entries(votes).forEach(([optionId, count]) => {
                if (count > maxVotes) {
                    maxVotes = count;
                    winningOption = optionId;
                }
            });
            
            // Update each option's display
            currentPollData.options.forEach(option => {
                const count = votes[option.id] || 0;
                const percentage = total > 0 ? (count / total * 100) : 0;
                
                // Update count text
                const countElem = document.querySelector('[data-count-for="' + option.id + '"]');
                if (countElem) {
                    countElem.textContent = count + ' vote' + (count !== 1 ? 's' : '');
                }
                
                // Update bar width and percentage
                const barElem = document.querySelector('[data-bar-for="' + option.id + '"]');
                if (barElem) {
                    barElem.style.width = percentage + '%';
                    const percentElem = document.querySelector('[data-percent-for="' + option.id + '"]');
                    if (percentElem) {
                        percentElem.textContent = Math.round(percentage) + '%';
                    }
                }
                
                // Highlight winning option
                const resultDiv = document.querySelector('[data-option-id="' + option.id + '"]');
                if (resultDiv) {
                    if (option.id === winningOption && count > 0) {
                        resultDiv.classList.add('winning');
                    } else {
                        resultDiv.classList.remove('winning');
                    }
                }
            });
            
            // Update total
            document.getElementById('pollTotal').textContent = 'Total votes: ' + total;
        }
        
        function handlePollEnd(data) {
            clearInterval(pollTimer);
            
            if (data.winner) {
                // Highlight final winner
                document.querySelectorAll('.poll-option-result').forEach(elem => {
                    elem.classList.remove('winning');
                });
                
                const winnerElem = document.querySelector('[data-option-id="' + data.winner + '"]');
                if (winnerElem) {
                    winnerElem.classList.add('winning');
                }
                
                // Get the next slide based on winner
                const nextSlideIndex = getSlideForWinner(data.winner);
                
                // Show winner for 3 seconds then advance
                setTimeout(() => {
                    const pollSlide = document.getElementById('pollSlide');
                    if (pollSlide) {
                        pollSlide.classList.remove('active');
                    }
                    
                    // Auto-advance to winning slide
                    if (nextSlideIndex !== null && nextSlideIndex !== currentSlideIndex) {
                        currentSlideIndex = nextSlideIndex;
                        updateSlideDisplay();
                        sendSlideUpdate();
                    }
                    
                    // Reset poll button
                    const btn = document.querySelector('.poll-btn');
                    if (btn) {
                        btn.style.background = '#00a86b';
                        btn.textContent = 'Start Poll (P)';
                    }
                }, 3000);
            }
        }
        
        function getSlideForWinner(winnerId) {
            // Map winners to next slides based on current slide
            const slideRoutes = [
                { workers: 1, durable: 2, d1: 3 },  // From slide 0
                { api: 4, realtime: 2, static: 5 },  // From slide 1  
                { speed: 3, global: 5, consistency: 2 }, // From slide 2
                { queue: 4, cache: 5, scale: 1 },    // From slide 3
                { egress: 5, s3: 3, global: 6 },     // From slide 4
                { chat: 6, image: 6, analysis: 3 }   // From slide 5
            ];
            
            const routes = slideRoutes[currentSlideIndex];
            return routes ? (routes[winnerId] || null) : null;
        }
        
        function triggerFinale() {
            console.log('🎉 Triggering finale...');
            alert('Finale triggered! Pushing contact info to all devices.');
            // Would push contact card to all audience devices
        }
    </script>
</body>
</html>`;