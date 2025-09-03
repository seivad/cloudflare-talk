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
            width: 1720px;
            height: 850px;
            color: #333;
            display: flex;
            align-items: start;
            justify-content: center;
            padding: 6rem 2rem 0;
        }

        .slide {
            width: 100%;
            display: none !important;
            animation: slideIn 0.5s ease-out;
        }

        .slide.active {
            display: block !important;
        }
        
        .slide.with-gif {
            display: none !important;
        }
        
        .slide.with-gif.active {
            display: flex !important;
            gap: 1rem;
            align-items: stretch;
        }
        
        .slide-content-wrapper {
            flex: 0 0 60%;
            display: flex;
            flex-direction: column;
        }
        
        .slide-media-wrapper {
            flex: 0 0 40%;
            display: flex;
            gap: 2rem;
            align-items: flex-start;
            justify-content: start;
        }
        
        .slide-gif-container {
            flex: 1;
            max-width: 350px;
            aspect-ratio: 1;
            border-radius: 6%;
            overflow: hidden;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            background: #f0f0f0;
        }
        
        .slide-qr-container {
            flex: 1;
            max-width: 350px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        
        .slide-qr-container .qr-code {
            aspect-ratio: 1;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .slide-qr-container .qr-label {
            font-size: 1.4rem;
            font-weight: 600;
            color: #333;
            text-align: center;
        }
        
        .bio-heading {
            color: #c75300 !important;
            margin: 0 !important;
            font-size: 2rem !important;
            text-align: center !important;
            line-height: 1.2 !important;
            font-weight: 700 !important;
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
            transition: all 0.3s ease;
        }
        
        /* Hide absolute QR for slides with GIF (they use side-by-side layout) */
        .slide.with-gif ~ .qr-container {
            display: none !important;
        }
        
        /* For initial slides - centered and larger */
        .qr-container.initial-slide {
            position: static;
            margin: 3rem auto 0;
            display: block;
            background: white;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            border: 3px solid #F6821F;
            max-width: 300px;
        }

        .qr-code {
            width: 300px;
            height: 300px;
            display: block;
            object-fit: contain;
        }
        
        .qr-container.initial-slide .qr-code {
            width: 250px;
            height: 250px;
            margin: 0 auto;
        }
        
        .qr-label {
            margin-top: 1rem;
            color: #333;
            font-size: 1.1rem;
            font-weight: 600;
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
            font-size: 3.5rem;
            color: #c75300;
            margin-bottom: 1.5rem;
            font-weight: 700;
        }

        .slide p {
            font-size: 2rem;
            line-height: 1.8;
            margin-bottom: 1.5rem;
            color: #444;
        }

        .slide ul {
            list-style: none;
            font-size: 2rem;
            line-height: 1.8;
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
                <div class="qr-container" id="mainQRContainer">
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
                console.log('📍 Generated new room ID:', roomId);
            } else {
                console.log('📍 Using room ID from localStorage:', roomId);
            }
        } else {
            // Store the session code for consistency
            localStorage.setItem('presentationRoomId', roomId);
            console.log('📍 Using room ID from URL:', roomId);
        }
        
        console.log('🔗 This presenter window is connected to room:', roomId);
        console.log('🔗 Audience members should join:', window.location.origin + '/audience/' + roomId);
        
        const AUDIENCE_URL = window.location.origin + '/audience/' + roomId;
        let currentSlideIndex = 0;
        let slides = [];
        let totalSlidesFromDB = 0; // Track actual database slide count
        let ws = null;
        let currentPollData = null;
        let pollTimer = null;
        let pollVotes = {};

        // Slides will be loaded dynamically from server
        // No hard-coded slides to prevent flicker
                const slideDiv = document.createElement('div');
                slideDiv.className = 'slide' + (index === 0 ? ' active' : '');
                slideDiv.setAttribute('data-index', index.toString());
                
                // Check if this is the bio slide
                if (slide.isBioSlide) {
                    // Create custom bio slide content
                    slideDiv.innerHTML = 
                        '<div style="display: flex; align-items: center; justify-content: center; gap: 10rem; height: 100%;">' +
                            '<div style="text-align: center;">' +
                                '<img src="/photo.jpg" alt="Mick Davies" style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid #c75300; box-shadow: 0 8px 32px rgba(199, 83, 0, 0.3); margin-bottom: 2rem;">' +
                                '<h1 class="bio-heading">Thanks for Joining! 🙏</h1>' +
                                '<h2 style="color: #333; margin-bottom: 2rem; font-size: 2.5rem;">Mick Davies</h2>' +
                                '<p style="font-size: 1.6rem; color: #555; margin-bottom: 1rem;">📧 <a href="mailto:mick@5150studios.com.au" style="color: #c75300; text-decoration: none;">mick@5150studios.com.au</a></p>' +
                            '</div>' +
                            '<div style="text-align: left;">' +
                                '<h3 style="color: #c75300; font-size: 2.2rem; margin-bottom: 1.5rem; text-align: left;">Connect with me</h3>' +
                                '<div style="display: flex; flex-direction: column; gap: 1rem; font-size: 2rem;">' +
                                    '<div style="display: flex; align-items: center; gap: 1rem;"><span style="font-size: 1.8rem;">𝕏</span><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div style="display: flex; align-items: center; gap: 1rem;"><span style="font-size: 1.8rem;">📷</span><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div style="display: flex; align-items: center; gap: 1rem;"><span style="font-size: 1.8rem;">💼</span><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                                '</div>' +
                                '<div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 2px solid #e0e0e0;">' +
                                    '<h4 style="color: #c75300; font-size: 1.6rem; margin-bottom: 1rem; text-align: left;">📦 Get the Code</h4>' +
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
                            p.style.color = '#333';
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
                    
                    // Add QR code for initial slides (not bio slides)
                    // Check if this is the first slide (initial) and not a bio slide
                    if (index === 0 && !slide.isBioSlide) {
                        const qrDiv = document.createElement('div');
                        qrDiv.className = 'qr-container initial-slide';
                        qrDiv.innerHTML = \`
                            <img class="qr-code" src="" alt="Join QR" id="slideQR\${index}">
                            <div class="qr-label">Scan to Join</div>
                        \`;
                        slideDiv.appendChild(qrDiv);
                        
                        // We'll populate this QR code after the slide is added to the DOM
                        setTimeout(() => {
                            const qrImg = document.getElementById(\`slideQR\${index}\`);
                            if (qrImg) {
                                const mainQR = document.getElementById('qrCode');
                                if (mainQR && mainQR.src) {
                                    qrImg.src = mainQR.src;
                                }
                            }
                        }, 100);
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
            
            // Initialize slides as empty - will be loaded from server
            slides = document.querySelectorAll('.slide');
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
                
                // Request participant list
                setTimeout(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'requestParticipantList' }));
                    }
                }, 500);
                
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
                        // Update total slides count from database if provided
                        if (data.data.currentSlide && data.data.currentSlide.totalSlides !== undefined) {
                            totalSlidesFromDB = data.data.currentSlide.totalSlides;
                            console.log('Updated total slides from DB:', totalSlidesFromDB);
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
                
                case 'participantJoined':
                    if (data.data) {
                        // Add to participants map
                        const participantId = data.data.timestamp + '_' + Math.random();
                        connectedParticipants.set(participantId, {
                            firstName: data.data.firstName,
                            lastName: data.data.lastName,
                            lastInitial: data.data.lastInitial,
                            joinedAt: data.data.timestamp
                        });
                        
                        // Show greeting
                        showWelcomeGreeting(data.data);
                    }
                    break;
                    
                case 'participantLeft':
                    // Participant disconnected - remove from our map
                    if (data.data) {
                        // Find and remove the participant
                        const nameToRemove = data.data.firstName + '_' + (data.data.lastInitial || '');
                        for (const [key, participant] of connectedParticipants.entries()) {
                            const participantName = participant.firstName + '_' + (participant.lastInitial || '');
                            if (participantName === nameToRemove) {
                                connectedParticipants.delete(key);
                                console.log('Participant left:', data.data.firstName);
                                break;
                            }
                        }
                        
                        // Update the display if the list is open
                        updateAudienceListDisplay();
                    }
                    break;
                    
                case 'participantList':
                    if (data.data && data.data.participants) {
                        // Clear and rebuild participant map with server data
                        connectedParticipants.clear();
                        data.data.participants.forEach((p, index) => {
                            connectedParticipants.set('server_' + index, {
                                firstName: p.firstName,
                                lastName: p.lastName,
                                lastInitial: p.lastInitial,
                                joinedAt: Date.now()
                            });
                        });
                        console.log('Updated participant list from server:', data.data.count, 'participants');
                        
                        // If the audience list is open, update it WITHOUT requesting new data
                        updateAudienceListDisplay();
                    }
                    break;
                
                case 'slideChanged':
                    if (data.data) {
                        if (data.data.index !== undefined) {
                            currentSlideIndex = data.data.index;
                        }
                        // Update total slides count from database if provided
                        if (data.data.totalSlides !== undefined) {
                            totalSlidesFromDB = data.data.totalSlides;
                            console.log('Updated total slides from DB:', totalSlidesFromDB);
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
                    
                case 'aiContentGenerated':
                    // Handle AI-generated content display
                    if (data.data) {
                        handleAIContentGenerated(data.data);
                    }
                    break;
                    
                case 'aiGenerationError':
                    // Handle AI generation errors
                    if (data.data) {
                        console.error('AI Generation Error:', data.data.error);
                        // Could show error message to user
                    }
                    break;
                    
                case 'prizeWinner':
                    // Display prize winner
                    if (data.data && data.data.winner) {
                        showPrizeWinner(data.data.winner);
                    }
                    break;
                    
                case 'allWinnersSelected':
                    // All participants have won
                    showAllWinnersMessage(data.data);
                    break;
                    
                case 'noParticipants':
                    // No participants available
                    console.log('⚠️ No participants available:', data.data.message);
                    showNoParticipantsMessage();
                    break;
                    
                case 'presentationLoaded':
                    // Presentation data loaded from database
                    if (data.data && data.data.totalSlides !== undefined) {
                        totalSlidesFromDB = data.data.totalSlides;
                        console.log('Presentation loaded with', totalSlidesFromDB, 'slides');
                        // Update current slide display
                        if (data.data.currentSlide) {
                            updateSlideContentFromServer(data.data.currentSlide);
                        }
                    }
                    break;
            }
        }

        function updateParticipantCount(count) {
            document.getElementById('liveParticipantCount').textContent = count;
        }

        function previousSlide() {
            console.log('Previous slide - current:', currentSlideIndex);
            if (currentSlideIndex > 0) {
                currentSlideIndex--;
                updateSlideDisplay();
                sendSlideUpdate();
            } else {
                console.log('Already at first slide (0)');
            }
        }

        function nextSlide() {
            // Use database slide count if available, otherwise fall back to hardcoded slides
            const maxSlides = totalSlidesFromDB > 0 ? totalSlidesFromDB : slides.length;
            console.log('Next slide - current:', currentSlideIndex, 'max:', maxSlides);
            
            if (currentSlideIndex < maxSlides - 1) {
                currentSlideIndex++;
                updateSlideDisplay();
                sendSlideUpdate();
            } else {
                console.log('Already at last slide (' + (maxSlides - 1) + ')');
            }
        }

        function updateSlideDisplay() {
            // Clear any AI content from all slides first
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentSlideIndex);
                
                // If this slide has been modified (likely by AI content), restore it
                if (slide.hasAttribute('data-ai-modified')) {
                    console.log('Clearing AI content from slide', index);
                    slide.removeAttribute('data-ai-modified');
                    // Request fresh content from server for this slide
                    if (index === currentSlideIndex && ws && ws.readyState === WebSocket.OPEN) {
                        // Request the server to send current slide data
                        ws.send(JSON.stringify({
                            type: 'requestSlideData',
                            index: currentSlideIndex
                        }));
                    }
                }
            });
            
            // Hide main QR container for slides with GIFs (they have their own QR) and initial slides
            const mainQR = document.getElementById('mainQRContainer');
            if (mainQR) {
                const isInitialSlide = currentSlideIndex === 0;
                const currentSlideData = slideData[currentSlideIndex];
                const hasGif = currentSlideData && currentSlideData.gif;
                
                // Hide QR for slides with GIF (they have side-by-side QR), initial slides with their own QR, or bio slides
                const isBioSlide = currentSlideData && currentSlideData.isBioSlide;
                if (hasGif || (isInitialSlide && !currentSlideData?.isBioSlide) || isBioSlide) {
                    mainQR.style.display = 'none';
                } else {
                    mainQR.style.display = 'block';
                }
            }
        }
        
        function updateSlideContentFromServer(slideData) {
            let slideDiv = document.querySelector('.slide.active');
            
            // If no slide exists for this index, create it dynamically
            if (!slideDiv && currentSlideIndex !== undefined) {
                console.log('Creating dynamic slide for index:', currentSlideIndex);
                const slideContent = document.getElementById('slideContent');
                
                // Create new slide element
                slideDiv = document.createElement('div');
                slideDiv.className = 'slide active';
                slideDiv.setAttribute('data-index', currentSlideIndex.toString());
                slideContent.appendChild(slideDiv);
                
                // Update slides NodeList to include new slide
                slides = document.querySelectorAll('.slide');
            }
            
            if (!slideDiv) return;
            
            // Store current slide data for poll usage
            window.currentSlideData = slideData;
            
            // Update total slides count if provided
            if (slideData.totalSlides !== undefined) {
                totalSlidesFromDB = slideData.totalSlides;
                console.log('Updated total slides from server data:', totalSlidesFromDB);
            }
            
            // Check if this slide has AI-generated content
            if (slideData.hasGeneratedContent && slideData.generatedContent) {
                console.log('Displaying previously generated AI content');
                const content = slideData.generatedContent;
                
                if (content.type === 'image') {
                    slideDiv.innerHTML = \`
                        <div style="text-align: center; padding: 2rem;">
                            <h2 style="color: #667eea; margin-bottom: 1rem;">
                                <i class="fas fa-magic"></i> AI Generated: \${content.optionKey || ''}
                            </h2>
                            <div style="display: flex; justify-content: center; align-items: center; min-height: 60vh;">
                                <img src="\${content.url}" 
                                     alt="AI Generated Image" 
                                     style="max-width: 90%; max-height: 48vh; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                            </div>
                        </div>
                    \`;
                } else if (content.type === 'text') {
                    slideDiv.innerHTML = \`
                        <div style="padding: 3rem;">
                            <h2 style="color: #667eea; margin-bottom: 2rem;">
                                <i class="fas fa-robot"></i> AI Response: \${content.optionKey || ''}
                            </h2>
                            <div style="font-size: 1.6rem; line-height: 1.8; color: #333; max-width: 900px; margin: 0 auto; white-space: pre-wrap;">\${content.content || ''}</div>
                        </div>
                    \`;
                }
                return; // Don't process regular slide content
            }
            
            // Check if this is the bio slide
            if (slideData.isBioSlide) {
                // Create custom bio slide content
                slideDiv.innerHTML = 
                    '<div style="display: flex; align-items: center; justify-content: center; gap: 10rem; height: 100%;">' +
                        '<div style="text-align: center;">' +
                            '<img src="/photo.jpg" alt="Mick Davies" style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid #c75300; box-shadow: 0 8px 32px rgba(199, 83, 0, 0.3); margin-bottom: 2rem;">' +
                            '<h1 class="bio-heading">Thanks for Joining! 🙏</h1>' +
                            '<h2 style="color: #333; margin-bottom: 2rem; font-size: 2.5rem;">Mick Davies</h2>' +
                        '</div>' +
                        '<div style="text-align: left;">' +
                            '<h3 style="color: #c75300; font-size: 2.2rem; margin-bottom: 1.5rem; text-align: left;">Connect with me</h3>' +
                            '<div style="display: flex; flex-direction: column; gap: 1rem; font-size: 2rem;">' +
                                '<div style="display: flex; align-items: center; gap: 1rem;"><i class="fab fa-x-twitter" style="font-size: 1.6rem; width: 2rem; color: #333;"></i><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                '<div style="display: flex; align-items: center; gap: 1rem;"><i class="fab fa-instagram" style="font-size: 1.6rem; width: 2rem; color: #E4405F;"></i><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                '<div style="display: flex; align-items: center; gap: 1rem;"><i class="fab fa-linkedin" style="font-size: 1.6rem; width: 2rem; color: #0077B5;"></i><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                                '<div style="display: flex; align-items: center; gap: 1rem;"><i class="fas fa-envelope" style="font-size: 1.6rem; width: 2rem; color: #c75300;"></i><a href="mailto:mick@5150studios.com.au" style="color: #333; text-decoration: none;">mick@5150studios.com.au</a></div>' +
                            '</div>' +
                            '<div style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 2px solid #e0e0e0;">' +
                                '<h4 style="color: #c75300; font-size: 1.6rem; margin-bottom: 1rem; text-align: left;"><i class="fab fa-github" style="margin-right: 0.5rem;"></i>Get the Code</h4>' +
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
                    
                    // Add content paragraphs with matching audience view styling
                    if (slideData.content && Array.isArray(slideData.content)) {
                        slideData.content.forEach(text => {
                            const p = document.createElement('p');
                            p.textContent = text;
                            if (currentSlideIndex === 0) {
                                p.style.fontSize = '2rem';
                                p.style.color = '#333';
                            } else {
                                // Match audience view styling
                                p.style.fontSize = '2rem';
                                p.style.marginBottom = '1rem';
                                p.style.fontWeight = 'bold';
                                p.style.lineHeight = '1.4';
                                p.style.color = '#333';
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
                    
                    // Create media wrapper for both GIF and QR
                    const mediaWrapper = document.createElement('div');
                    mediaWrapper.className = 'slide-media-wrapper';
                    
                    // Create GIF container
                    const gifContainer = document.createElement('div');
                    gifContainer.className = 'slide-gif-container';
                    
                    const gif = document.createElement('img');
                    gif.src = slideData.gif;
                    gif.alt = 'Slide animation';
                    gif.className = 'slide-gif';
                    
                    gifContainer.appendChild(gif);
                    
                    // Create QR container
                    const qrContainer = document.createElement('div');
                    qrContainer.className = 'slide-qr-container';
                    
                    const qrImg = document.createElement('img');
                    qrImg.className = 'qr-code';
                    qrImg.alt = 'Join QR';
                    
                    // Generate QR code for the room URL
                    const audienceUrl = \`\${window.location.origin}/audience/\${roomId}\`;
                    qrImg.src = \`/qr/\${encodeURIComponent(audienceUrl)}?size=400\`;
                    
                    qrContainer.appendChild(qrImg);
                    
                    // Add both to media wrapper
                    mediaWrapper.appendChild(gifContainer);
                    mediaWrapper.appendChild(qrContainer);
                    
                    slideDiv.appendChild(contentWrapper);
                    slideDiv.appendChild(mediaWrapper);
                } else {
                    // No GIF, render normally
                    slideDiv.classList.remove('with-gif');
                    
                    // Add title
                    const title = document.createElement(currentSlideIndex === 0 ? 'h1' : 'h2');
                    title.textContent = slideData.title || 'Untitled';
                    slideDiv.appendChild(title);
                    
                    // Add content paragraphs with matching audience view styling
                    if (slideData.content && Array.isArray(slideData.content)) {
                        slideData.content.forEach(text => {
                            const p = document.createElement('p');
                            p.textContent = text;
                            if (currentSlideIndex === 0) {
                                p.style.fontSize = '2rem';
                                p.style.color = '#333';
                            } else {
                                // Match audience view styling
                                p.style.fontSize = '2rem';
                                p.style.marginBottom = '1rem';
                                p.style.fontWeight = 'bold';
                                p.style.lineHeight = '1.4';
                                p.style.color = '#333';
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
            
            // Update main QR visibility based on whether slide has GIF or is bio slide
            const mainQR = document.getElementById('mainQRContainer');
            if (mainQR) {
                const hasGif = slideData && slideData.gif;
                const isBioSlide = slideData && slideData.isBioSlide;
                // Hide QR for slides with GIF (they have side-by-side QR) or bio slides
                mainQR.style.display = (hasGif || isBioSlide) ? 'none' : 'block';
            }
        }

        function sendSlideUpdate() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log('Sending navigation to slide:', currentSlideIndex);
                ws.send(JSON.stringify({
                    type: 'navigate',
                    index: currentSlideIndex
                }));
            } else {
                console.log('WebSocket not available for navigation');
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
                    case 'w':
                    case 'W':
                        e.preventDefault();
                        pickPrizeWinner();
                        break;
                    case 'a':
                    case 'A':
                        e.preventDefault();
                        showAudienceList();
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
                    case 'd':
                    case 'D':
                        e.preventDefault();
                        // Debug: log current state
                        console.log('DEBUG STATE:');
                        console.log('- Current slide index:', currentSlideIndex);
                        console.log('- Total slides from DB:', totalSlidesFromDB);
                        console.log('- Hardcoded slides length:', slides.length);
                        console.log('- WebSocket ready:', ws && ws.readyState === WebSocket.OPEN);
                        break;
                }
            });
        }

        // Poll functions
        async function startPoll() {
            console.log('🗳️ Starting poll for current slide...');
            
            // Check if current slide has poll data
            const currentSlide = window.currentSlideData;
            
            // First check if this is a poll or ai_poll slide type
            const slideType = currentSlide?.slideType || currentSlide?.slide_type;
            const isPollSlide = slideType === 'poll' || slideType === 'ai_poll';
            
            console.log('📊 Poll check - slideType:', slideType, 'isPollSlide:', isPollSlide);
            console.log('📊 Current slide data:', currentSlide);
            
            if (!currentSlide || !isPollSlide) {
                console.log('Current slide is not a poll slide. Type:', slideType);
                return;
            }
            
            // Handle AI Poll differently
            if (slideType === 'ai_poll' || currentSlide.ai_poll_prompts) {
                console.log('🤖 AI Poll detected! slideType:', slideType, 'has ai_poll_prompts:', !!currentSlide.ai_poll_prompts);
                
                if (!currentSlide.ai_poll_prompts) {
                    console.error('AI Poll slide but no ai_poll_prompts data!');
                    return;
                }
                
                console.log('🤖 Starting AI Poll with prompts:', currentSlide.ai_poll_prompts);
                
                // Parse AI poll prompts to create poll options
                let aiPrompts;
                try {
                    aiPrompts = typeof currentSlide.ai_poll_prompts === 'string' 
                        ? JSON.parse(currentSlide.ai_poll_prompts)
                        : currentSlide.ai_poll_prompts;
                } catch (e) {
                    console.error('Failed to parse AI poll prompts:', e);
                    return;
                }
                
                // Convert AI prompts to poll options format
                const pollOptions = Object.entries(aiPrompts).map(([id, prompt]) => ({
                    id: id,
                    label: prompt.key,
                    emoji: prompt.type === 'image' ? '🎨' : '📝'
                }));
                
                const pollData = {
                    pollId: 'ai-poll-' + Date.now(),
                    question: 'Choose an AI option:',
                    options: pollOptions,
                    pollRoutes: {},
                    duration: 20,
                    isAIPoll: true
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
                return;
            }
            
            // Handle regular poll
            if (currentSlide && currentSlide.pollQuestion && currentSlide.pollOptions) {
                console.log('Using poll from current slide');
                
                const pollData = {
                    pollId: 'poll-' + Date.now(),
                    question: currentSlide.pollQuestion,
                    options: currentSlide.pollOptions,
                    pollRoutes: currentSlide.pollRoutes || {},
                    duration: 20
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
                return;
            }
            
            // Fallback to fetching poll options (for non-database slides)
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

        function hidePollOverlay() {
            console.log('Hiding poll overlay...');
            
            // Hide the poll slide
            const pollSlide = document.querySelector('.poll-slide');
            if (pollSlide) {
                pollSlide.classList.remove('active');
                // Clear inline display style to let CSS control visibility
                pollSlide.style.display = '';
                console.log('Poll slide hidden');
            }
            
            // Also hide any overlay if it exists
            const overlay = document.getElementById('pollOverlay');
            if (overlay) {
                overlay.style.display = 'none';
                overlay.innerHTML = ''; // Clear content
                console.log('Poll overlay hidden');
            }
            
            // Show regular slides again
            const slideContent = document.getElementById('slideContent');
            if (slideContent) {
                slideContent.style.display = 'block';
            }
            
            // Make sure the active slide is visible
            const activeSlide = document.querySelector('.slide.active');
            if (activeSlide) {
                activeSlide.style.display = 'block';
            }
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
            } else {
                // Clear any inline display style that might override the CSS
                pollSlide.style.display = '';
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
            console.log('Poll ended:', data);
            
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
                
                // Check if this is an AI Poll
                if (data.isAIPoll && data.aiGenerationPending) {
                    // Show generation pending message
                    setTimeout(() => {
                        const pollOverlay = document.getElementById('pollOverlay');
                        if (pollOverlay) {
                            pollOverlay.innerHTML += \`
                                <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.9); border-radius: 12px;">
                                    <h3 style="color: #667eea; margin-bottom: 1rem;">
                                        <i class="fas fa-magic"></i> Generating AI Content...
                                    </h3>
                                    <p style="color: #666; font-size: 1.2rem;">
                                        Creating \${data.winningOption.type === 'image' ? 'image' : 'text'} for: 
                                        <strong>"\${data.winningOption.key}"</strong>
                                    </p>
                                    <div class="loading-spinner" style="margin-top: 1rem;">
                                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                                    </div>
                                </div>
                            \`;
                        }
                    }, 2000);
                    // Don't hide overlay yet - wait for AI content
                    return;
                }
                
                // For regular polls, hide overlay after showing results
                setTimeout(() => {
                    hidePollOverlay();
                }, 3000);
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
                    // Clear inline display style to let CSS control visibility
                    pollSlide.style.display = '';
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
            
            // Add a fallback to hide overlay after 10 seconds if no pollEnd message arrives
            setTimeout(() => {
                const overlay = document.getElementById('pollOverlay');
                if (overlay && overlay.style.display !== 'none') {
                    console.log('Fallback: hiding poll overlay after timeout');
                    hidePollOverlay();
                }
            }, 10000);
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
        
        // Participant tracking for audience list
        const connectedParticipants = new Map();
        
        // Greeting system for participants
        const greetingQueue = [];
        let isShowingGreeting = false;
        
        const greetingMessages = [
            'Hey {name}!',
            'Welcome {name}!',
            'What\\'s up {name}',
            'Hello {name}!',
            'Good to see you {name}',
            'Glad you\\'re here {name}',
            'Thanks for joining {name}',
            'Greetings {name}!',
            'Hi there {name}',
            'Welcome back {name}!',
            '{name} has joined!',
            'Great to have you {name}'
        ];
        
        function getRandomGreeting(firstName, lastInitial) {
            const greeting = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
            const name = lastInitial ? firstName + ' ' + lastInitial + '.' : firstName;
            return greeting.replace('{name}', name);
        }
        
        function showWelcomeGreeting(participant) {
            // Add to queue
            greetingQueue.push(participant);
            
            // If not currently showing a greeting, start processing the queue
            if (!isShowingGreeting) {
                processGreetingQueue();
            }
        }
        
        function processGreetingQueue() {
            if (greetingQueue.length === 0) {
                isShowingGreeting = false;
                return;
            }
            
            isShowingGreeting = true;
            const participant = greetingQueue.shift();
            
            // Create greeting element
            const greetingDiv = document.createElement('div');
            greetingDiv.style.cssText = 
                'position: fixed;' +
                'bottom: 70px;' +
                'left: 120px;' +
                'background: rgba(0, 0, 0, 0.8);' +
                'color: white;' +
                'padding: 12px 20px;' +
                'border-radius: 25px;' +
                'font-size: 18px;' +
                'font-weight: 500;' +
                'z-index: 1000;' +
                'backdrop-filter: blur(10px);' +
                'animation: slideInLeft 0.5s ease-out;' +
                'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);';
            
            greetingDiv.textContent = getRandomGreeting(participant.firstName, participant.lastInitial);
            
            // Add animation styles if not already added
            if (!document.getElementById('greetingAnimations')) {
                const style = document.createElement('style');
                style.id = 'greetingAnimations';
                style.textContent = 
                    '@keyframes slideInLeft {' +
                    '  from {' +
                    '    opacity: 0;' +
                    '    transform: translateX(-50px);' +
                    '  }' +
                    '  to {' +
                    '    opacity: 1;' +
                    '    transform: translateX(0);' +
                    '  }' +
                    '}' +
                    '@keyframes fadeOut {' +
                    '  from {' +
                    '    opacity: 1;' +
                    '  }' +
                    '  to {' +
                    '    opacity: 0;' +
                    '    transform: translateY(10px);' +
                    '  }' +
                    '}';
                document.head.appendChild(style);
            }
            
            document.body.appendChild(greetingDiv);
            
            // Remove after 2.5 seconds with fade out
            setTimeout(() => {
                greetingDiv.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => {
                    greetingDiv.remove();
                    // Process next in queue after a small delay
                    setTimeout(() => processGreetingQueue(), 200);
                }, 500);
            }, 2500);
        }
        
        function renderAudienceList(overlay) {
            // Build participant list HTML - deduplicate by name
            const participantsMap = new Map();
            Array.from(connectedParticipants.values()).forEach(participant => {
                const key = participant.firstName + '_' + (participant.lastInitial || '');
                // Keep the first occurrence of each unique name
                if (!participantsMap.has(key)) {
                    participantsMap.set(key, participant);
                }
            });
            
            const participants = Array.from(participantsMap.values()).sort((a, b) => {
                // Sort by first name
                return a.firstName.localeCompare(b.firstName);
            });
            
            let listHTML = '<div style="padding: 3rem; height: 100%; display: flex; flex-direction: column;">';
            listHTML += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">';
            listHTML += '<h1 style="font-size: 3rem; color: white; margin: 0;">👥 Audience Members (' + participants.length + ')</h1>';
            listHTML += '<div style="font-size: 1.2rem; color: #ccc;">Press ESC to close</div>';
            listHTML += '</div>';
            
            // Create scrollable two-column list
            listHTML += '<div style="flex: 1; overflow-y: auto; background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 2rem;">';
            
            if (participants.length === 0) {
                listHTML += '<div style="text-align: center; color: #999; font-size: 1.5rem; padding: 3rem;">No participants have joined yet</div>';
            } else {
                listHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; max-width: 1200px; margin: 0 auto;">';
                
                participants.forEach((participant, index) => {
                    const fullName = participant.lastInitial ? 
                        participant.firstName + ' ' + participant.lastInitial + '.' : 
                        participant.firstName;
                    
                    listHTML += '<div style="background: rgba(255, 255, 255, 0.1); padding: 1rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 1rem;">';
                    listHTML += '<div style="font-size: 1.5rem; opacity: 0.5;">' + (index + 1) + '.</div>';
                    listHTML += '<div style="font-size: 1.3rem; color: white; flex: 1;">' + fullName + '</div>';
                    listHTML += '</div>';
                });
                
                listHTML += '</div>';
            }
            
            listHTML += '</div>';
            listHTML += '</div>';
            
            overlay.innerHTML = listHTML;
            overlay.style.display = 'block';
        }
        
        function updateAudienceListDisplay() {
            // Update the display WITHOUT requesting new data
            const overlay = document.getElementById('audienceListOverlay');
            if (!overlay || overlay.style.display === 'none') return;
            
            renderAudienceList(overlay);
        }
        
        function showAudienceList() {
            console.log('👥 Showing audience list...');
            
            // Get or create overlay
            let overlay = document.getElementById('audienceListOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'audienceListOverlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: none; z-index: 9999; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px);';
                document.body.appendChild(overlay);
            }
            
            // Render the list
            renderAudienceList(overlay);
            
            // Handle ESC key
            const closeList = (e) => {
                if (e && e.key && e.key !== 'Escape' && e.key !== 'Esc') {
                    return;
                }
                overlay.style.display = 'none';
                overlay.innerHTML = '';
                document.removeEventListener('keydown', closeList, true);
            };
            
            // Use capture phase
            document.addEventListener('keydown', closeList, true);
            
            // Request fresh participant list from server ONCE
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'requestParticipantList'
                }));
            }
        }
        
        function pickPrizeWinner() {
            console.log('🎁 Picking a prize winner from participants...');
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'pickPrizeWinner'
                }));
            }
        }
        
        // Confetti removed - using emojis for celebration instead
        
        function showNoParticipantsMessage() {
            console.log('⚠️ No participants available for prize selection');
            
            // Get or create overlay
            let overlay = document.getElementById('pollOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'pollOverlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: none; z-index: 9999;';
                overlay.className = 'poll-overlay';
                document.body.appendChild(overlay);
            }
            overlay.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
                '<div style="font-size: 5rem; margin-bottom: 2rem;">📱</div>' +
                '<h1 style="font-size: 3rem; color: white; margin-bottom: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">No Participants Yet</h1>' +
                '<div style="font-size: 1.8rem; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">Make sure audience members have joined from their phones</div>' +
                '<div style="margin-top: 2rem; font-size: 1.4rem; color: #ffd700;">Ask them to visit the audience URL and enter their names</div>' +
                '<div style="margin-top: 3rem; font-size: 1.2rem; color: #ccc;">Press ESC to close</div>' +
                '</div>';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'linear-gradient(135deg, rgba(249,115,22,0.95) 0%, rgba(239,68,68,0.95) 100%)';
            
            // Handle ESC key
            const hideMessage = (e) => {
                if (e && e.key && e.key !== 'Escape' && e.key !== 'Esc') {
                    return;
                }
                overlay.style.display = 'none';
                overlay.innerHTML = '';
                document.removeEventListener('keydown', hideMessage, true);
            };
            
            document.addEventListener('keydown', hideMessage, true);
            
            // Auto-hide after 5 seconds
            setTimeout(() => hideMessage(), 5000);
        }
        
        function showAllWinnersMessage(data) {
            console.log('🎊 All participants have won prizes!');
            
            // Get or create overlay
            let overlay = document.getElementById('pollOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'pollOverlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: none; z-index: 9999;';
                overlay.className = 'poll-overlay';
                document.body.appendChild(overlay);
            }
            overlay.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
                '<div style="font-size: 5rem; margin-bottom: 2rem;">🎊🎉🎊</div>' +
                '<h1 style="font-size: 3rem; color: white; margin-bottom: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">All Participants Have Won!</h1>' +
                '<div style="font-size: 2rem; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">Everyone is a winner today! 🏆</div>' +
                '<div style="margin-top: 3rem; font-size: 1.2rem; color: white;">Press ESC to continue...</div>' +
                '</div>';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'linear-gradient(135deg, rgba(102,126,234,0.95) 0%, rgba(118,75,162,0.95) 100%)';
            
            // Removed confetti - emoji celebration is enough
            
            // Handle ESC key
            const hideMessage = (e) => {
                if (e && e.key && e.key !== 'Escape' && e.key !== 'Esc') {
                    return; // Only close on ESC
                }
                overlay.style.display = 'none';
                overlay.innerHTML = ''; // Clear content
                document.removeEventListener('keydown', hideMessage, true);
            };
            
            // Use capture phase
            document.addEventListener('keydown', hideMessage, true);
            
            // Auto-hide after 10 seconds
            setTimeout(() => hideMessage(), 10000);
        }
        
        function showPrizeWinner(winner) {
            console.log('🎉 Prize winner:', winner.fullName);
            
            // Get or create overlay
            let overlay = document.getElementById('pollOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'pollOverlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: none; z-index: 9999;';
                overlay.className = 'poll-overlay';
                document.body.appendChild(overlay);
            }
            overlay.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
                '<div style="font-size: 5rem; margin-bottom: 1rem; animation: bounce 1s infinite;">🏆</div>' +
                '<h1 style="font-size: 4rem; color: #FFD700; margin-bottom: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">WINNER!</h1>' +
                '<div style="font-size: 3.5rem; color: white; margin-bottom: 3rem; font-weight: bold;">' + winner.fullName + '</div>' +
                '<div style="font-size: 2rem; color: #FFD700;">Congratulations! 🎉</div>' +
                '<div style="margin-top: 3rem; font-size: 1.2rem; color: #ccc;">Press ESC to close • Press W to pick another winner</div>' +
                '</div>';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'linear-gradient(135deg, rgba(102,126,234,0.95) 0%, rgba(118,75,162,0.95) 100%)';
            
            // Add bounce animation for trophy
            if (!document.getElementById('bounceStyle')) {
                const style = document.createElement('style');
                style.id = 'bounceStyle';
                style.textContent = '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }';
                document.head.appendChild(style);
            }
            
            // Removed confetti - emojis and trophy animation are enough
            
            // Handle key press - use stopPropagation to prevent conflicts
            const handleKeyPress = (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                if (e.key === 'Escape' || e.key === 'Esc') {
                    // Close overlay and return to slides
                    overlay.style.display = 'none';
                    overlay.innerHTML = ''; // Clear content
                    document.removeEventListener('keydown', handleKeyPress, true);
                } else if (e.key.toLowerCase() === 'w') {
                    // Pick another winner
                    overlay.style.display = 'none';
                    overlay.innerHTML = ''; // Clear content
                    document.removeEventListener('keydown', handleKeyPress, true);
                    setTimeout(() => pickPrizeWinner(), 100); // Small delay to ensure clean state
                }
            };
            
            // Use capture phase to intercept before other handlers
            document.addEventListener('keydown', handleKeyPress, true);
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
            // Navigate to the last slide - use database count if available
            const maxSlides = totalSlidesFromDB > 0 ? totalSlidesFromDB : slides.length;
            const finalSlideIndex = maxSlides - 1;
            console.log('Navigating to final slide:', finalSlideIndex, 'of', maxSlides);
            currentSlideIndex = finalSlideIndex;
            updateSlideDisplay();
            sendSlideUpdate();
        }
        
        // AI Content Handling Functions
        function handleAIContentGenerated(data) {
            console.log('AI Content Generated:', data);
            
            // Hide poll overlay forcefully
            hidePollOverlay();
            
            // Also remove poll slide completely
            const pollSlide = document.querySelector('.poll-slide');
            if (pollSlide) {
                pollSlide.remove();
                console.log('Poll slide removed');
            }
            
            // Also try to hide any poll-related elements directly
            const pollElements = document.querySelectorAll('.poll-overlay, #pollOverlay');
            pollElements.forEach(el => {
                el.style.display = 'none';
                el.remove();
            });
            
            // Ensure slide content is visible
            const slideContent = document.getElementById('slideContent');
            if (slideContent) {
                slideContent.style.display = 'block';
            }
            
            // Get the current slide
            const slideDiv = document.querySelector('.slide.active');
            if (!slideDiv) {
                console.error('No active slide found for AI content display');
                return;
            }
            
            // Mark this slide as modified by AI content
            slideDiv.setAttribute('data-ai-modified', 'true');
            
            const content = data.content;
            
            if (content.type === 'image') {
                // Display generated image
                slideDiv.innerHTML = \`
                    <div style="text-align: center; padding: 2rem;">
                        <h2 style="color: #667eea; margin-bottom: 1rem;">
                            <i class="fas fa-magic"></i> AI Generated: \${data.optionKey}
                        </h2>
                        <div style="display: flex; justify-content: center; align-items: center; min-height: 60vh;">
                            <img src="\${content.url}" 
                                 alt="AI Generated Image" 
                                 style="max-width: 90%; max-height: 48vh; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);"
                                 onload="this.style.opacity = '0'; setTimeout(() => { this.style.transition = 'opacity 0.5s'; this.style.opacity = '1'; }, 50);">
                        </div>
                    </div>
                \`;
            } else if (content.type === 'text') {
                // Stream text content for presenter
                slideDiv.innerHTML = \`
                    <div style="padding: 3rem;">
                        <h2 style="color: #667eea; margin-bottom: 2rem;">
                            <i class="fas fa-robot"></i> AI Response: \${data.optionKey}
                        </h2>
                        <div id="aiTextContent" style="font-size: 1.6rem; line-height: 1.8; color: #333; max-width: 900px; margin: 0 auto; white-space: pre-wrap;"></div>
                    </div>
                \`;
                
                // Connect to SSE endpoint for real-time streaming
                if (content.content) {
                    // If we already have the full text (shouldn't happen for presenter)
                    document.getElementById('aiTextContent').textContent = content.content;
                } else {
                    // Connect to streaming endpoint
                    connectToAITextStream(data.optionKey);
                }
            }
        }
        
        function connectToAITextStream(optionKey) {
            // For presenter, use Server-Sent Events for real streaming
            const params = new URLSearchParams({
                prompt: optionKey,
                session: roomId || '123456'
            });
            
            const eventSource = new EventSource(\`/api/stream-ai-response?\${params}\`);
            const element = document.getElementById('aiTextContent');
            
            if (!element) {
                console.error('AI text content element not found');
                return;
            }
            
            eventSource.onmessage = (event) => {
                if (event.data === '[DONE]') {
                    eventSource.close();
                    return;
                }
                
                try {
                    const data = JSON.parse(event.data);
                    if (data.text) {
                        element.textContent += data.text;
                        element.scrollTop = element.scrollHeight;
                    }
                } catch (error) {
                    console.error('Error parsing SSE data:', error);
                }
            };
            
            eventSource.onerror = (error) => {
                console.error('SSE error:', error);
                eventSource.close();
                // Show error message
                if (element) {
                    element.innerHTML += '<br><span style="color: red;">Stream connection lost</span>';
                }
            };
        }
    </script>
</body>
</html>`;