// HTML for the audience entry page (entering session code)
export const AUDIENCE_ENTRY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>Join Presentation - Cloudflare Tech Talk</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: white;
        }
        
        .container {
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .logo {
            font-size: 4rem;
            margin-bottom: 2rem;
        }
        
        .title {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 3rem;
        }
        
        .entry-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .input-label {
            display: block;
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            text-align: left;
        }
        
        .code-input {
            width: 100%;
            padding: 1rem;
            font-size: 2rem;
            text-align: center;
            letter-spacing: 0.5rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-weight: bold;
            color: #333;
            transition: border-color 0.3s;
        }
        
        .code-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .code-input::placeholder {
            letter-spacing: normal;
            font-size: 1.2rem;
            color: #999;
        }
        
        .join-button {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s;
        }
        
        .join-button:hover {
            opacity: 0.9;
        }
        
        .join-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: none;
            font-size: 0.9rem;
        }
        
        .error-message.active {
            display: block;
        }
        
        .or-divider {
            color: #666;
            margin: 2rem 0;
            position: relative;
        }
        
        .or-divider::before,
        .or-divider::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 40%;
            height: 1px;
            background: #ddd;
        }
        
        .or-divider::before {
            left: 0;
        }
        
        .or-divider::after {
            right: 0;
        }
        
        .qr-hint {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .recent-sessions {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .recent-title {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-bottom: 1rem;
        }
        
        .recent-code {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            margin: 0.25rem;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .recent-code:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1 class="title">Join Presentation</h1>
        <p class="subtitle">Enter the 6-digit code to join</p>
        
        <div class="entry-card">
            <div id="errorMessage" class="error-message"></div>
            
            <label class="input-label" for="sessionCode">Session Code</label>
            <input 
                type="text" 
                id="sessionCode" 
                class="code-input" 
                placeholder="123456"
                maxlength="6"
                pattern="[0-9]{6}"
                inputmode="numeric"
                autocomplete="off"
                autofocus
            >
            
            <button id="joinButton" class="join-button">
                Join Session
            </button>
            
            <div class="or-divider">OR</div>
            
            <p class="qr-hint">
                Scan the QR code displayed<br>
                on the presenter's screen
            </p>
        </div>
        
        <div id="recentSessions" class="recent-sessions" style="display: none;">
            <p class="recent-title">Recent sessions:</p>
            <div id="recentList"></div>
        </div>
    </div>
    
    <script>
        const codeInput = document.getElementById('sessionCode');
        const joinButton = document.getElementById('joinButton');
        const errorMessage = document.getElementById('errorMessage');
        
        // Auto-format input
        codeInput.addEventListener('input', (e) => {
            // Remove non-digits
            e.target.value = e.target.value.replace(/\\D/g, '');
            
            // Clear error when typing
            errorMessage.classList.remove('active');
            
            // Enable/disable join button
            joinButton.disabled = e.target.value.length !== 6;
            
            // Auto-submit on 6 digits
            if (e.target.value.length === 6) {
                joinSession();
            }
        });
        
        // Join button click
        joinButton.addEventListener('click', joinSession);
        
        // Enter key to join
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && codeInput.value.length === 6) {
                joinSession();
            }
        });
        
        async function joinSession() {
            const code = codeInput.value;
            
            if (code.length !== 6) {
                showError('Please enter a 6-digit code');
                return;
            }
            
            // Show loading state
            joinButton.disabled = true;
            joinButton.innerHTML = '<div class="loading"></div>';
            
            try {
                // Check if session exists by trying to connect
                // For now, just redirect - in production, validate first
                
                // Save to recent sessions
                saveRecentSession(code);
                
                // Navigate to audience view
                window.location.href = \`/audience/\${code}\`;
                
            } catch (error) {
                console.error('Failed to join session:', error);
                showError('Invalid session code. Please check and try again.');
                
                // Reset button
                joinButton.disabled = false;
                joinButton.textContent = 'Join Session';
            }
        }
        
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.add('active');
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorMessage.classList.remove('active');
            }, 5000);
        }
        
        function saveRecentSession(code) {
            let recent = JSON.parse(localStorage.getItem('recentSessions') || '[]');
            
            // Remove if already exists
            recent = recent.filter(c => c !== code);
            
            // Add to beginning
            recent.unshift(code);
            
            // Keep only last 5
            recent = recent.slice(0, 5);
            
            localStorage.setItem('recentSessions', JSON.stringify(recent));
        }
        
        function loadRecentSessions() {
            const recent = JSON.parse(localStorage.getItem('recentSessions') || '[]');
            
            if (recent.length > 0) {
                const container = document.getElementById('recentSessions');
                const list = document.getElementById('recentList');
                
                list.innerHTML = recent.map(code => 
                    \`<span class="recent-code" onclick="quickJoin('\${code}')">\${code}</span>\`
                ).join('');
                
                container.style.display = 'block';
            }
        }
        
        window.quickJoin = function(code) {
            codeInput.value = code;
            joinSession();
        };
        
        // Load recent sessions on page load
        loadRecentSessions();
        
        // Check if redirected from QR code
        const urlParams = new URLSearchParams(window.location.search);
        const sessionFromUrl = urlParams.get('session');
        if (sessionFromUrl && sessionFromUrl.length === 6) {
            codeInput.value = sessionFromUrl;
            joinSession();
        }
    </script>
</body>
</html>`;