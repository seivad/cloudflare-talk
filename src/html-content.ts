// HTML content for the application
// These are served directly when R2 is not available (local development)

import { COMPLETE_SLIDES_HTML } from './slides-html';

export const SLIDES_HTML = COMPLETE_SLIDES_HTML;

// Old fallback HTML (not used anymore)
const OLD_SLIDES_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare Tech Talk - Presenter View</title>
    <link rel="stylesheet" href="/public/slides.css">
    <style>
        .live-indicator {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            font-size: 14px;
        }
        .live-dot {
            width: 10px;
            height: 10px;
            background: #00d084;
            border-radius: 50%;
            animation: livePulse 2s infinite;
        }
        @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
        }
        .participant-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.1);
            padding: 6px 12px;
            border-radius: 20px;
        }
    </style>
</head>
<body class="presenter">
    <div class="live-indicator">
        <div class="live-dot"></div>
        <span>LIVE</span>
        <span style="margin-left: 10px;">👥</span>
        <span id="liveParticipantCount">0</span>
        <span>watching</span>
    </div>
    <div id="slideContainer" class="slide-container">
        <div class="slide-wrapper">
            <img src="/powerpoint-bg.png" class="ppt-background" alt="">
            <div class="slide-content-area">
                <div class="qr-container">
                    <img id="qrCode" src="/qr/http://localhost:8787/audience" alt="Join QR" class="qr-code">
                    <div class="qr-label">Join Live</div>
                </div>
                <div id="slideContent" class="slide-content"></div>
            </div>
        </div>
        <div id="adminControls" class="admin-controls">
            <div class="control-group">
                <button id="prevSlide" class="control-btn">← Previous</button>
                <span id="slideNumber" class="slide-number">1 / 20</span>
                <button id="nextSlide" class="control-btn">Next →</button>
            </div>
            <div class="participant-indicator">
                <span class="participant-icon">👥</span>
                <span id="participantCount">0</span>
                <span>connected</span>
            </div>
            <div class="control-group">
                <button id="startPoll" class="control-btn poll-btn">Start Poll (P)</button>
                <button id="pickRandom" class="control-btn">Lucky Pick (L)</button>
                <button id="simulatePoll" class="control-btn">Simulate (S)</button>
            </div>
        </div>
        <div id="pollOverlay" class="poll-overlay hidden"></div>
        <div id="containerOverlay" class="container-overlay hidden"></div>
    </div>
    <div class="keyboard-hints">
        <span>Space/→: Next</span>
        <span>←: Previous</span>
        <span>P: Poll</span>
        <span>L: Lucky</span>
        <span>S: Simulate</span>
    </div>
