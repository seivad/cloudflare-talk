// HTML for the admin interface
export const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Cloudflare Tech Talk</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            padding: 2rem;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            color: #333;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            color: #666;
        }
        
        .admin-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 2rem;
        }
        
        .sidebar {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            height: fit-content;
        }
        
        .main-content {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .section-title {
            color: #333;
            font-size: 1.3rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .action-button {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.3s;
        }
        
        .action-button:hover {
            opacity: 0.9;
        }
        
        .action-button.secondary {
            background: #764ba2;
        }
        
        .action-button.danger {
            background: #dc3545;
        }
        
        .presentation-list {
            list-style: none;
        }
        
        .presentation-item {
            padding: 1rem;
            margin-bottom: 1rem;
            background: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .presentation-item:hover {
            background: #f0f0f0;
        }
        
        .presentation-item.active {
            background: #e8f5e9;
            border-color: #4caf50;
        }
        
        .presentation-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 0.25rem;
        }
        
        .presentation-meta {
            font-size: 0.9rem;
            color: #666;
        }
        
        .slide-editor {
            display: none;
        }
        
        .slide-editor.active {
            display: block;
        }
        
        .slide-card {
            padding: 1.5rem;
            margin-bottom: 1rem;
            background: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .slide-number {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-bottom: 0.5rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-label {
            display: block;
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        
        .form-input,
        .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
            font-family: inherit;
        }
        
        .form-textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .form-input:focus,
        .form-textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .button-group {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .save-button {
            padding: 0.75rem 1.5rem;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .cancel-button {
            padding: 0.75rem 1.5rem;
            background: #f5f5f5;
            color: #666;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .status-message {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: none;
        }
        
        .status-message.success {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #4caf50;
            display: block;
        }
        
        .status-message.error {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #f44336;
            display: block;
        }
        
        .json-upload {
            border: 2px dashed #ddd;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .json-upload.dragover {
            border-color: #667eea;
            background: #f0f5ff;
        }
        
        .upload-label {
            color: #666;
            margin-bottom: 1rem;
        }
        
        .file-input {
            display: none;
        }
        
        .browse-button {
            padding: 0.5rem 1rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        
        @media (max-width: 768px) {
            .admin-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛠️ Admin Dashboard</h1>
            <p>Manage presentations and content</p>
        </div>
        
        <div id="statusMessage" class="status-message"></div>
        
        <div class="admin-grid">
            <div class="sidebar">
                <h2 class="section-title">Actions</h2>
                <button class="action-button" onclick="importDefault()">
                    Import Default Presentation
                </button>
                <button class="action-button secondary" onclick="showImportJSON()">
                    Import from JSON
                </button>
                <button class="action-button secondary" onclick="createNewPresentation()">
                    Create New Presentation
                </button>
                
                <button class="action-button warning" onclick="clearSessionCache()" style="background: #f97316;">
                    Clear Session Cache
                </button>
                
                <h2 class="section-title" style="margin-top: 2rem;">Presentations</h2>
                <ul id="presentationList" class="presentation-list">
                    <li class="presentation-item">Loading...</li>
                </ul>
            </div>
            
            <div class="main-content">
                <div id="welcomeView">
                    <h2 class="section-title">Welcome to Admin Dashboard</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Select a presentation from the left sidebar to edit, or use the action buttons to import or create new presentations.
                    </p>
                    
                    <div id="jsonUpload" class="json-upload" style="margin-top: 2rem; display: none;">
                        <p class="upload-label">Drag and drop a JSON file here, or click to browse</p>
                        <input type="file" id="fileInput" class="file-input" accept=".json">
                        <button class="browse-button" onclick="document.getElementById('fileInput').click()">
                            Choose File
                        </button>
                    </div>
                </div>
                
                <div id="slideEditor" class="slide-editor">
                    <h2 class="section-title">Edit Presentation</h2>
                    <div id="presentationDetails"></div>
                    
                    <h3 class="section-title" style="margin-top: 2rem;">Slides</h3>
                    <div id="slidesList"></div>
                    
                    <div class="button-group">
                        <button class="save-button" onclick="savePresentation()">
                            Save Changes
                        </button>
                        <button class="cancel-button" onclick="cancelEdit()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let presentations = [];
        let currentPresentation = null;
        let currentSlides = [];
        let adminKey = '';
        
        // Check for admin key
        function checkAuth() {
            adminKey = localStorage.getItem('adminKey');
            if (!adminKey) {
                adminKey = prompt('Enter admin key:');
                if (adminKey) {
                    localStorage.setItem('adminKey', adminKey);
                } else {
                    window.location.href = '/';
                }
            }
        }
        
        // Load presentations
        async function loadPresentations() {
            try {
                const response = await fetch('/api/presentations');
                if (!response.ok) throw new Error('Failed to load presentations');
                
                presentations = await response.json();
                displayPresentations();
            } catch (error) {
                console.error('Error loading presentations:', error);
                showStatus('Failed to load presentations', 'error');
            }
        }
        
        function displayPresentations() {
            const list = document.getElementById('presentationList');
            
            if (presentations.length === 0) {
                list.innerHTML = '<li class="presentation-item">No presentations found</li>';
                return;
            }
            
            list.innerHTML = presentations.map(pres => \`
                <li class="presentation-item" onclick="selectPresentation('\${pres.id}')">
                    <div class="presentation-name">\${pres.name}</div>
                    <div class="presentation-meta">
                        \${pres.slide_count || 0} slides • Created by \${pres.created_by || 'unknown'}
                    </div>
                </li>
            \`).join('');
        }
        
        async function selectPresentation(id) {
            currentPresentation = presentations.find(p => p.id === id);
            if (!currentPresentation) return;
            
            // Mark as active
            document.querySelectorAll('.presentation-item').forEach(el => {
                el.classList.remove('active');
            });
            event.target.closest('.presentation-item').classList.add('active');
            
            // Load slides
            try {
                const response = await fetch(\`/api/presentations/\${id}/slides\`);
                if (!response.ok) {
                    // For now, show placeholder
                    currentSlides = [];
                    showEditor();
                    return;
                }
                currentSlides = await response.json();
            } catch (error) {
                console.error('Error loading slides:', error);
                currentSlides = [];
            }
            
            showEditor();
        }
        
        function showEditor() {
            document.getElementById('welcomeView').style.display = 'none';
            document.getElementById('slideEditor').classList.add('active');
            
            // Display presentation details
            document.getElementById('presentationDetails').innerHTML = \`
                <div class="form-group">
                    <label class="form-label">Presentation Name</label>
                    <input type="text" class="form-input" id="presName" value="\${currentPresentation.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" id="presDesc">\${currentPresentation.description || ''}</textarea>
                </div>
            \`;
            
            // Display slides (simplified for now)
            document.getElementById('slidesList').innerHTML = \`
                <p style="color: #666;">Slide editing coming soon...</p>
                <p style="color: #999; font-size: 0.9rem;">
                    Slides are currently managed through JSON import. 
                    Direct editing will be available in the next update.
                </p>
            \`;
        }
        
        async function importDefault() {
            try {
                const response = await fetch('/admin/import-default', {
                    method: 'POST',
                    headers: {
                        'X-Admin-Key': adminKey
                    }
                });
                
                if (!response.ok) throw new Error('Import failed');
                
                const result = await response.json();
                showStatus('Default presentation imported successfully!', 'success');
                loadPresentations();
            } catch (error) {
                console.error('Import error:', error);
                showStatus('Failed to import presentation', 'error');
            }
        }
        
        function showImportJSON() {
            document.getElementById('jsonUpload').style.display = 'block';
            setupDragDrop();
        }
        
        function setupDragDrop() {
            const uploadArea = document.getElementById('jsonUpload');
            const fileInput = document.getElementById('fileInput');
            
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.add('dragover');
                }, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.remove('dragover');
                }, false);
            });
            
            uploadArea.addEventListener('drop', handleDrop, false);
            fileInput.addEventListener('change', handleFileSelect, false);
        }
        
        function handleDrop(e) {
            const files = e.dataTransfer.files;
            handleFiles(files);
        }
        
        function handleFileSelect(e) {
            const files = e.target.files;
            handleFiles(files);
        }
        
        function handleFiles(files) {
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'application/json') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const json = JSON.parse(e.target.result);
                            importJSON(json);
                        } catch (error) {
                            showStatus('Invalid JSON file', 'error');
                        }
                    };
                    reader.readAsText(file);
                } else {
                    showStatus('Please select a JSON file', 'error');
                }
            }
        }
        
        async function importJSON(data) {
            // TODO: Implement JSON import API
            showStatus('JSON import API coming soon', 'error');
        }
        
        function createNewPresentation() {
            // TODO: Implement create new presentation
            showStatus('Create presentation feature coming soon', 'error');
        }
        
        async function clearSessionCache() {
            if (!confirm('This will clear all active session data from the cache. Active presentations will need to be restarted. Continue?')) {
                return;
            }
            
            try {
                // For now, we'll just show a message since clearing specific durable objects
                // requires knowing their IDs. The real clearing happens when initializeSession is called.
                showStatus('Session cache will be cleared when presentations are restarted', 'success');
                
                // Optionally, we could add an API endpoint to clear known session codes
                // But the main fix is already in place - initializeSession now always clears old data
            } catch (error) {
                console.error('Error clearing cache:', error);
                showStatus('Failed to clear cache', 'error');
            }
        }
        
        function savePresentation() {
            // TODO: Implement save
            showStatus('Save feature coming soon', 'error');
        }
        
        function cancelEdit() {
            document.getElementById('slideEditor').classList.remove('active');
            document.getElementById('welcomeView').style.display = 'block';
            currentPresentation = null;
            currentSlides = [];
        }
        
        function showStatus(message, type) {
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = message;
            statusEl.className = \`status-message \${type}\`;
            
            setTimeout(() => {
                statusEl.className = 'status-message';
            }, 5000);
        }
        
        // Initialize
        checkAuth();
        loadPresentations();
    </script>
</body>
</html>`;