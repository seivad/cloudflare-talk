// Complete presenter view HTML with dynamic slide generation
export const COMPLETE_SLIDES_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare Tech Talk - Presenter View</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }

        .slide-container {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .slide-wrapper {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        }

        .ppt-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
        }

        .slide-content-area {
            position: relative;
            z-index: 10;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .slide-content {
            width: 1700px;
            height: 850px;
            color: #333;
            display: flex;
            align-items: start;
            justify-content: center;
            padding: 8rem 3rem 0;
        }

        .slide {
            width: 100%;
            display: none;
            animation: slideIn 0.5s ease-out;
        }

        .slide.active {
            display: block;
        }
        
        .slide.with-gif {
            display: none;
        }
        
        .slide.with-gif.active {
            display: flex;
            gap: 3rem;
        }
        
        .slide-content-wrapper {
            flex: 0 0 70%;
            display: flex;
            flex-direction: column;
        }
        
        .slide-gif-wrapper {
            flex: 0 0 30%;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 0 2rem;
        }
        
        .slide-gif-container {
            width: min(100%, 400px);
            aspect-ratio: 1;
            border-radius: 6%;
            overflow: hidden;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            background: #f0f0f0;
        }
        
        .slide-gif {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .qr-container {
            position: absolute;
            bottom: 60px;
            right: 110px;
            z-index: 9999;
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
        }

        @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
        }

        /* Slide content styles */
        .slide h1 {
            font-size: 3.5rem;
            color: #c75300;
            margin-bottom: 1.5rem;
            font-weight: 700;
        }

        .slide h2 {
            font-size: 2.8rem;
            color: #c75300;
            margin-bottom: 1.5rem;
            font-weight: 700;
        }

        .slide p {
            font-size: 1.4rem;
            line-height: 1.8;
            margin-bottom: 1.5rem;
            color: #444;
        }

        .slide ul {
            list-style: none;
            font-size: 1.3rem;
            line-height: 2;
            color: #555;
            padding-left: 0;
        }

        .slide ul li {
            margin-bottom: 0.8rem;
        }

        /* Poll slide styles */
        .poll-slide {
            display: none;
            width: 1700px;
            height: 850px;
            color: #333;
            padding: 8rem 3rem 0;
        }
        
        .poll-slide.active {
            display: flex;
            gap: 3rem;
        }
        
        .poll-content-wrapper {
            flex: 0 0 70%;
            display: flex;
            flex-direction: column;
        }
        
        .poll-gif-wrapper {
            flex: 0 0 30%;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 0 2rem;
        }
        
        .poll-gif-container {
            width: min(100%, 400px);
            aspect-ratio: 1;
            border-radius: 6%;
            overflow: hidden;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            background: #f0f0f0;
        }
        
        .poll-gif {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }
        
        .poll-header {
            margin-bottom: 2rem;
        }
        
        .poll-question {
            font-size: 2.5rem;
            color: #c75300;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        
        .poll-timer {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 20px;
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .poll-options {
            display: grid;
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .poll-option {
            position: relative;
            padding: 1.5rem 2rem;
            background: #f5f5f5;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            overflow: hidden;
            min-height: 80px;
        }
        
        .poll-option-bar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            background: linear-gradient(90deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
            transition: width 0.5s ease-out;
            border-radius: 12px;
        }
        
        .poll-option-content {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        
        .poll-option-label {
            font-size: 1.4rem;
            font-weight: 600;
            color: #333;
        }
        
        .poll-option-votes {
            font-size: 1.6rem;
            font-weight: bold;
            color: #667eea;
            margin-left: 2rem;
        }
        
        .poll-option-percentage {
            font-size: 1.2rem;
            color: #999;
            margin-left: 1rem;
        }

        @keyframes voteAdded {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        .vote-added {
            animation: voteAdded 0.3s ease-out;
        }
    </style>
</head>
<body>
    <div class="live-indicator">
        <div class="live-dot"></div>
        <span>LIVE</span>
        <span style="margin-left: 10px;">🏠</span>
        <span id="roomIdDisplay" style="font-family: monospace; font-weight: bold;">------</span>
        <span style="margin-left: 10px;">👥</span>
        <span id="liveParticipantCount">0</span>
        <span>watching</span>
    </div>

    <div class="slide-container">
        <div class="slide-wrapper">
            <img src="/powerpoint-bg.png" class="ppt-background" alt="">
            <div class="slide-content-area">
                <div class="qr-container">
                    <img id="qrCode" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Join QR" class="qr-code" style="display: block;">
                </div>

                <div class="slide-content" id="slideContent">
                    <!-- Slides will be dynamically generated here -->
                </div>
            </div>
        </div>
        
        <!-- Poll slide will be inserted dynamically -->
    </div>

    <script>
        // Get session code from URL parameters if present, otherwise generate/retrieve room ID
        const urlParams = new URLSearchParams(window.location.search);
        let roomId = urlParams.get('session');
        
        if (!roomId) {
            // Fall back to localStorage for backwards compatibility
            roomId = localStorage.getItem('presentationRoomId');
            if (!roomId) {
                roomId = Math.floor(100000 + Math.random() * 900000).toString();
                localStorage.setItem('presentationRoomId', roomId);
            }
        } else {
            // Store the session code for consistency
            localStorage.setItem('presentationRoomId', roomId);
        }
        
        const AUDIENCE_URL = window.location.origin + '/audience/' + roomId;
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
            },
            {
                title: 'Thanks for Joining! 🙏',
                content: ['Connect with me'],
                bullets: [],
                isBioSlide: true
            }
        ];

        function generateSlides() {
            const slideContent = document.getElementById('slideContent');
            slideContent.innerHTML = '';
            
            slideData.forEach((slide, index) => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'slide' + (index === 0 ? ' active' : '');
                slideDiv.setAttribute('data-index', index.toString());
                
                // Check if this is the bio slide
                if (slide.isBioSlide) {
                    // Create custom bio slide content
                    slideDiv.innerHTML = 
                        '<div style="display: flex; align-items: center; justify-content: center; gap: 4rem; height: 100%;">' +
                            '<div style="text-align: center;">' +
                                '<img src="/photo.jpg" alt="Mick Davies" style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid #c75300; box-shadow: 0 8px 32px rgba(199, 83, 0, 0.3); margin-bottom: 2rem;">' +
                                '<h1 style="color: #c75300; margin-bottom: 0.5rem; font-size: 3.5rem;">Thanks for Joining! 🙏</h1>' +
                                '<h2 style="color: #333; margin-bottom: 2rem; font-size: 2.5rem;">Mick Davies</h2>' +
                                '<p style="font-size: 1.6rem; color: #555; margin-bottom: 1rem;">📧 <a href="mailto:mick@5150studios.com.au" style="color: #c75300; text-decoration: none;">mick@5150studios.com.au</a></p>' +
                            '</div>' +
                            '<div style="text-align: left;">' +
                                '<h3 style="color: #c75300; font-size: 2.2rem; margin-bottom: 1.5rem;">Connect with me</h3>' +
                                '<div style="display: flex; flex-direction: column; gap: 1rem; font-size: 1.4rem;">' +
                                    '<div style="display: flex; align-items: center; gap: 1rem;"><span style="font-size: 1.8rem;">𝕏</span><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div style="display: flex; align-items: center; gap: 1rem;"><span style="font-size: 1.8rem;">📷</span><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div style="display: flex; align-items: center; gap: 1rem;"><span style="font-size: 1.8rem;">💼</span><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                                '</div>' +
                                '<div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 2px solid #e0e0e0;">' +
                                    '<h4 style="color: #c75300; font-size: 1.6rem; margin-bottom: 1rem;">📦 Get the Code</h4>' +
                                    '<p style="font-size: 1.2rem; color: #555;"><a href="https://github.com/seivad/cloudflare-talk" target="_blank" style="color: #c75300; text-decoration: none; font-weight: 600;">github.com/seivad/cloudflare-talk</a></p>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
                } else {
                    // Regular slide content
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
                }
                
                slideContent.appendChild(slideDiv);
            });
            
            return document.querySelectorAll('.slide');
        }

        document.addEventListener('DOMContentLoaded', () => {
            // Check for admin mode
            if (urlParams.get('admin') === '1') {
                document.body.classList.add('admin-mode');
            }

            // Display room ID (session code)
            document.getElementById('roomIdDisplay').textContent = roomId;
            
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
            
            qrImg.onerror = function() {
                console.error('Failed to load QR code from external service');
                // Show fallback message
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
        let heartbeatInterval = null;
        let missedPongs = 0;
        
        function connectWebSocket() {
            // Prevent multiple connections
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                return;
            }
            
            // Clear any pending reconnect
            if (wsReconnectTimeout) {
                clearTimeout(wsReconnectTimeout);
                wsReconnectTimeout = null;
            }
            
            // Clear old heartbeat
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }
            
            const wsUrl = \`\${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//\${window.location.host}/ws/slides/\${roomId}\`;
            console.log('Presenter connecting to:', wsUrl);
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('✅ Presenter connected to room:', roomId);
                missedPongs = 0;
                
                // Send join message
                ws.send(JSON.stringify({ type: 'join', roomId: roomId, isPresenter: true }));
                
                // Send heartbeat every 10 seconds with pong monitoring
                heartbeatInterval = setInterval(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        missedPongs++;
                        if (missedPongs > 2) {
                            console.log('Too many missed pongs, reconnecting...');
                            ws.close();
                            return;
                        }
                        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                    } else {
                        clearInterval(heartbeatInterval);
                    }
                }, 10000);
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
            // Reset missed pongs on any message
            if (data.type === 'pong') {
                missedPongs = 0;
                return;
            }
            
            switch (data.type) {
                case 'state':
                    if (data.data) {
                        if (data.data.currentSlideIndex !== undefined) {
                            currentSlideIndex = data.data.currentSlideIndex;
                        }
                        // Update slide content if provided from server
                        if (data.data.currentSlide) {
                            updateSlideContentFromServer(data.data.currentSlide);
                        } else {
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
                    if (data.data) {
                        if (data.data.index !== undefined) {
                            currentSlideIndex = data.data.index;
                        }
                        // Update with server content
                        updateSlideContentFromServer(data.data);
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
            document.getElementById('liveParticipantCount').textContent = count;
        }

        function previousSlide() {
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                updateSlideDisplay();
                sendSlideUpdate();
            }
        }

        function nextSlide() {
            if (currentSlideIndex < slides.length - 1) {
                currentSlideIndex++;
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
        
        function updateSlideContentFromServer(slideData) {
            const slideDiv = document.querySelector('.slide.active');
            if (!slideDiv) return;
            
            // Check if this is the bio slide
            if (slideData.isBioSlide) {
                // Create custom bio slide content
                slideDiv.innerHTML = 
                    '<div style="display: flex; align-items: center; justify-content: center; gap: 4rem; height: 100%;">' +
                        '<div style="text-align: center;">' +
                            '<img src="/photo.jpg" alt="Mick Davies" style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid #c75300; box-shadow: 0 8px 32px rgba(199, 83, 0, 0.3); margin-bottom: 2rem;">' +
                            '<h1 style="color: #c75300; margin-bottom: 0.5rem; font-size: 3.5rem;">Thanks for Joining! 🙏</h1>' +
                            '<h2 style="color: #333; margin-bottom: 2rem; font-size: 2.5rem;">Mick Davies</h2>' +
                            '<p style="font-size: 1.6rem; color: #555; margin-bottom: 1rem;"><i class="fas fa-envelope" style="color: #c75300; margin-right: 0.5rem;"></i><a href="mailto:mick@5150studios.com.au" style="color: #c75300; text-decoration: none;">mick@5150studios.com.au</a></p>' +
                        '</div>' +
                        '<div style="text-align: left;">' +
                            '<h3 style="color: #c75300; font-size: 2.2rem; margin-bottom: 1.5rem;">Connect with me</h3>' +
                            '<div style="display: flex; flex-direction: column; gap: 1rem; font-size: 1.4rem;">' +
                                '<div style="display: flex; align-items: center; gap: 1rem;"><i class="fab fa-x-twitter" style="font-size: 1.6rem; width: 2rem; color: #333;"></i><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                '<div style="display: flex; align-items: center; gap: 1rem;"><i class="fab fa-instagram" style="font-size: 1.6rem; width: 2rem; color: #E4405F;"></i><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                '<div style="display: flex; align-items: center; gap: 1rem;"><i class="fab fa-linkedin" style="font-size: 1.6rem; width: 2rem; color: #0077B5;"></i><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                            '</div>' +
                            '<div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 2px solid #e0e0e0;">' +
                                '<h4 style="color: #c75300; font-size: 1.6rem; margin-bottom: 1rem;"><i class="fab fa-github" style="margin-right: 0.5rem;"></i>Get the Code</h4>' +
                                '<p style="font-size: 1.2rem; color: #555;"><a href="https://github.com/seivad/cloudflare-talk" target="_blank" style="color: #c75300; text-decoration: none; font-weight: 600;">github.com/seivad/cloudflare-talk</a></p>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
            } else {
                // Regular slide content from server
                slideDiv.innerHTML = '';
                
                // Check if slide has a GIF
                if (slideData.gif) {
                    // Add with-gif class and create split layout
                    slideDiv.classList.add('with-gif');
                    
                    // Create content wrapper
                    const contentWrapper = document.createElement('div');
                    contentWrapper.className = 'slide-content-wrapper';
                    
                    // Add title
                    const title = document.createElement(currentSlideIndex === 0 ? 'h1' : 'h2');
                    title.textContent = slideData.title || 'Untitled';
                    contentWrapper.appendChild(title);
                    
                    // Add content paragraphs
                    if (slideData.content && Array.isArray(slideData.content)) {
                        slideData.content.forEach(text => {
                            const p = document.createElement('p');
                            p.textContent = text;
                            if (currentSlideIndex === 0) {
                                p.style.fontSize = '2rem';
                                p.style.color = '#0078d4';
                            }
                            contentWrapper.appendChild(p);
                        });
                    }
                    
                    // Add bullet points if any
                    if (slideData.bullets && slideData.bullets.length > 0) {
                        const ul = document.createElement('ul');
                        slideData.bullets.forEach(bullet => {
                            const li = document.createElement('li');
                            li.textContent = bullet;
                            ul.appendChild(li);
                        });
                        contentWrapper.appendChild(ul);
                    }
                    
                    // Create GIF wrapper
                    const gifWrapper = document.createElement('div');
                    gifWrapper.className = 'slide-gif-wrapper';
                    
                    const gifContainer = document.createElement('div');
                    gifContainer.className = 'slide-gif-container';
                    
                    const gif = document.createElement('img');
                    gif.src = slideData.gif;
                    gif.alt = 'Slide animation';
                    gif.className = 'slide-gif';
                    
                    gifContainer.appendChild(gif);
                    gifWrapper.appendChild(gifContainer);
                    
                    slideDiv.appendChild(contentWrapper);
                    slideDiv.appendChild(gifWrapper);
                } else {
                    // No GIF, render normally
                    slideDiv.classList.remove('with-gif');
                    
                    // Add title
                    const title = document.createElement(currentSlideIndex === 0 ? 'h1' : 'h2');
                    title.textContent = slideData.title || 'Untitled';
                    slideDiv.appendChild(title);
                    
                    // Add content paragraphs
                    if (slideData.content && Array.isArray(slideData.content)) {
                        slideData.content.forEach(text => {
                            const p = document.createElement('p');
                            p.textContent = text;
                            if (currentSlideIndex === 0) {
                                p.style.fontSize = '2rem';
                                p.style.color = '#0078d4';
                            }
                            slideDiv.appendChild(p);
                        });
                    }
                    
                    // Add bullet points if any (for non-GIF slides)
                    if (slideData.bullets && slideData.bullets.length > 0) {
                        const ul = document.createElement('ul');
                        slideData.bullets.forEach(bullet => {
                            const li = document.createElement('li');
                            li.textContent = bullet;
                            ul.appendChild(li);
                        });
                        slideDiv.appendChild(ul);
                    }
                }
            }
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
                    case 'ArrowLeft':
                        e.preventDefault();
                        previousSlide();
                        break;
                    case 'ArrowRight':
                    case ' ':
                        e.preventDefault();
                        nextSlide();
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
        async function startPoll() {
            console.log('🗳️ Starting poll for current slide...');
            
            try {
                // Fetch dynamic poll options from backend
                const response = await fetch('/api/poll-options?roomId=' + roomId);
                const pollOptions = await response.json();
                
                if (!pollOptions.options || pollOptions.options.length === 0) {
                    console.log('No poll options available - all slides visited');
                    return;
                }
                
                const pollData = {
                    pollId: 'poll-' + Date.now(),
                    question: pollOptions.question,
                    options: pollOptions.options,
                    duration: 20,
                    isReset: pollOptions.reset
                };
                
                // Start poll via WebSocket to notify all clients
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'startPoll',
                        data: pollData
                    }));
                    
                    // Also show on presenter view
                    showPollOverlay(pollData);
                }
            } catch (error) {
                console.error('Failed to fetch poll options:', error);
                // Fallback to basic poll
                const fallbackData = {
                    pollId: 'poll-' + Date.now(),
                    question: 'Technical difficulty - manual navigation needed',
                    options: [
                        { id: 'manual1', label: 'Continue with next slide' },
                        { id: 'manual2', label: 'Skip to different section' }
                    ],
                    duration: 20
                };
                showPollOverlay(fallbackData);
            }
        }

        function getPollOptionsForSlide(slideIndex) {
            // Map slide indices to their labels for visited tracking
            const allSlideOptions = [
                { id: 'workers', label: 'Workers & Durable Objects', slideIndex: 1 },
                { id: 'durable', label: 'Durable Objects', slideIndex: 2 },
                { id: 'd1', label: 'D1 Database', slideIndex: 3 },
                { id: 'queues', label: 'Queues', slideIndex: 4 },
                { id: 'r2', label: 'R2 Storage', slideIndex: 5 },
                { id: 'ai', label: 'AI', slideIndex: 6 },
                { id: 'workflows', label: 'Workflows', slideIndex: 7 },
                { id: 'containers', label: 'Containers', slideIndex: 8 },
                { id: 'loadbalancers', label: 'Load Balancers', slideIndex: 9 },
                { id: 'aimodels', label: 'AI Models', slideIndex: 10 },
                { id: 'aiagents', label: 'AI Agents', slideIndex: 11 }
            ];
            
            // For now, return a basic poll - the filtering will happen on the backend
            // The backend will need to track visited slides and filter options
            return {
                question: 'Which Cloudflare product should we explore next?',
                options: [
                    { id: 'option1', label: 'Workers & Durable Objects' },
                    { id: 'option2', label: 'AI Models & Agents' },
                    { id: 'option3', label: 'Containers & Workflows' }
                ]
            };
        }

        function showPollOverlay(pollData) {
            currentPollData = pollData;
            pollVotes = {};
            
            // Initialize vote counts
            pollData.options.forEach(option => {
                pollVotes[option.id] = 0;
            });
            
            // Hide regular slides
            document.getElementById('slideContent').style.display = 'none';
            
            // List of available GIFs (excluding the mp4 file)
            const availableGifs = [
                'cosmo-kramer-head-nod.gif',
                'fire-elmo.gif',
                'jim-looking-at-camera.gif',
                'jim-the-office.gif',
                'magatron-strangling-starscream.gif',
                'michael-scott-wink.gif',
                'moss-brilliant.gif',
                'moss-fire.gif',
                'moss-roy-first-bump.gif',
                'nicolas-cage-happy.gif',
                'pedro-pascal-nicolas-cage.gif',
                'seinfeld-kramer.gif',
                'suss-monkey.gif',
                'thumbs-up-computer-kid.gif'
            ];
            
            // Select a random GIF
            const randomGif = availableGifs[Math.floor(Math.random() * availableGifs.length)];
            
            // Create or update poll slide
            let pollSlide = document.querySelector('.poll-slide');
            if (!pollSlide) {
                pollSlide = document.createElement('div');
                pollSlide.className = 'poll-slide';
                document.querySelector('.slide-content-area').appendChild(pollSlide);
            }
            
            pollSlide.innerHTML = \`
                <div class="poll-content-wrapper">
                    <div class="poll-header">
                        <h2 class="poll-question">\${pollData.question || 'What should we explore next?'}</h2>
                        <div class="poll-timer" id="pollTimer">20</div>
                    </div>
                    <div class="poll-options" id="pollOptions">
                        \${pollData.options.map(option => \`
                            <div class="poll-option" data-option-id="\${option.id}">
                                <div class="poll-option-bar" style="width: 0%"></div>
                                <div class="poll-option-content">
                                    <span class="poll-option-label">\${option.label}</span>
                                    <div>
                                        <span class="poll-option-votes" data-votes="\${option.id}">0</span>
                                        <span class="poll-option-percentage" data-percentage="\${option.id}">0%</span>
                                    </div>
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
                <div class="poll-gif-wrapper">
                    <div class="poll-gif-container">
                        <img src="/gifs/\${randomGif}" alt="Poll animation" class="poll-gif" />
                    </div>
                </div>
            \`;
            
            pollSlide.classList.add('active');
            
            // Start timer
            let timeRemaining = pollData.duration || 20;
            const timerElement = document.getElementById('pollTimer');
            if (timerElement) {
                timerElement.textContent = timeRemaining;
            }
            
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(() => {
                timeRemaining--;
                const timerEl = document.getElementById('pollTimer');
                if (timerEl) {
                    timerEl.textContent = timeRemaining;
                }
                if (timeRemaining <= 0) {
                    clearInterval(pollTimer);
                    endPoll();
                }
            }, 1000);
        }

        function updatePollResults(votes) {
            if (!currentPollData) return;
            
            // Update vote counts
            Object.keys(votes).forEach(optionId => {
                pollVotes[optionId] = votes[optionId];
            });
            
            // Calculate total votes
            const totalVotes = Object.values(pollVotes).reduce((sum, count) => sum + count, 0);
            
            // Update each option's display
            currentPollData.options.forEach(option => {
                const voteCount = pollVotes[option.id] || 0;
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                
                // Update vote count
                const voteElement = document.querySelector(\`[data-votes="\${option.id}"]\`);
                if (voteElement) {
                    const oldCount = parseInt(voteElement.textContent);
                    voteElement.textContent = voteCount;
                    if (voteCount > oldCount) {
                        voteElement.classList.add('vote-added');
                        setTimeout(() => voteElement.classList.remove('vote-added'), 300);
                    }
                }
                
                // Update percentage
                const percentElement = document.querySelector(\`[data-percentage="\${option.id}"]\`);
                if (percentElement) {
                    percentElement.textContent = percentage + '%';
                }
                
                // Update bar width
                const optionElement = document.querySelector(\`[data-option-id="\${option.id}"] .poll-option-bar\`);
                if (optionElement) {
                    optionElement.style.width = percentage + '%';
                }
            });
        }

        function handlePollEnd(data) {
            // Show winner with very clear green highlighting
            if (data.winner) {
                const winnerElement = document.querySelector(\`[data-option-id="\${data.winner}"]\`);
                if (winnerElement) {
                    // Make it very obviously green
                    winnerElement.style.background = '#4caf50';
                    winnerElement.style.border = '3px solid #2e7d32';
                    winnerElement.style.color = 'white';
                    winnerElement.style.transform = 'scale(1.05)';
                    winnerElement.style.boxShadow = '0 4px 20px rgba(76, 175, 80, 0.4)';
                    
                    // Make the label more prominent
                    const label = winnerElement.querySelector('.poll-option-label');
                    if (label) {
                        label.style.fontWeight = 'bold';
                        label.style.color = 'white';
                        label.style.fontSize = '1.6rem';
                    }
                    
                    // Make vote count more prominent
                    const votes = winnerElement.querySelector('.poll-option-votes');
                    if (votes) {
                        votes.style.color = 'white';
                        votes.style.fontWeight = 'bold';
                        votes.style.fontSize = '1.8rem';
                    }
                    
                    // Animate the winner
                    winnerElement.style.transition = 'all 0.5s ease-out';
                }
            }
            
            // Show tie indicator if applicable
            if (data.isTie) {
                const pollQuestion = document.querySelector('.poll-question');
                if (pollQuestion) {
                    pollQuestion.innerHTML += ' <span style="color: #ff6b6b; font-size: 1.5rem;">(Tie - Random Pick!)</span>';
                }
            }
            
            // Hide poll after delay - backend will handle slide navigation
            setTimeout(() => {
                const pollSlide = document.querySelector('.poll-slide');
                if (pollSlide) {
                    pollSlide.classList.remove('active');
                }
                document.getElementById('slideContent').style.display = 'flex';
                
                // Backend handles navigation, so don't manually advance here
            }, 3000);
        }

        function endPoll() {
            clearInterval(pollTimer);
            
            // Don't determine winner locally - wait for backend to decide
            // The backend will handle ties and send the real winner via WebSocket
            console.log('Poll timer ended, waiting for backend to determine winner...');
        }

        function pickOption(number) {
            if (!currentPollData || !currentPollData.options[number - 1]) return;
            
            const optionId = currentPollData.options[number - 1].id;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'pickWinner',
                    optionId: optionId
                }));
            }
        }

        function luckyPick() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'pickWinner',
                    strategy: 'random'
                }));
            }
        }

        function simulatePoll() {
            console.log('🤖 Simulating poll votes...');
            
            if (!currentPollData) {
                console.log('No active poll to simulate');
                return;
            }
            
            // Simulate random votes
            const voteCount = 50;
            for (let i = 0; i < voteCount; i++) {
                setTimeout(() => {
                    const randomOption = currentPollData.options[Math.floor(Math.random() * currentPollData.options.length)];
                    pollVotes[randomOption.id] = (pollVotes[randomOption.id] || 0) + 1;
                    updatePollResults(pollVotes);
                }, i * 50);
            }
        }

        function startContainer() {
            console.log('📦 Starting container demo...');
            fetch('/api/container/start', {
                method: 'POST',
                headers: { 'X-Admin-Key': 'tech-talk-2025' }
            });
        }

        function triggerFinale() {
            console.log('🎉 Going to final slide...');
            // Navigate to the last slide (bio slide)
            const finalSlideIndex = slideData.length - 1;
            currentSlideIndex = finalSlideIndex;
            updateSlideDisplay();
            sendSlideUpdate();
        }
    </script>
</body>
</html>`;