</body>
</html>`;


export const AUDIENCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>Cloudflare Tech Talk - Live</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        /* Base styles for audience view */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* Remove bullet points from lists */
        ul {
            list-style: none;
            padding-left: 0;
        }
        
        /* Style for slide text content */
        .slide-text-content {
            font-size: 1.4rem;
            margin-bottom: 1rem;
            font-weight: bold;
            line-height: 1.4;
        }
        
        /* Style for bio heading */
        .bio-heading {
            color: #c75300;
            margin: 0;
            font-size: 2rem;
            text-align: center;
            line-height: 1.2;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            height: 100vh;
            overflow: hidden;
        }
        .app-container { height: 100vh; display: flex; flex-direction: column; }
        .main-view { 
            flex: 1; 
            padding: 1rem; 
            padding-bottom: calc(1rem + 60px); /* Add extra padding for footer */
            overflow-y: auto; 
        }
        .slide-mirror { 
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 2rem;
            color: #333;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .slide-header { 
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 1.5rem;
        }
        .slide-header h1 { font-size: 1.8rem; color: #c75300; }
        .slide-body { 
            font-size: 1.1rem; 
            line-height: 1.8; 
            color: #444; 
            padding: 0;
        }
        .app-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            font-size: 0.875rem;
            backdrop-filter: blur(10px);
        }
        .participant-badge {
            background: rgba(0, 208, 132, 0.2);
            border: 1px solid #00d084;
            padding: 4px 12px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .participant-number {
            font-weight: bold;
            color: #00d084;
        }
        .hidden { display: none !important; }
        
        /* Poll view styles */
        .poll-view {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 60px;
            background: rgba(255, 255, 255, 0.98);
            padding: 1.5rem;
            display: none;
            flex-direction: column;
            z-index: 100;
        }
        
        .poll-view.active {
            display: flex;
        }
        
        .poll-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .poll-question {
            font-size: 1.8rem;
            color: #333;
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
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            overflow-y: auto;
        }
        
        .poll-option {
            position: relative;
            padding: 1.5rem;
            background: #f5f5f5;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .poll-option:active {
            transform: scale(0.98);
        }
        
        .poll-option.voted {
            background: #e8f5e9;
            border: 2px solid #4caf50;
        }
        
        .poll-option-label {
            font-size: 1.2rem;
            color: #333;
            font-weight: 500;
        }
        
        .poll-option-votes {
            font-size: 1.2rem;
            font-weight: bold;
            color: #666;
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
        
        .vote-status {
            text-align: center;
            padding: 1rem;
            font-size: 1rem;
            color: #666;
        }
        
        .vote-status.voted {
            color: #4caf50;
            font-weight: 600;
        }
    </style>
</head>
<body class="audience">
    <div id="app" class="app-container">
        <div id="mainView" class="main-view">
            <div id="slideMirror" class="slide-mirror">
                <div class="slide-header">
                    <h1 id="currentTitle">Welcome to the Live Experience!</h1>
                </div>
                <div id="slideBody" class="slide-body">
                    <p>Waiting for the presentation to begin...</p>
                </div>
            </div>
        </div>
        
        <!-- Poll View -->
        <div id="pollView" class="poll-view">
            <div class="poll-header">
                <h2 class="poll-question" id="pollQuestion">Loading poll...</h2>
                <div class="poll-timer" id="pollTimer">20</div>
            </div>
            <div class="poll-options" id="pollOptions">
                <!-- Poll options will be inserted here -->
            </div>
            <div class="vote-status" id="voteStatus">Tap an option to vote!</div>
        </div>
        
        <div id="winnerOverlay" class="winner-overlay hidden"></div>
        <div id="finaleOverlay" class="finale-overlay hidden"></div>
        <div id="containerView" class="container-view hidden"></div>
        <div class="app-footer">
            <div class="participant-badge">
                <span>👥</span>
                <span class="participant-number" id="participantCount">0</span>
                <span>live</span>
            </div>
            <span class="divider">•</span>
            <span id="currentNode">Welcome</span>
        </div>
    </div>
    <script>
        // Extract room ID from URL or placeholder
        const roomId = '{{ROOM_ID}}';
        console.log('Audience view loaded for room:', roomId);
        
        // Validate room ID and redirect if needed
        if (roomId === '{{ROOM_ID}}' || !roomId) {
            // No room ID provided, redirect to session entry page
            window.location.href = '/audience';
        }
        let currentPollId = null;
        let currentPollData = null;
        let hasVoted = false;
        let pollTimer = null;
        
        // WebSocket connection for real-time updates
        let wsReconnectTimeout = null;
        let ws = null;
        let reconnectAttempts = 0;
        let heartbeatInterval = null;
        let missedPongs = 0;
        
        // Visual connection status - only show when disconnected or connecting
        function updateConnectionStatus(status) {
            const footer = document.querySelector('.app-footer');
            if (footer) {
                const existingStatus = footer.querySelector('.connection-status');
                if (existingStatus) {
                    existingStatus.remove();
                }
                
                // Only show status when NOT connected (connecting or disconnected)
                if (status !== 'connected') {
                    const statusEl = document.createElement('div');
                    statusEl.className = 'connection-status';
                    statusEl.style.cssText = 'position: absolute; top: -25px; right: 10px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;';
                    
                    if (status === 'connecting') {
                        statusEl.textContent = '🟡 Connecting...';
                        statusEl.style.background = '#ff9800';
                        statusEl.style.color = 'white';
                    } else {
                        statusEl.textContent = '🔴 Disconnected';
                        statusEl.style.background = '#f44336';
                        statusEl.style.color = 'white';
                    }
                    
                    footer.appendChild(statusEl);
                }
            }
        }
        
        function connectWebSocket() {
            // Prevent multiple connections
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                return ws;
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
            
            updateConnectionStatus('connecting');
            
            const wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws/slides/' + roomId;
            console.log('Connecting to WebSocket:', wsUrl);
            
            try {
                ws = new WebSocket(wsUrl);
            } catch (error) {
                console.error('WebSocket creation failed:', error);
                scheduleReconnect();
                return null;
            }
            
            ws.onopen = () => {
                console.log('✅ Audience connected to room:', roomId);
                reconnectAttempts = 0;
                missedPongs = 0;
                updateConnectionStatus('connected');
                
                // Send initial join message
                ws.send(JSON.stringify({ type: 'join', roomId: roomId }));
                
                // Setup heartbeat with pong monitoring
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
                }, 10000); // Every 10 seconds instead of 30
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                // Reset missed pongs on any message
                if (data.type === 'pong') {
                    missedPongs = 0;
                    return;
                }
                
                // Handle different message types
                if (data.type === 'participantUpdate') {
                    document.getElementById('participantCount').textContent = data.data.count;
                } else if (data.type === 'state') {
                    // Initial state with participant count and current slide
                    if (data.data.participantCount !== undefined) {
                        document.getElementById('participantCount').textContent = data.data.participantCount;
                    }
                    
                    // Display current slide if available
                    if (data.data.currentSlide) {
                        // Update title
                        if (data.data.currentSlide.title) {
                            document.getElementById('currentTitle').textContent = data.data.currentSlide.title;
                            document.getElementById('currentNode').textContent = data.data.currentSlide.title;
                        }
                        
                        // Update slide body with content and bullets
                        const slideBody = document.getElementById('slideBody');
                        if (slideBody) {
                            let bodyHTML = '';
                            
                            // Check if this is the bio slide
                            if (data.data.currentSlide.isBioSlide) {
                                // Hide the automatic title for bio slide
                                document.getElementById('currentTitle').style.display = 'none';
                                
                                bodyHTML = '<div style="display: flex; flex-direction: column; align-items: center; gap: 2rem; text-align: center;">' +
                                    '<h1 class="bio-heading">Thanks for Joining! 🙏</h1>' +
                                    '<img src="/photo.jpg" alt="Mick Davies" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #c75300; box-shadow: 0 4px 20px rgba(199, 83, 0, 0.3);">' +
                                    '<h2 style="color: #333; margin: 0; font-size: 1.8rem;">Mick Davies</h2>' +
                                    '<div style="margin-top: 1.5rem;">' +
                                    '<h3 style="color: #c75300; font-size: 1.4rem; margin-bottom: 1rem;">Connect with me</h3>' +
                                    '<div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 1rem; text-align: left;">' +
                                    '<div><i class="fab fa-x-twitter" style="width: 1.5rem; color: #333;"></i><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-instagram" style="width: 1.5rem; color: #E4405F;"></i><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-linkedin" style="width: 1.5rem; color: #0077B5;"></i><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                                    '<div><i class="fas fa-envelope" style="width: 1.5rem; color: #c75300;"></i><a href="mailto:mick@5150studios.com.au" style="color: #333; text-decoration: none;">mick@5150studios.com.au</a></div>' +
                                    '</div></div>' +
                                    '<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ddd;">' +
                                    '<h4 style="color: #c75300; font-size: 1.2rem; margin-bottom: 0.5rem;"><i class="fab fa-github" style="margin-right: 0.5rem;"></i>Get the Code</h4>' +
                                    '<p style="font-size: 0.9rem; color: #555; margin: 0;"><a href="https://github.com/seivad/cloudflare-talk" target="_blank" style="color: #c75300; text-decoration: none; font-weight: 600;">github.com/seivad/cloudflare-talk</a></p>' +
                                    '</div></div>';
                            } else {
                                // Show the title for regular slides
                                document.getElementById('currentTitle').style.display = 'block';
                                
                                // Regular slide content
                                // Add content paragraphs
                                if (data.data.currentSlide.content && data.data.currentSlide.content.length > 0) {
                                    data.data.currentSlide.content.forEach(text => {
                                        bodyHTML += '<p class="slide-text-content">' + text + '</p>';
                                    });
                                }
                                
                                // Add bullet points
                                if (data.data.currentSlide.bullets && data.data.currentSlide.bullets.length > 0) {
                                    bodyHTML += '<ul style="margin-top: 1.5rem; font-size: 1.1rem; line-height: 1.8;">';
                                    data.data.currentSlide.bullets.forEach(bullet => {
                                        bodyHTML += '<li style="margin-bottom: 0.5rem;">' + bullet + '</li>';
                                    });
                                    bodyHTML += '</ul>';
                                }
                                
                                // If no content, show waiting message
                                if (!bodyHTML) {
                                    bodyHTML = '<p>Following along with the presentation...</p>';
                                }
                            }
                            
                            slideBody.innerHTML = bodyHTML;
                        }
                    }
                } else if (data.type === 'pollStart') {
                    // Poll started - show poll UI
                    console.log('Audience received pollStart:', data.data);
                    showPoll(data.data);
                } else if (data.type === 'pollUpdate') {
                    // Poll votes updated - audience doesn't need to see live results
                    // Only the presenter view should display vote counts
                } else if (data.type === 'pollEnd') {
                    // Poll ended
                    endPoll(data.data);
                } else if (data.type === 'slideChanged') {
                    // Update current slide info
                    if (data.data) {
                        // Update title
                        if (data.data.title) {
                            document.getElementById('currentTitle').textContent = data.data.title;
                            document.getElementById('currentNode').textContent = data.data.title;
                        }
                        
                        // Update slide body with content and bullets
                        const slideBody = document.getElementById('slideBody');
                        if (slideBody) {
                            let bodyHTML = '';
                            
                            // Check if this is the bio slide
                            if (data.data.isBioSlide) {
                                // Hide the automatic title for bio slide
                                document.getElementById('currentTitle').style.display = 'none';
                                
                                bodyHTML = '<div style="display: flex; flex-direction: column; align-items: center; gap: 2rem; text-align: center;">' +
                                    '<h1 class="bio-heading">Thanks for Joining! 🙏</h1>' +
                                    '<img src="/photo.jpg" alt="Mick Davies" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #c75300; box-shadow: 0 4px 20px rgba(199, 83, 0, 0.3);">' +
                                    '<h2 style="color: #333; margin: 0; font-size: 1.8rem;">Mick Davies</h2>' +
                                    '<div style="margin-top: 1.5rem;">' +
                                    '<h3 style="color: #c75300; font-size: 1.4rem; margin-bottom: 1rem;">Connect with me</h3>' +
                                    '<div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 1rem; text-align: left;">' +
                                    '<div><i class="fab fa-x-twitter" style="width: 1.5rem; color: #333;"></i><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-instagram" style="width: 1.5rem; color: #E4405F;"></i><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-linkedin" style="width: 1.5rem; color: #0077B5;"></i><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                                    '<div><i class="fas fa-envelope" style="width: 1.5rem; color: #c75300;"></i><a href="mailto:mick@5150studios.com.au" style="color: #333; text-decoration: none;">mick@5150studios.com.au</a></div>' +
                                    '</div></div>' +
                                    '<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ddd;">' +
                                    '<h4 style="color: #c75300; font-size: 1.2rem; margin-bottom: 0.5rem;"><i class="fab fa-github" style="margin-right: 0.5rem;"></i>Get the Code</h4>' +
                                    '<p style="font-size: 0.9rem; color: #555; margin: 0;"><a href="https://github.com/seivad/cloudflare-talk" target="_blank" style="color: #c75300; text-decoration: none; font-weight: 600;">github.com/seivad/cloudflare-talk</a></p>' +
                                    '</div></div>';
                            } else {
                                // Show the title for regular slides
                                document.getElementById('currentTitle').style.display = 'block';
                                
                                // Regular slide content
                                // Add content paragraphs
                                if (data.data.content && data.data.content.length > 0) {
                                    data.data.content.forEach(text => {
                                        bodyHTML += '<p class="slide-text-content">' + text + '</p>';
                                    });
                                }
                                
                                // Add bullet points
                                if (data.data.bullets && data.data.bullets.length > 0) {
                                    bodyHTML += '<ul style="margin-top: 1.5rem; font-size: 1.1rem; line-height: 1.8;">';
                                    data.data.bullets.forEach(bullet => {
                                        bodyHTML += '<li style="margin-bottom: 0.5rem;">' + bullet + '</li>';
                                    });
                                    bodyHTML += '</ul>';
                                }
                                
                                // If no content, show waiting message
                                if (!bodyHTML) {
                                    bodyHTML = '<p>Following along with the presentation...</p>';
                                }
                            }
                            
                            slideBody.innerHTML = bodyHTML;
                        }
                    }
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                updateConnectionStatus('disconnected');
            };
            
            ws.onclose = (event) => {
                console.log('WebSocket closed (code:', event.code, ', reason:', event.reason, ')');
                ws = null;
                updateConnectionStatus('disconnected');
                
                // Clear heartbeat
                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }
                
                // Schedule reconnection
                scheduleReconnect();
            };
            
            return ws;
        }
        
        function scheduleReconnect() {
            if (wsReconnectTimeout) {
                return; // Already scheduled
            }
            
            reconnectAttempts++;
            const baseDelay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
            const jitter = Math.random() * 1000;
            const reconnectDelay = baseDelay + jitter;
            
            console.log('Reconnecting in ' + Math.round(reconnectDelay) + 'ms (attempt ' + reconnectAttempts + ')');
            
            wsReconnectTimeout = setTimeout(() => {
                wsReconnectTimeout = null;
                connectWebSocket();
            }, reconnectDelay);
        }
        
        // Connect on load
        let websocket = connectWebSocket();
        
        // Add participant to the session
        async function registerParticipant() {
            const userId = getUserId();
            try {
                const response = await fetch(\`/api/session/\${roomId}/add-participant\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, isPresenter: false })
                });
                
                if (!response.ok) {
                    console.error('Failed to register participant');
                }
            } catch (error) {
                console.error('Error registering participant:', error);
            }
        }
        
        // Register participant on load
        registerParticipant();
        
        // Reconnect when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('Tab became visible, checking connection...');
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    console.log('Reconnecting after tab focus...');
                    connectWebSocket();
                }
            }
        });
        
        // Periodic connection check
        setInterval(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.log('Periodic check: Connection lost, reconnecting...');
                connectWebSocket();
            }
        }, 5000);
        
        // Poll functions
        function showPoll(pollData) {
            console.log('Poll started:', pollData);
            currentPollId = pollData.pollId;
            currentPollData = pollData;
            hasVoted = false;
            
            // Show poll view first to ensure elements are accessible
            document.getElementById('pollView').classList.add('active');
            
            // Update poll question
            const pollQuestionEl = document.getElementById('pollQuestion');
            if (pollQuestionEl) {
                pollQuestionEl.textContent = pollData.question || 'What should we explore next?';
            }
            
            // Clear and populate options
            const optionsContainer = document.getElementById('pollOptions');
            if (optionsContainer) {
                optionsContainer.innerHTML = '';
                
                if (pollData.options) {
                    pollData.options.forEach((option, index) => {
                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'poll-option';
                        optionDiv.dataset.optionId = option.id || ('option' + index);
                        optionDiv.onclick = () => submitVote(option.id || ('option' + index));
                        
                        const label = document.createElement('div');
                        label.className = 'poll-option-label';
                        label.textContent = option.label || option;
                        
                        // Don't show vote counts or bars to audience members
                        // They only see the options they can click
                        
                        optionDiv.appendChild(label);
                        optionsContainer.appendChild(optionDiv);
                    });
                }
            }
            
            // Update vote status
            const voteStatusEl = document.getElementById('voteStatus');
            if (voteStatusEl) {
                voteStatusEl.textContent = 'Tap an option to vote!';
                voteStatusEl.classList.remove('voted');
            }
            
            // Start timer
            let timeRemaining = pollData.duration || 20;
            const pollTimerEl = document.getElementById('pollTimer');
            if (pollTimerEl) {
                pollTimerEl.textContent = timeRemaining;
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
                }
            }, 1000);
        }
        
        function submitVote(optionId) {
            if (hasVoted || !currentPollId) return;
            
            hasVoted = true;
            console.log('Voting for:', optionId);
            
            // Mark as voted
            const options = document.querySelectorAll('.poll-option');
            options.forEach(opt => {
                if (opt.dataset.optionId === optionId) {
                    opt.classList.add('voted');
                }
            });
            
            document.getElementById('voteStatus').textContent = '✓ Vote submitted!';
            document.getElementById('voteStatus').classList.add('voted');
            
            // Send vote to server
            fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pollId: currentPollId,
                    optionId: optionId,
                    userId: getUserId(),
                    roomId: roomId
                })
            }).catch(err => console.error('Vote failed:', err));
        }
        
        function updatePollResults(results) {
            // Audience members shouldn't see live poll results
            // Only their own vote should be visible
            // The presenter view shows the aggregated results
            return;
        }
        
        function endPoll(data) {
            clearInterval(pollTimer);
            
            if (data && data.winner) {
                // Highlight winner
                const options = document.querySelectorAll('.poll-option');
                options.forEach(opt => {
                    if (opt.dataset.optionId === data.winner) {
                        opt.style.background = '#e8f5e9';
                        opt.style.border = '2px solid #4caf50';
                    }
                });
                
                // Update vote status to show winner
                const winnerOption = currentPollData.options.find(o => o.id === data.winner);
                if (winnerOption) {
                    document.getElementById('voteStatus').innerHTML = '🎆 Winner: <strong>' + winnerOption.label + '</strong>';
                    document.getElementById('voteStatus').style.color = '#4caf50';
                    document.getElementById('voteStatus').style.fontSize = '1.2rem';
                }
                
                // Show confetti if voted for winner
                const votedOption = document.querySelector('.poll-option.voted');
                if (votedOption && votedOption.dataset.optionId === data.winner) {
                    createConfetti(document.getElementById('pollView'));
                }
            }
            
            // Hide poll after delay - don't update title here as slideChanged will handle it
            setTimeout(() => {
                document.getElementById('pollView').classList.remove('active');
                currentPollId = null;
                hasVoted = false;
                
                // The slideChanged message will update the title with correct slide data
                // so we don't need to do it here
            }, 3000);
        }
        
        function getUserId() {
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = 'user-' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('userId', userId);
            }
            return userId;
        }
        
        // Confetti function
        window.createConfetti = function(container) {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
            const confettiCount = 100;
            const confettiPieces = [];
            
            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-piece';
                confetti.style.position = 'absolute';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 3 + 's';
                container.appendChild(confetti);
                confettiPieces.push(confetti);
            }
            
            // Only remove confetti pieces, not the entire container
            setTimeout(() => {
                confettiPieces.forEach(piece => {
                    if (piece.parentNode) {
                        piece.parentNode.removeChild(piece);
                    }
                });
            }, 5000);
        };
    </script>
</body>
</html>`;