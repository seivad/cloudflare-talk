// HTML for the presenter interface
export const PRESENTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare Tech Talk - Presenter Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem;
            color: white;
        }
        
        .container {
            width: 100%;
            max-width: 1200px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .presentations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .presentation-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 2rem;
            color: #333;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
        }
        
        .presentation-card:hover {
            transform: translateY(-5px);
        }
        
        .presentation-title {
            font-size: 1.5rem;
            color: #c75300;
            margin-bottom: 1rem;
        }
        
        .presentation-desc {
            color: #666;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        
        .presentation-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 0.5rem;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 0.9rem;
            color: #666;
        }
        
        .start-button {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s;
        }
        
        .start-button:hover {
            opacity: 0.9;
        }
        
        .start-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .session-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .session-modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            border-radius: 16px;
            padding: 3rem;
            width: 90%;
            max-width: 500px;
            text-align: center;
            color: #333;
        }
        
        .session-code-display {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-size: 3rem;
            font-weight: bold;
            letter-spacing: 0.5rem;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
        }
        
        .qr-code-container {
            margin: 2rem 0;
        }
        
        .qr-code-container img {
            width: 200px;
            height: 200px;
            border: 4px solid #667eea;
            border-radius: 12px;
            padding: 1rem;
            background: white;
        }
        
        .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }
        
        .modal-button {
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s;
            border: none;
        }
        
        .modal-button.primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .modal-button.secondary {
            background: #f5f5f5;
            color: #666;
        }
        
        .modal-button:hover {
            opacity: 0.9;
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
        
        .no-presentations {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 3rem;
            text-align: center;
            color: #666;
        }
        
        .slide-count {
            background: #e8f5e9;
            color: #4caf50;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
        }
        
        .presenter-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .presenter-link:hover {
            text-decoration: underline;
        }
        
        .error-message {
            background: #ffebee;
            color: #c62828;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            display: none;
        }
        
        .error-message.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Presenter Dashboard</h1>
            <p>Start a new presentation session</p>
        </div>
        
        <div id="presentationsContainer" class="presentations-grid">
            <div class="loading" style="margin: 3rem auto;"></div>
        </div>
        
        <!-- Session Start Modal -->
        <div id="sessionModal" class="session-modal">
            <div class="modal-content">
                <h2>Session Started! 🎉</h2>
                <p style="margin-top: 1rem; color: #666;">Share this code with your audience:</p>
                
                <div class="session-code-display" id="sessionCode">------</div>
                
                <div class="qr-code-container">
                    <img id="qrCode" src="" alt="QR Code">
                </div>
                
                <p style="color: #666; margin-bottom: 1rem;">
                    Audience members can join at:<br>
                    <strong id="audienceUrl"></strong>
                </p>
                
                <div class="modal-actions">
                    <button class="modal-button primary" id="startPresenting">
                        Start Presenting →
                    </button>
                    <button class="modal-button secondary" id="copyCode">
                        Copy Code
                    </button>
                </div>
                
                <div id="errorMessage" class="error-message"></div>
            </div>
        </div>
    </div>
    
    <script>
        let presentations = [];
        let currentSession = null;
        
        // Helper function to escape HTML and remove backslashes
        function escapeHtml(text) {
            // Remove backslashes before exclamation marks
            const cleaned = text.replace(/\\\\!/g, '!');
            const div = document.createElement('div');
            div.textContent = cleaned;
            return div.innerHTML;
        }
        
        // Load presentations on page load
        async function loadPresentations() {
            try {
                const response = await fetch('/api/presentations');
                if (!response.ok) {
                    throw new Error('Failed to load presentations');
                }
                
                presentations = await response.json();
                displayPresentations();
            } catch (error) {
                console.error('Error loading presentations:', error);
                // For now, display a mock presentation since the API isn't ready yet
                presentations = [{
                    id: '1193d1ae-71a7-4820-9a77-933e830d3041',
                    name: 'Cloudflare Tech Talk: Choose Your Own Adventure',
                    description: 'An interactive presentation showcasing Cloudflare\\'s edge computing platform',
                    created_by: 'system',
                    slide_count: 13
                }];
                displayPresentations();
            }
        }
        
        function displayPresentations() {
            const container = document.getElementById('presentationsContainer');
            
            if (presentations.length === 0) {
                container.innerHTML = \`
                    <div class="no-presentations">
                        <h2>No Presentations Available</h2>
                        <p>Please import a presentation first using the admin interface.</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = presentations.map(pres => \`
                <div class="presentation-card">
                    <h3 class="presentation-title">\${escapeHtml(pres.name)}</h3>
                    <p class="presentation-desc">\${escapeHtml(pres.description || 'No description available')}</p>
                    <div class="presentation-meta">
                        <span class="slide-count">\${pres.slide_count || 13} slides</span>
                        <span>by \${pres.created_by || 'unknown'}</span>
                    </div>
                    <button class="start-button" onclick="startSession('\${pres.id}')">
                        Start New Session
                    </button>
                </div>
            \`).join('');
        }
        
        async function startSession(presentationId) {
            try {
                // Show loading state
                const button = event.target;
                const originalText = button.textContent;
                button.disabled = true;
                button.innerHTML = '<div class="loading" style="margin: 0 auto;"></div>';
                
                // Start the session
                const response = await fetch('/api/presenter/start-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ presentationId })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to start session');
                }
                
                currentSession = await response.json();
                
                // Show the modal with session details
                showSessionModal(currentSession);
                
                // Reset button
                button.disabled = false;
                button.textContent = originalText;
                
            } catch (error) {
                console.error('Error starting session:', error);
                alert('Failed to start session. Please try again.');
                
                // Reset button
                if (event.target) {
                    event.target.disabled = false;
                    event.target.textContent = 'Start New Session';
                }
            }
        }
        
        function showSessionModal(session) {
            const modal = document.getElementById('sessionModal');
            const sessionCode = document.getElementById('sessionCode');
            const qrCode = document.getElementById('qrCode');
            const audienceUrl = document.getElementById('audienceUrl');
            
            // Display session code
            sessionCode.textContent = session.sessionCode;
            
            // Generate QR code
            const joinUrl = \`\${window.location.origin}/audience/\${session.sessionCode}\`;
            qrCode.src = \`/qr/\${encodeURIComponent(joinUrl)}?size=400\`;
            audienceUrl.textContent = joinUrl;
            
            // Store presenter token
            localStorage.setItem('presenterToken', session.presenterToken);
            localStorage.setItem('currentSessionCode', session.sessionCode);
            
            // Show modal
            modal.classList.add('active');
        }
        
        // Start presenting button
        document.getElementById('startPresenting').addEventListener('click', () => {
            if (currentSession) {
                // Navigate to presenter view with session
                window.location.href = \`/slides?session=\${currentSession.sessionCode}&token=\${currentSession.presenterToken}\`;
            }
        });
        
        // Copy code button
        document.getElementById('copyCode').addEventListener('click', async () => {
            if (currentSession) {
                try {
                    await navigator.clipboard.writeText(currentSession.sessionCode);
                    const button = document.getElementById('copyCode');
                    button.textContent = 'Copied! ✓';
                    setTimeout(() => {
                        button.textContent = 'Copy Code';
                    }, 2000);
                } catch (error) {
                    console.error('Failed to copy:', error);
                }
            }
        });
        
        // Close modal on background click
        document.getElementById('sessionModal').addEventListener('click', (e) => {
            if (e.target.id === 'sessionModal') {
                e.target.classList.remove('active');
            }
        });
        
        // Load presentations on page load
        loadPresentations();
    </script>
</body>
</html>`;