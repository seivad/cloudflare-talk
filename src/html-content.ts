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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
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
            min-height: 100vh;
            min-height: -webkit-fill-available;
            overflow: hidden;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }
        .app-container { 
            height: 100vh;
            height: -webkit-fill-available;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        .main-view { 
            flex: 1; 
            padding: 1rem; 
            padding-top: env(safe-area-inset-top, 1rem);
            padding-bottom: calc(1rem + 60px + env(safe-area-inset-bottom, 0px)); /* Add extra padding for footer and safe area */
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        .slide-mirror { 
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 1.2rem;
            margin-top: 0.5rem;
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
            font-size: 1.2rem; 
            line-height: 1.8; 
            color: #444; 
            padding: 0;
        }
        
        /* GIF display styles - responsive */
        .slide-gif {
            margin-top: 2rem;
            text-align: center;
            padding: 0 1rem 1rem;
        }
        
        /* Mobile first - stretch to fill container on small screens */
        .slide-gif img {
            width: 100%;
            height: auto;
            min-height: 300px;
            max-height: 400px;
            object-fit: cover;  /* Changed from contain to cover to fill the box */
            object-position: center;  /* Keep centered when cropping */
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        /* Medium screens and up (768px+) - limit width and center, switch back to contain */
        @media (min-width: 768px) {
            .slide-gif {
                padding: 0 2rem 1rem;
            }
            .slide-gif img {
                width: auto;
                max-width: 600px;
                min-height: auto;
                max-height: 450px;
                object-fit: contain;  /* Use contain on larger screens to show full image */
            }
        }
        
        /* Large screens (1024px+) - maintain centered with max width */
        @media (min-width: 1024px) {
            .slide-gif img {
                max-width: 700px;
                max-height: 500px;
            }
        }
        .app-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem;
            padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
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
        
        /* Name modal styles */
        .name-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        }
        .name-modal-content {
            background: white;
            border-radius: 20px;
            padding: 2.5rem;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .name-modal h2 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 1.8rem;
            text-align: center;
        }
        .name-modal p {
            color: #666;
            margin-bottom: 2rem;
            text-align: center;
            font-size: 1rem;
        }
        .name-input-group {
            margin-bottom: 1.5rem;
        }
        .name-input-group label {
            display: block;
            color: #555;
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .name-input-group input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        .name-input-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .name-submit-btn {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .name-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        .name-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        /* Poll view styles */
        .poll-view {
            position: fixed;
            top: env(safe-area-inset-top, 0);
            left: 0;
            right: 0;
            bottom: calc(60px + env(safe-area-inset-bottom, 0px));
            background: rgba(255, 255, 255, 0.98);
            padding: 1.5rem;
            padding-top: calc(1.5rem + env(safe-area-inset-top, 0px));
            padding-bottom: 0.5rem;
            display: none;
            flex-direction: column;
            z-index: 100;
            overflow: hidden;
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
            display: flex;
            flex-direction: column;
            gap: 1rem;
            overflow-y: auto;
            padding-bottom: 1rem;
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
            padding: 1rem 0 0 0;
            font-size: 1rem;
            color: #666;
            background: transparent;
        }
        
        .vote-status.voted {
            color: #4caf50;
            font-weight: 600;
        }
    </style>
</head>
<body class="audience">
    <!-- Name collection modal -->
    <div id="nameModal" class="name-modal">
        <div class="name-modal-content">
            <h2>Welcome to the Tech Talk! 👋</h2>
            <p>Please enter your name to join the session</p>
            <div class="name-input-group">
                <label for="firstName">First Name *</label>
                <input type="text" id="firstName" placeholder="Enter your first name" required>
            </div>
            <div class="name-input-group">
                <label for="lastName">Last Name (or initial)</label>
                <input type="text" id="lastName" placeholder="Enter last name or initial">
            </div>
            <button id="nameSubmitBtn" class="name-submit-btn">Join Session</button>
        </div>
    </div>
    
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
        
        // Cookie functions
        function getCookie(name) {
            const value = '; ' + document.cookie;
            const parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }
        
        function setCookie(name, value, days = 365) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = 'expires=' + date.toUTCString();
            document.cookie = name + '=' + value + ';' + expires + ';path=/;SameSite=Lax';
        }
        
        // Profanity filter
        function filterProfanity(text) {
            // Common profanity list (keeping it reasonable for a professional environment)
            const profanityList = [
                'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'piss', 
                'dick', 'cock', 'pussy', 'bastard', 'slut', 'whore', 'fag', 
                'cunt', 'nigger', 'nigga', 'retard', 'gay', 'homo'
            ];
            
            let filtered = text;
            const specialChars = ['$', '@', '#', '%', '&', '*', '!', '^'];
            
            profanityList.forEach(word => {
                const regex = new RegExp(word, 'gi');
                filtered = filtered.replace(regex, (match) => {
                    // Replace each character with a random special character
                    return match.split('').map(() => 
                        specialChars[Math.floor(Math.random() * specialChars.length)]
                    ).join('');
                });
            });
            
            return filtered;
        }
        
        // Get stored participant info from cookies
        let participantInfo = null;
        const storedFirstName = getCookie('participant_firstName');
        const storedLastName = getCookie('participant_lastName');
        
        if (storedFirstName) {
            participantInfo = {
                firstName: storedFirstName,
                lastName: storedLastName || '',
                joinedAt: Date.now()
            };
            console.log('Loaded participant info from cookies:', participantInfo);
        }
        
        // Show name modal if not already registered
        const nameModal = document.getElementById('nameModal');
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const nameSubmitBtn = document.getElementById('nameSubmitBtn');
        
        if (!participantInfo || !participantInfo.firstName) {
            // Show modal
            nameModal.style.display = 'flex';
            
            // Pre-fill if we have cookie data (in case of page reload)
            if (storedFirstName) {
                firstNameInput.value = storedFirstName;
            }
            if (storedLastName) {
                lastNameInput.value = storedLastName;
            }
        } else {
            // Hide modal if already registered
            nameModal.style.display = 'none';
        }
        
        // Handle name submission
        nameSubmitBtn.addEventListener('click', () => {
            let firstName = firstNameInput.value.trim();
            let lastName = lastNameInput.value.trim();
            
            if (!firstName) {
                firstNameInput.style.borderColor = '#ff5252';
                firstNameInput.focus();
                return;
            }
            
            // Apply profanity filter to names
            firstName = filterProfanity(firstName);
            lastName = filterProfanity(lastName);
            
            // Store participant info
            participantInfo = {
                firstName,
                lastName: lastName || '',
                joinedAt: Date.now()
            };
            
            // Save to cookies
            setCookie('participant_firstName', firstName);
            setCookie('participant_lastName', lastName);
            
            // Hide modal
            nameModal.style.display = 'none';
            
            // Continue with WebSocket connection
            console.log('Participant registered:', participantInfo);
            
            // Start WebSocket connection after name collection
            if (!websocket) {
                websocket = connectWebSocket();
            }
        });
        
        // Allow Enter key to submit
        firstNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (firstNameInput.value.trim()) {
                    lastNameInput.focus();
                }
            }
        });
        
        lastNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                nameSubmitBtn.click();
            }
        });
        
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
        let lastReceivedMessageTime = Date.now();
        let connectionCheckInterval = null;
        let waitingForState = false;
        
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
                lastReceivedMessageTime = Date.now();
                updateConnectionStatus('connected');
                
                // Clear any existing intervals
                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                }
                if (connectionCheckInterval) {
                    clearInterval(connectionCheckInterval);
                }
                
                // Always reload participant info from cookies on connection/reconnection
                const cookieFirstName = getCookie('participant_firstName');
                const cookieLastName = getCookie('participant_lastName');
                if (cookieFirstName) {
                    participantInfo = {
                        firstName: cookieFirstName,
                        lastName: cookieLastName || '',
                        joinedAt: Date.now()
                    };
                    console.log('Loaded participant info from cookies:', participantInfo);
                } else if (!participantInfo || !participantInfo.firstName) {
                    // No cookies and no existing info, use anonymous
                    participantInfo = { firstName: 'Anonymous', lastName: '' };
                }
                
                // Send initial join message with participant info to get current state
                waitingForState = true;
                const joinMessage = {
                    type: 'join',
                    roomId: roomId,
                    participant: participantInfo || { firstName: 'Anonymous', lastName: '' }
                };
                ws.send(JSON.stringify(joinMessage));
                
                // Set a timeout to check if we received state
                setTimeout(() => {
                    if (waitingForState) {
                        console.log('Did not receive state after join, requesting again...');
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(joinMessage));
                        }
                    }
                }, 3000);
                
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
                
                // Setup connection health check
                connectionCheckInterval = setInterval(() => {
                    const timeSinceLastMessage = Date.now() - lastReceivedMessageTime;
                    // If we haven't received any message in 30 seconds, force reconnect
                    if (timeSinceLastMessage > 30000 && ws && ws.readyState === WebSocket.OPEN) {
                        console.log('No messages received for 30 seconds, forcing reconnection...');
                        ws.close();
                    }
                }, 10000); // Check every 10 seconds
            };
            
            ws.onmessage = (event) => {
                lastReceivedMessageTime = Date.now();
                const data = JSON.parse(event.data);
                
                // Reset missed pongs on any message
                if (data.type === 'pong') {
                    missedPongs = 0;
                    console.log('Received pong, connection healthy');
                    return;
                }
                
                // Handle different message types
                if (data.type === 'participantUpdate') {
                    document.getElementById('participantCount').textContent = data.data.count;
                } else if (data.type === 'state') {
                    // Mark that we received state
                    waitingForState = false;
                    console.log('Received state update, connection fully restored');
                    
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
                                    '<p style="color: #888; font-size: 0.9rem; margin: 0.5rem 0 0 0; font-weight: 300;">Available for hire, training & development</p>' +
                                    '<div style="margin-top: 1.5rem;">' +
                                    '<h3 style="color: #c75300; font-size: 1.4rem; margin-bottom: 1rem; text-align: left;">Connect with me</h3>' +
                                    '<div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 1rem; text-align: left;">' +
                                    '<div><i class="fab fa-x-twitter" style="width: 1.5rem; color: #333;"></i><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-instagram" style="width: 1.5rem; color: #E4405F;"></i><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-linkedin" style="width: 1.5rem; color: #0077B5;"></i><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                                    '<div><i class="fas fa-envelope" style="width: 1.5rem; color: #c75300;"></i><a href="mailto:mick@5150studios.com.au" style="color: #333; text-decoration: none;">mick@5150studios.com.au</a></div>' +
                                    '</div></div>' +
                                    '<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ddd;">' +
                                    '<h4 style="color: #c75300; font-size: 1.2rem; margin-bottom: 0.5rem; text-align: left;"><i class="fab fa-github" style="margin-right: 0.5rem;"></i>Get the Code</h4>' +
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
                            
                            // Add GIF if available - check inside currentSlide object
                            if (data.data.currentSlide && data.data.currentSlide.gif) {
                                const gifDiv = document.createElement('div');
                                gifDiv.className = 'slide-gif';
                                gifDiv.innerHTML = '<img src="' + data.data.currentSlide.gif + '" alt="Slide animation">';
                                slideBody.appendChild(gifDiv);
                            }
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
                } else if (data.type === 'aiContentGenerated') {
                    // Handle AI-generated content
                    handleAIContentGenerated(data.data);
                } else if (data.type === 'prizeWinner') {
                    // Show prize winner celebration
                    if (data.data && data.data.winner) {
                        showPrizeWinnerCelebration(data.data.winner);
                    }
                } else if (data.type === 'allWinnersSelected') {
                    // Show all winners message
                    showAllWinnersMessage(data.data);
                } else if (data.type === 'slideChanged') {
                    console.log('Received slideChanged event:', data.data.index, data.data.title);
                    // Update current slide info
                    if (data.data) {
                        // Show the title again (in case it was hidden by AI content)
                        document.getElementById('currentTitle').style.display = 'block';
                        
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
                                    '<p style="color: #888; font-size: 0.9rem; margin: 0.5rem 0 0 0; font-weight: 300;">Available for hire, training & development</p>' +
                                    '<div style="margin-top: 1.5rem;">' +
                                    '<h3 style="color: #c75300; font-size: 1.4rem; margin-bottom: 1rem; text-align: left;">Connect with me</h3>' +
                                    '<div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 1rem; text-align: left;">' +
                                    '<div><i class="fab fa-x-twitter" style="width: 1.5rem; color: #333;"></i><a href="https://x.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-instagram" style="width: 1.5rem; color: #E4405F;"></i><a href="https://instagram.com/_mickdavies" target="_blank" style="color: #333; text-decoration: none;">@_mickdavies</a></div>' +
                                    '<div><i class="fab fa-linkedin" style="width: 1.5rem; color: #0077B5;"></i><a href="https://linkedin.com/in/mickdaviesaus" target="_blank" style="color: #333; text-decoration: none;">mickdaviesaus</a></div>' +
                                    '<div><i class="fas fa-envelope" style="width: 1.5rem; color: #c75300;"></i><a href="mailto:mick@5150studios.com.au" style="color: #333; text-decoration: none;">mick@5150studios.com.au</a></div>' +
                                    '</div></div>' +
                                    '<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #ddd;">' +
                                    '<h4 style="color: #c75300; font-size: 1.2rem; margin-bottom: 0.5rem; text-align: left;"><i class="fab fa-github" style="margin-right: 0.5rem;"></i>Get the Code</h4>' +
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
                            
                            // Add GIF if available
                            if (data.data && data.data.gif) {
                                const gifDiv = document.createElement('div');
                                gifDiv.className = 'slide-gif';
                                gifDiv.innerHTML = '<img src="' + data.data.gif + '" alt="Slide animation">';
                                slideBody.appendChild(gifDiv);
                            }
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
                
                // Clear all intervals
                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }
                if (connectionCheckInterval) {
                    clearInterval(connectionCheckInterval);
                    connectionCheckInterval = null;
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
        
        // Connect on load only if already registered
        let websocket = null;
        if (participantInfo && participantInfo.firstName) {
            websocket = connectWebSocket();
        }
        
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
        
        // Periodic connection check and health verification
        setInterval(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.log('Periodic check: Connection lost, reconnecting...');
                connectWebSocket();
            } else {
                // Check if connection is truly healthy
                const timeSinceLastMessage = Date.now() - lastReceivedMessageTime;
                if (timeSinceLastMessage > 60000) { // 1 minute without any messages
                    console.log('Connection appears stale (no messages for 60s), forcing reconnect...');
                    if (ws) {
                        ws.close();
                    }
                    connectWebSocket();
                }
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
        
        function showAllWinnersMessage(data) {
            console.log('🎊 All participants have won!');
            
            const celebrationDiv = document.createElement('div');
            celebrationDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(102,126,234,0.95) 0%, rgba(118,75,162,0.95) 100%); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            
            celebrationDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><div style="font-size: 4rem; margin-bottom: 2rem;">🎊🎉🏆🎉🎊</div><h1 style="font-size: 2.5rem; color: white; margin-bottom: 1rem;">Everyone Has Won!</h1><div style="font-size: 1.5rem; color: white;">Everyone is a winner today!</div><div style="font-size: 1.2rem; color: white; margin-top: 2rem;">Congratulations to everyone! 👏</div></div>';
            
            document.body.appendChild(celebrationDiv);
            
            // Removed confetti - emojis are enough
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                celebrationDiv.remove();
            }, 5000);
        }
        
        function showPrizeWinnerCelebration(winner) {
            console.log('🎉 Prize winner announced:', winner.fullName);
            
            // Check if this is the winner
            const isWinner = participantInfo && 
                participantInfo.firstName === winner.firstName &&
                (!winner.lastName || participantInfo.lastName.startsWith(winner.lastName.charAt(0)));
            
            // Create celebration overlay
            const celebrationDiv = document.createElement('div');
            celebrationDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(10px);';
            
            if (isWinner) {
                celebrationDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><div style="font-size: 5rem; margin-bottom: 1rem;">🎉🏆🎉</div><h1 style="font-size: 3rem; color: #FFD700; margin-bottom: 2rem;">YOU WON!</h1><div style="font-size: 1.5rem; color: white;">Congratulations! You\\'ve won a prize!</div></div>';
                // Removed confetti - emojis are enough
            } else {
                celebrationDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><div style="font-size: 3rem; margin-bottom: 1rem;">🎊</div><h2 style="font-size: 2rem; color: white; margin-bottom: 1rem;">And the winner is...</h2><div style="font-size: 2.5rem; color: #FFD700; margin-bottom: 2rem;">' + winner.fullName + '</div><div style="font-size: 1rem; color: #ccc;">Congratulations to the winner! 👏</div></div>';
            }
            
            document.body.appendChild(celebrationDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                celebrationDiv.remove();
            }, 5000);
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
                
                // Check if this is an AI Poll
                if (data.isAIPoll && data.aiGenerationPending) {
                    // Show generation pending message
                    setTimeout(() => {
                        document.getElementById('voteStatus').innerHTML = \`
                            <div style="text-align: center;">
                                <i class="fas fa-magic" style="color: #667eea; font-size: 1.5rem;"></i>
                                <p style="margin: 0.5rem 0;">Generating AI \${data.winningOption.type === 'image' ? 'Image' : 'Response'}...</p>
                                <div><i class="fas fa-spinner fa-spin" style="color: #667eea;"></i></div>
                            </div>
                        \`;
                    }, 2000);
                }
                
                // Removed confetti effect - emojis are enough for celebration
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
        
        function handleAIContentGenerated(data) {
            console.log('AI Content Generated:', data);
            
            // Hide poll view
            document.getElementById('pollView').classList.remove('active');
            
            // Get the slide body element
            const slideBody = document.getElementById('slideBody');
            if (!slideBody) return;
            
            const content = data.content;
            
            if (content.type === 'image') {
                // Display generated image
                slideBody.innerHTML = \`
                    <div style="text-align: center; padding: 1rem;">
                        <h3 style="color: #667eea; margin-bottom: 1rem; font-size: 1.6rem;">
                            <i class="fas fa-magic"></i> AI Generated: \${data.optionKey}
                        </h3>
                        <div style="display: flex; justify-content: center; align-items: center;">
                            <img src="\${content.url}" 
                                 alt="AI Generated Image" 
                                 style="max-width: 100%; max-height: 60vh; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"
                                 onload="this.style.opacity = '0'; setTimeout(() => { this.style.transition = 'opacity 0.5s'; this.style.opacity = '1'; }, 50);">
                        </div>
                    </div>
                \`;
                
                // Hide the regular slide title
                document.getElementById('currentTitle').style.display = 'none';
            } else if (content.type === 'text') {
                // Display text with simulated streaming
                slideBody.innerHTML = \`
                    <div style="padding: 1rem;">
                        <h3 style="color: #667eea; margin-bottom: 1.5rem; font-size: 1.4rem;">
                            <i class="fas fa-robot"></i> AI Response: \${data.optionKey}
                        </h3>
                        <div id="aiTextContent" style="font-size: 1.2rem; line-height: 1.6; color: #444; white-space: pre-wrap;"></div>
                    </div>
                \`;
                
                // Hide the regular slide title
                document.getElementById('currentTitle').style.display = 'none';
                
                // Simulate streaming effect for the audience
                if (content.content) {
                    simulateTextStreaming('aiTextContent', content.content);
                }
            }
        }
        
        function simulateTextStreaming(elementId, fullText) {
            const element = document.getElementById(elementId);
            if (!element || !fullText) return;
            
            let index = 0;
            const chunkSize = 3; // Characters per frame
            
            const streamInterval = setInterval(() => {
                if (index < fullText.length) {
                    element.textContent += fullText.slice(index, index + chunkSize);
                    index += chunkSize;
                    
                    // Auto-scroll if content overflows
                    if (element.scrollHeight > element.clientHeight) {
                        element.scrollTop = element.scrollHeight;
                    }
                } else {
                    clearInterval(streamInterval);
                }
            }, 30); // 30ms between chunks for smooth appearance
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