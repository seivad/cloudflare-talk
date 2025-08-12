export const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare Tech Talk - Welcome</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-x: hidden;
            overflow-y: auto;
            position: relative;
            padding: 2rem 1rem;
        }
        
        /* Animated background particles */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 1;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            animation: float 20s infinite linear;
        }
        
        @keyframes float {
            from {
                transform: translateY(100vh) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            to {
                transform: translateY(-100vh) translateX(100px);
                opacity: 0;
            }
        }
        
        /* Main content */
        .welcome-container {
            text-align: center;
            z-index: 10;
            max-width: 1200px;
            width: 100%;
            padding: 2rem 1rem;
            animation: fadeInUp 1s ease-out;
            margin: 2rem auto;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .logo {
            width: clamp(100px, 20vw, 150px);
            height: clamp(100px, 20vw, 150px);
            margin: 0 auto 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: clamp(3rem, 8vw, 4rem);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        h1 {
            font-size: clamp(2.5rem, 8vw, 4rem);
            margin-bottom: 1rem;
            font-weight: 800;
            text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
        }
        
        .subtitle {
            font-size: clamp(1.2rem, 4vw, 1.8rem);
            margin-bottom: 3rem;
            opacity: 0.95;
            font-weight: 300;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            padding: 0 1rem;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
            padding: 0 1rem;
        }
        
        @media (max-width: 768px) {
            .feature-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.8rem;
            }
        }
        
        @media (max-width: 480px) {
            .feature-grid {
                grid-template-columns: 1fr;
                gap: 0.8rem;
            }
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 1.2rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s;
            animation: fadeIn 1s ease-out;
            animation-fill-mode: both;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .feature-card:nth-child(2) { animation-delay: 0.2s; }
        .feature-card:nth-child(3) { animation-delay: 0.3s; }
        .feature-card:nth-child(4) { animation-delay: 0.4s; }
        .feature-card:nth-child(5) { animation-delay: 0.5s; }
        .feature-card:nth-child(6) { animation-delay: 0.6s; }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .feature-icon {
            font-size: clamp(2rem, 5vw, 2.5rem);
            margin-bottom: 0.5rem;
        }
        
        .feature-title {
            font-size: clamp(1rem, 2.5vw, 1.2rem);
            font-weight: 600;
            margin-bottom: 0.3rem;
        }
        
        .feature-desc {
            font-size: clamp(0.8rem, 2vw, 0.9rem);
            opacity: 0.9;
        }
        
        .qr-section {
            margin-top: 2rem;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            color: #333;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideInUp 1s ease-out 0.5s;
            animation-fill-mode: both;
            width: 100%;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .qr-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
            .qr-container {
                flex-direction: column;
                gap: 1.5rem;
            }
        }
        
        .qr-code {
            width: clamp(150px, 30vw, 200px);
            height: clamp(150px, 30vw, 200px);
            background: white;
            padding: 10px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            display: block;
            object-fit: contain;
        }
        
        .qr-info {
            text-align: left;
        }
        
        .qr-info h2 {
            font-size: clamp(1.4rem, 4vw, 1.8rem);
            color: #c75300;
            margin-bottom: 1rem;
        }
        
        .qr-info p {
            font-size: clamp(1rem, 2.5vw, 1.1rem);
            line-height: 1.6;
            color: #555;
            margin-bottom: 0.5rem;
        }
        
        @media (max-width: 768px) {
            .qr-info {
                text-align: center;
            }
        }
        
        .url-display {
            margin-top: 1.5rem;
            padding: 1rem;
            background: rgba(0, 120, 212, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(0, 120, 212, 0.2);
        }
        
        .url-label {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.3rem;
            font-weight: 500;
        }
        
        .url-text {
            font-size: clamp(1.1rem, 3vw, 1.3rem);
            color: #0078d4;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            user-select: all;
            cursor: text;
        }
        
        @media (max-width: 768px) {
            .url-display {
                margin-top: 1rem;
                padding: 0.8rem;
            }
        }
        
        .start-button {
            display: inline-block;
            margin-top: 2rem;
            margin-bottom: 2rem;
            padding: clamp(0.8rem, 2vw, 1rem) clamp(2rem, 5vw, 3rem);
            background: linear-gradient(135deg, #00d084, #00a86b);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-size: clamp(1rem, 3vw, 1.2rem);
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(0, 208, 132, 0.4);
            animation: bounce 2s infinite;
        }
        
        .start-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0, 208, 132, 0.6);
        }
        
        .presenter-link {
            margin-top: 1rem;
            font-size: clamp(0.9rem, 2vw, 1rem);
            opacity: 0.8;
        }
        
        .presenter-link p {
            color: rgba(255, 255, 255, 0.9);
        }
        
        .admin-link {
            color: #fff;
            font-weight: 600;
            text-decoration: underline;
            transition: all 0.3s;
        }
        
        .admin-link:hover {
            color: #00d084;
            text-decoration: none;
        }
        
        .start-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        
        .live-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 16px;
            border-radius: 30px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            font-size: 0.9rem;
        }
        
        @media (max-width: 480px) {
            .live-indicator {
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                font-size: 0.8rem;
                gap: 6px;
            }
        }
        
        .live-dot {
            width: 12px;
            height: 12px;
            background: #00d084;
            border-radius: 50%;
            animation: livePulse 2s infinite;
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
        
        .countdown {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.1rem;
            backdrop-filter: blur(10px);
            display: none;
        }
        
        .countdown.active {
            display: block;
            animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    </style>
</head>
<body>
    <!-- Animated particles background -->
    <div class="particles" id="particles"></div>
    
    <!-- Live indicator -->
    <div class="live-indicator">
        <div class="live-dot"></div>
        <span>System Ready</span>
        <span style="margin-left: 10px;">👥</span>
        <span id="participantCount">0</span>
    </div>
    
    <!-- Main content -->
    <div class="welcome-container">
        <div class="logo">⚡</div>
        
        <h1>Welcome to the Edge</h1>
        <p class="subtitle">Build Globally Distributed Applications with Cloudflare Workers</p>
        
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">🚀</div>
                <div class="feature-title">Workers</div>
                <div class="feature-desc">JavaScript at the edge</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <div class="feature-title">Durable Objects</div>
                <div class="feature-desc">Stateful coordination</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💾</div>
                <div class="feature-title">D1 Database</div>
                <div class="feature-desc">SQLite everywhere</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🚦</div>
                <div class="feature-title">Queues</div>
                <div class="feature-desc">Message processing</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🗄️</div>
                <div class="feature-title">R2 Storage</div>
                <div class="feature-desc">Zero egress fees</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🤖</div>
                <div class="feature-title">AI Models</div>
                <div class="feature-desc">Edge inference</div>
            </div>
        </div>
        
        <div class="qr-section">
            <div class="qr-container">
                <img id="qrCode" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Join QR" class="qr-code" style="min-height: 200px; display: block; object-fit: contain;">
                <div class="qr-info">
                    <h2>Join the Experience</h2>
                    <p>📱 Scan the QR code with your phone</p>
                    <p>🗳️ Vote in real-time polls</p>
                    <p>🎯 Shape the presentation direction</p>
                    <p>⚡ Experience edge computing live</p>
                    <div class="url-display">
                        <p class="url-label">Or visit:</p>
                        <p class="url-text" id="audienceUrl"></p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Room Code Input Section -->
        <div style="margin-top: 2rem; margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <h3 style="color: #c75300; font-size: 1.3rem; margin-bottom: 0.8rem; text-align: center;">Have a Room Code?</h3>
            <p style="color: #666; text-align: center; margin-bottom: 1rem; font-size: 0.95rem;">Enter the 6-digit code shown on the presenter's screen</p>
            <form id="roomCodeForm" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <input 
                    type="text" 
                    id="roomCodeInput" 
                    placeholder="123456" 
                    maxlength="6" 
                    pattern="[0-9]{6}"
                    style="
                        width: 180px;
                        padding: 0.8rem;
                        font-size: 1.5rem;
                        text-align: center;
                        border: 2px solid #ddd;
                        border-radius: 12px;
                        font-family: monospace;
                        letter-spacing: 0.3rem;
                        transition: all 0.3s;
                    "
                    oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                    onfocus="this.style.borderColor = '#c75300'"
                    onblur="this.style.borderColor = '#ddd'"
                >
                <button 
                    type="submit"
                    style="
                        padding: 0.7rem 2rem;
                        background: linear-gradient(135deg, #c75300, #a04000);
                        color: white;
                        border: none;
                        border-radius: 30px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(199, 83, 0, 0.3);
                    "
                    onmouseover="this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 20px rgba(199, 83, 0, 0.4)'"
                    onmouseout="this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 15px rgba(199, 83, 0, 0.3)'"
                >
                    Join Room
                </button>
            </form>
            <div id="roomCodeError" style="color: #f44336; text-align: center; margin-top: 0.8rem; display: none; font-size: 0.9rem;"></div>
        </div>
        
        <div style="margin-top: 1rem; text-align: center; color: rgba(255,255,255,0.8); font-size: 0.9rem;">
            — or —
        </div>
        
        <a href="/audience" class="start-button">Join Default Room →</a>
    </div>
    
    <!-- Countdown timer -->
    <div class="countdown" id="countdown">
        Starting in <span id="countdownTime">10</span> seconds...
    </div>
    
    <script>
        // Generate particles
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }
        
        // Handle room code form submission
        document.getElementById('roomCodeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const roomCodeInput = document.getElementById('roomCodeInput');
            const roomCode = roomCodeInput.value.trim();
            const errorDiv = document.getElementById('roomCodeError');
            
            // Hide any previous error
            errorDiv.style.display = 'none';
            
            // Validate room code
            if (!roomCode) {
                errorDiv.textContent = 'Please enter a room code';
                errorDiv.style.display = 'block';
                roomCodeInput.focus();
                return;
            }
            
            if (roomCode.length !== 6) {
                errorDiv.textContent = 'Room code must be 6 digits';
                errorDiv.style.display = 'block';
                roomCodeInput.focus();
                return;
            }
            
            // Check if all characters are digits
            const isValid = roomCode.split('').every(char => char >= '0' && char <= '9');
            if (!isValid) {
                errorDiv.textContent = 'Room code must contain only numbers';
                errorDiv.style.display = 'block';
                roomCodeInput.focus();
                return;
            }
            
            // Success - redirect to the room
            window.location.href = '/audience/' + roomCode;
        });
        
        // Auto-focus the input field
        setTimeout(() => {
            const roomInput = document.getElementById('roomCodeInput');
            if (roomInput) roomInput.focus();
        }, 100);
        
        // Generate QR code
        async function generateQRCode() {
            const audienceUrl = window.location.origin + '/audience';
            const qrImg = document.getElementById('qrCode');
            
            // Display the URL text
            const urlDisplay = document.getElementById('audienceUrl');
            if (urlDisplay) {
                urlDisplay.textContent = audienceUrl;
            }
            
            console.log('Generating QR code for:', audienceUrl);
            
            // Method 1: Try the API endpoint
            try {
                const response = await fetch('/qr/' + encodeURIComponent(audienceUrl) + '?size=400');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    qrImg.src = url;
                    console.log('QR code generated locally');
                    return;
                }
            } catch (e) {
                console.log('Local QR generation failed:', e);
            }
            
            // Method 2: Use external service directly
            const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + 
                          encodeURIComponent(audienceUrl);
            console.log('Using external QR service');
            qrImg.src = apiUrl;
            
            // Method 3: Error fallback
            qrImg.onerror = function() {
                console.error('QR code failed to load');
                // Show text fallback
                const qrContainer = qrImg.parentElement;
                if (qrContainer) {
                    qrContainer.innerHTML = '<div style="padding: 40px; background: white; color: #333; text-align: center; border-radius: 15px;">' +
                        '<div style="font-size: 24px; margin-bottom: 10px;">Join at:</div>' +
                        '<div style="font-size: 18px; color: #0078d4; font-weight: bold;">' + audienceUrl + '</div>' +
                        '</div>';
                }
            };
        }
        
        // WebSocket connection for participant count
        let wsConnection = null;
        let wsReconnectTimeout = null;
        
        function connectWebSocket() {
            // Prevent multiple connections
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                return;
            }
            
            // Clear any pending reconnect
            if (wsReconnectTimeout) {
                clearTimeout(wsReconnectTimeout);
                wsReconnectTimeout = null;
            }
            
            const wsUrl = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + 
                         '//' + window.location.host + '/ws/slides';
            wsConnection = new WebSocket(wsUrl);
            
            wsConnection.onopen = () => {
                console.log('Welcome page connected to WebSocket');
            };
            
            wsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'participantUpdate') {
                    document.getElementById('participantCount').textContent = data.data.count;
                } else if (data.type === 'state' && data.data.participantCount !== undefined) {
                    document.getElementById('participantCount').textContent = data.data.participantCount;
                }
            };
            
            wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            wsConnection.onclose = () => {
                wsConnection = null;
                // Only reconnect once after close
                wsReconnectTimeout = setTimeout(connectWebSocket, 5000);
            };
        }
        
        // Auto-start countdown (optional)
        function startCountdown(seconds) {
            const countdownEl = document.getElementById('countdown');
            const timeEl = document.getElementById('countdownTime');
            let remaining = seconds;
            
            countdownEl.classList.add('active');
            
            const timer = setInterval(() => {
                remaining--;
                timeEl.textContent = remaining;
                
                if (remaining <= 0) {
                    clearInterval(timer);
                    window.location.href = '/slides?admin=1';
                }
            }, 1000);
            
            // Cancel on any click
            document.addEventListener('click', () => {
                clearInterval(timer);
                countdownEl.classList.remove('active');
            }, { once: true });
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            generateQRCode();
            connectWebSocket();
            
            // Optional: auto-start after 30 seconds
            // setTimeout(() => startCountdown(10), 30000);
        });
    </script>
</body>
</html>`;