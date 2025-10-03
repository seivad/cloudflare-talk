export const SLIDE_MANAGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slide Manager - Cloudflare Tech Talk</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
        }
        
        .header-meta {
            display: flex;
            gap: 2rem;
            align-items: center;
        }
        
        .pin-display {
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .pin-value {
            font-family: monospace;
            letter-spacing: 0.1em;
            font-weight: 600;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5a67d8;
        }
        
        .btn-secondary {
            background: white;
            color: #667eea;
            border: 1px solid #667eea;
        }
        
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        
        .btn-success {
            background: #10b981;
            color: white;
        }
        
        .container {
            max-width: 1400px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        
        .actions-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .slides-list {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .slide-item {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            display: flex;
            gap: 1rem;
            align-items: start;
            transition: all 0.3s;
            cursor: move;
        }
        
        .slide-item.dragging {
            opacity: 0.5;
            transform: scale(0.95);
        }
        
        .slide-item.drag-over {
            border-color: #667eea;
            background: #f0f4ff;
        }
        
        .drag-handle {
            color: #9ca3af;
            cursor: grab;
            font-size: 1.2rem;
            padding: 0.5rem;
        }
        
        .drag-handle:active {
            cursor: grabbing;
        }
        
        .slide-number {
            background: #667eea;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .slide-content {
            flex: 1;
        }
        
        .slide-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #1f2937;
        }
        
        .slide-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.5rem;
            flex-wrap: wrap;
        }
        
        .meta-tag {
            background: #e5e7eb;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.85rem;
            color: #4b5563;
        }
        
        .meta-tag.type-initial { background: #dbeafe; color: #1e40af; }
        .meta-tag.type-bio { background: #fce7f3; color: #be185d; }
        .meta-tag.type-poll { background: #d1fae5; color: #047857; }
        .meta-tag.type-standard { background: #e5e7eb; color: #4b5563; }
        
        .slide-description {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .slide-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-body {
            padding: 1.5rem;
        }
        
        .modal-footer {
            padding: 1.5rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
        }
        
        .form-control {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-control.select {
            cursor: pointer;
        }
        
        .dynamic-list {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 0.5rem;
        }
        
        .dynamic-item {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            align-items: start;
        }
        
        .dynamic-item input {
            flex: 1;
        }
        
        .dynamic-item button {
            padding: 0.5rem 0.75rem;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .add-item-btn {
            width: 100%;
            padding: 0.5rem;
            border: 2px dashed #d1d5db;
            background: transparent;
            color: #6b7280;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        
        .add-item-btn:hover {
            border-color: #667eea;
            color: #667eea;
        }
        
        .poll-options-container {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
        }
        
        .poll-option-item {
            background: white;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 0.75rem;
            border: 1px solid #e5e7eb;
        }
        
        .poll-option-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        
        .poll-option-fields {
            display: grid;
            grid-template-columns: 1fr 2fr 100px;
            gap: 0.5rem;
        }
        
        .ai-poll-option-fields {
            width: 100%;
        }
        
        .ai-poll-option-fields input.form-control,
        .ai-poll-option-fields textarea.form-control {
            width: 100% !important;
            box-sizing: border-box;
        }
        
        .route-warning {
            background: #fef2f2;
            color: #991b1b;
            padding: 0.75rem;
            border-radius: 6px;
            margin-top: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .checkbox-wrapper input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        
        .no-slides {
            text-align: center;
            padding: 4rem 2rem;
            color: #6b7280;
        }
        
        .no-slides i {
            font-size: 4rem;
            color: #d1d5db;
            margin-bottom: 1rem;
        }
        
        .back-link {
            color: white;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .back-link:hover {
            opacity: 0.8;
        }
        
        .gif-preview {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(102, 126, 234, 0.3);
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div>
                <a href="/presenter" class="back-link">
                    <i class="fas fa-arrow-left"></i> Back to Presentations
                </a>
                <h1 id="presentationTitle">Loading...</h1>
            </div>
            <div class="header-meta">
                <div class="pin-display">
                    <i class="fas fa-lock"></i>
                    <span>PIN: <span class="pin-value" id="pinValue">------</span></span>
                    <button class="btn btn-secondary btn-sm" onclick="togglePin()">
                        <i class="fas fa-eye" id="pinToggleIcon"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="generateNewPin()">
                        <i class="fas fa-sync"></i>
                    </button>
                </div>
                <button class="btn btn-secondary" onclick="editPresentation()">
                    <i class="fas fa-edit"></i> Edit Details
                </button>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="actions-bar">
            <div>
                <button class="btn btn-primary" onclick="addNewSlide()">
                    <i class="fas fa-plus"></i> Add New Slide
                </button>
            </div>
            <div>
                <button class="btn btn-success" id="saveOrderBtn" style="display: none;" onclick="saveSlideOrder()">
                    <i class="fas fa-save"></i> Save Order
                </button>
                <button class="btn btn-secondary" id="cancelOrderBtn" style="display: none;" onclick="cancelReorder()">
                    Cancel
                </button>
            </div>
        </div>
        
        <div class="slides-list" id="slidesList">
            <div class="no-slides">
                <i class="fas fa-layer-group"></i>
                <h2>Loading slides...</h2>
            </div>
        </div>
    </div>
    
    <!-- Edit Presentation Modal -->
    <div class="modal" id="editPresentationModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Presentation</h2>
                <button onclick="closePresentationModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" class="form-control" id="presentationName" />
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="form-control" id="presentationDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>PIN Code *</label>
                    <input
                        type="text"
                        class="form-control"
                        id="presentationPin"
                        placeholder="Enter a PIN"
                        style="font-family: monospace; letter-spacing: 0.1em; font-size: 1.2rem;"
                    />
                    <small style="color: #6b7280; font-size: 0.85rem;">Required - Cannot be empty</small>
                </div>

                <div class="form-group" id="collaboratorsSection" style="display: none; margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #e5e7eb;">
                    <label style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; display: block;">
                        <i class="fas fa-users"></i> Collaborators
                    </label>

                    <!-- Current Collaborators List -->
                    <div id="collaboratorsList" style="margin-bottom: 1rem;">
                        <!-- Collaborators will be dynamically added here -->
                    </div>

                    <!-- Add Collaborator Form -->
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <label style="font-size: 0.9rem; color: #6b7280; margin-bottom: 0.5rem; display: block;">
                            Add Collaborator by Email
                        </label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input
                                type="email"
                                class="form-control"
                                id="collaboratorEmail"
                                placeholder="user@example.com"
                                style="flex: 1;"
                            />
                            <button class="btn btn-primary" onclick="addCollaborator()" style="white-space: nowrap;">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                        <div id="collaboratorError" style="color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; display: none;"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closePresentationModal()">Cancel</button>
                <button class="btn btn-primary" onclick="savePresentationDetails()">Save Changes</button>
            </div>
        </div>
    </div>
    
    <!-- Edit Slide Modal -->
    <div class="modal" id="editSlideModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="slideModalTitle">Edit Slide</h2>
                <button onclick="closeSlideModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" class="form-control" id="slideTitle" required />
                </div>
                
                <div class="form-group">
                    <label>Slide Type *</label>
                    <select class="form-control select" id="slideType" onchange="handleSlideTypeChange()">
                        <option value="initial">Initial</option>
                        <option value="bio">Bio</option>
                        <option value="standard">Standard</option>
                        <option value="poll">Poll</option>
                        <option value="ai_poll">AI Poll</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="isBioSlide" />
                        <label for="isBioSlide">Is Bio Slide</label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>GIF URL</label>
                    <input type="text" class="form-control" id="slideGif" placeholder="https://example.com/animation.gif" />
                    <img id="gifPreview" class="gif-preview" style="display: none; margin-top: 0.5rem;" />
                </div>
                
                <div class="form-group">
                    <label>Content (one per line)</label>
                    <div class="dynamic-list" id="contentList"></div>
                    <button class="add-item-btn" onclick="addContentItem()">
                        <i class="fas fa-plus"></i> Add Content Line
                    </button>
                </div>
                
                <div class="form-group">
                    <label>Bullet Points</label>
                    <div class="dynamic-list" id="bulletsList"></div>
                    <button class="add-item-btn" onclick="addBulletItem()">
                        <i class="fas fa-plus"></i> Add Bullet Point
                    </button>
                </div>
                
                <!-- Poll-specific fields -->
                <div id="pollFields" style="display: none;">
                    <div class="form-group">
                        <label>Poll Question</label>
                        <input type="text" class="form-control" id="pollQuestion" />
                    </div>
                    
                    <div class="form-group">
                        <label>Poll Options</label>
                        <div class="poll-options-container" id="pollOptionsContainer"></div>
                        <button class="add-item-btn" onclick="addPollOption()">
                            <i class="fas fa-plus"></i> Add Poll Option
                        </button>
                    </div>
                </div>
                
                <!-- AI Poll-specific fields -->
                <div id="aiPollFields" style="display: none;">
                    <div class="form-group">
                        <label>AI Poll Options</label>
                        <div class="info-text" style="margin-bottom: 1rem; color: #666; font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i> Configure options for AI-generated content. Each option will show the "Key" to users and use the "Value" as the AI prompt.
                        </div>
                        <div class="poll-options-container" id="aiPollOptionsContainer"></div>
                        <button class="add-item-btn" onclick="addAIPollOption()">
                            <i class="fas fa-plus"></i> Add AI Poll Option
                        </button>
                    </div>
                </div>
                
                <div id="routeDependencies" class="route-warning" style="display: none;">
                    <i class="fas fa-info-circle"></i>
                    <span id="routeDependenciesText"></span>
                </div>
            </div>
            <div class="modal-footer">
                <div>
                    <button class="btn btn-danger" id="deleteSlideBtn" onclick="deleteSlide()">Delete Slide</button>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="closeSlideModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveSlide()">Save Changes</button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let presentationId = null;
        let presentation = null;
        let slides = [];
        let originalOrder = [];
        let currentEditSlide = null;
        let sortable = null;
        let pinVisible = false;
        
        // Get presentation ID from URL
        const pathParts = window.location.pathname.split('/');
        presentationId = pathParts[pathParts.length - 2];
        
        async function loadPresentation() {
            try {
                // Load presentation details
                const response = await fetch(\`/api/presentations\`);
                if (response.status === 401) {
                    window.location.href = '/login?redirect=' + window.location.pathname;
                    return;
                }
                
                const presentations = await response.json();
                presentation = presentations.find(p => p.id === presentationId);
                
                if (!presentation) {
                    alert('Presentation not found');
                    window.location.href = '/presenter';
                    return;
                }
                
                // Update UI
                document.getElementById('presentationTitle').textContent = presentation.name || 'Untitled Presentation';
                updatePinDisplay();
                
                // Load slides
                await loadSlides();
            } catch (error) {
                console.error('Failed to load presentation:', error);
                alert('Failed to load presentation');
            }
        }
        
        async function loadSlides() {
            try {
                const response = await fetch(\`/api/presentations/\${presentationId}/slides\`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to load slides');
                
                slides = await response.json();
                displaySlides();
            } catch (error) {
                console.error('Failed to load slides:', error);
                document.getElementById('slidesList').innerHTML = \`
                    <div class="no-slides">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h2>Failed to load slides</h2>
                        <p>Please try refreshing the page</p>
                    </div>
                \`;
            }
        }
        
        function displaySlides() {
            const container = document.getElementById('slidesList');
            
            if (slides.length === 0) {
                container.innerHTML = \`
                    <div class="no-slides">
                        <i class="fas fa-layer-group"></i>
                        <h2>No slides yet</h2>
                        <p>Click "Add New Slide" to get started</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = slides.map((slide, index) => \`
                <div class="slide-item" data-slide-id="\${slide.id}">
                    <div class="drag-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="slide-number">\${index + 1}</div>
                    <div class="slide-content">
                        <div class="slide-title">\${escapeHtml(slide.title)}</div>
                        <div class="slide-meta">
                            <span class="meta-tag type-\${slide.slide_type}">\${slide.slide_type}</span>
                            \${slide.is_bio_slide ? '<span class="meta-tag">Bio</span>' : ''}
                            \${slide.gif ? '<span class="meta-tag">Has GIF</span>' : ''}
                            \${slide.poll_question ? '<span class="meta-tag">Has Poll</span>' : ''}
                        </div>
                        \${slide.content || slide.bullets ? \`
                            <div class="slide-description">
                                \${getSlidePreview(slide)}
                            </div>
                        \` : ''}
                        <div class="slide-actions">
                            <button class="btn btn-primary btn-sm" onclick="editSlide('\${slide.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
            \`).join('');
            
            // Initialize sortable
            if (sortable) sortable.destroy();
            
            sortable = Sortable.create(container, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'dragging',
                onStart: () => {
                    originalOrder = [...slides];
                    document.getElementById('saveOrderBtn').style.display = 'inline-block';
                    document.getElementById('cancelOrderBtn').style.display = 'inline-block';
                },
                onEnd: (evt) => {
                    // Update slides array based on new order
                    const movedSlide = slides.splice(evt.oldIndex, 1)[0];
                    slides.splice(evt.newIndex, 0, movedSlide);
                    
                    // Update slide numbers
                    updateSlideNumbers();
                }
            });
        }
        
        function updateSlideNumbers() {
            document.querySelectorAll('.slide-number').forEach((el, index) => {
                el.textContent = index + 1;
            });
        }
        
        function getSlidePreview(slide) {
            let preview = '';
            
            if (slide.content) {
                try {
                    const content = JSON.parse(slide.content);
                    preview = content.slice(0, 2).join(' • ');
                } catch {}
            }
            
            if (slide.bullets) {
                try {
                    const bullets = JSON.parse(slide.bullets);
                    if (preview) preview += ' | ';
                    preview += bullets.slice(0, 2).join(' • ');
                } catch {}
            }
            
            if (slide.poll_question) {
                if (preview) preview += ' | ';
                preview += 'Poll: ' + slide.poll_question;
            }
            
            return preview || 'No content';
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // PIN Management
        function updatePinDisplay() {
            const pinValue = document.getElementById('pinValue');
            if (pinVisible && presentation.pin_code) {
                pinValue.textContent = presentation.pin_code;
            } else if (presentation.pin_code) {
                pinValue.textContent = '••••••';
            } else {
                pinValue.textContent = 'No PIN';
            }
        }
        
        function togglePin() {
            pinVisible = !pinVisible;
            updatePinDisplay();
            document.getElementById('pinToggleIcon').className = pinVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
        
        async function generateNewPin() {
            if (!confirm('Generate a new PIN for this presentation?')) return;
            
            try {
                const response = await fetch(\`/api/presentations/\${presentationId}/generate-pin\`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (!response.ok) throw new Error('Failed to generate PIN');
                
                const data = await response.json();
                presentation.pin_code = data.pin;
                updatePinDisplay();
                alert('New PIN generated: ' + data.pin);
            } catch (error) {
                console.error('Failed to generate PIN:', error);
                alert('Failed to generate new PIN');
            }
        }
        
        // Presentation editing
        async function editPresentation() {
            document.getElementById('presentationName').value = presentation.name || '';
            document.getElementById('presentationDescription').value = presentation.description || '';
            document.getElementById('presentationPin').value = presentation.pin_code || '';

            // Only show collaborators section if user is the owner
            if (presentation.role === 'owner') {
                document.getElementById('collaboratorsSection').style.display = 'block';
                await loadCollaborators();
            } else {
                document.getElementById('collaboratorsSection').style.display = 'none';
            }

            document.getElementById('editPresentationModal').classList.add('active');
        }

        function closePresentationModal() {
            document.getElementById('editPresentationModal').classList.remove('active');
            document.getElementById('collaboratorEmail').value = '';
            document.getElementById('collaboratorError').style.display = 'none';
        }

        async function savePresentationDetails() {
            const name = document.getElementById('presentationName').value.trim();
            const description = document.getElementById('presentationDescription').value.trim();
            const pin = document.getElementById('presentationPin').value.trim();

            // Validate PIN - just make sure it's not empty
            if (!pin) {
                alert('PIN cannot be empty');
                return;
            }

            try {
                const response = await fetch(\`/api/presentations/\${presentationId}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, description, pin_code: pin })
                });

                if (!response.ok) throw new Error('Failed to save');

                presentation.name = name;
                presentation.description = description;
                presentation.pin_code = pin;
                document.getElementById('presentationTitle').textContent = name;
                updatePinDisplay();
                closePresentationModal();
            } catch (error) {
                console.error('Failed to save presentation:', error);
                alert('Failed to save presentation details');
            }
        }

        // Collaborator management
        async function loadCollaborators() {
            try {
                const response = await fetch(\`/api/presentations/\${presentationId}/collaborators\`, {
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Failed to load collaborators');

                const collaborators = await response.json();
                displayCollaborators(collaborators);
            } catch (error) {
                console.error('Failed to load collaborators:', error);
            }
        }

        function displayCollaborators(collaborators) {
            const list = document.getElementById('collaboratorsList');

            if (collaborators.length === 0) {
                list.innerHTML = '<div style="color: #9ca3af; font-size: 0.9rem; font-style: italic;">No collaborators yet</div>';
                return;
            }

            list.innerHTML = collaborators.map(collab => \`
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 0.5rem;">
                    <div>
                        <div style="font-weight: 600; color: #1f2937;">\${collab.name}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">\${collab.email}</div>
                    </div>
                    <button
                        onclick="removeCollaborator('\${collab.user_id}')"
                        class="btn btn-danger"
                        style="padding: 0.5rem 0.75rem; font-size: 0.85rem;"
                        title="Remove collaborator"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            \`).join('');
        }

        async function addCollaborator() {
            const email = document.getElementById('collaboratorEmail').value.trim();
            const errorDiv = document.getElementById('collaboratorError');

            if (!email) {
                errorDiv.textContent = 'Please enter an email address';
                errorDiv.style.display = 'block';
                return;
            }

            // Basic email validation - improved regex
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!emailRegex.test(email)) {
                console.log('Collaborator email validation failed for:', email);
                errorDiv.textContent = 'Please enter a valid email address';
                errorDiv.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(\`/api/presentations/\${presentationId}/collaborators\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to add collaborator');
                }

                document.getElementById('collaboratorEmail').value = '';
                errorDiv.style.display = 'none';
                await loadCollaborators();
            } catch (error) {
                console.error('Failed to add collaborator:', error);
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            }
        }

        async function removeCollaborator(userId) {
            if (!confirm('Remove this collaborator from the presentation?')) return;

            try {
                const response = await fetch(\`/api/presentations/\${presentationId}/collaborators/\${userId}\`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Failed to remove collaborator');

                await loadCollaborators();
            } catch (error) {
                console.error('Failed to remove collaborator:', error);
                alert('Failed to remove collaborator');
            }
        }
        
        // Slide editing
        function addNewSlide() {
            currentEditSlide = null;
            document.getElementById('slideModalTitle').textContent = 'Add New Slide';
            document.getElementById('deleteSlideBtn').style.display = 'none';
            
            // Reset form
            document.getElementById('slideTitle').value = '';
            document.getElementById('slideType').value = 'standard';
            document.getElementById('isBioSlide').checked = false;
            document.getElementById('slideGif').value = '';
            
            // Clear GIF preview
            const gifPreview = document.getElementById('gifPreview');
            gifPreview.style.display = 'none';
            gifPreview.src = '';
            
            document.getElementById('contentList').innerHTML = '';
            document.getElementById('bulletsList').innerHTML = '';
            document.getElementById('pollQuestion').value = '';
            document.getElementById('pollOptionsContainer').innerHTML = '';
            
            handleSlideTypeChange();
            document.getElementById('editSlideModal').classList.add('active');
        }
        
        function editSlide(slideId) {
            currentEditSlide = slides.find(s => s.id === slideId);
            if (!currentEditSlide) return;
            
            document.getElementById('slideModalTitle').textContent = 'Edit Slide';
            document.getElementById('deleteSlideBtn').style.display = 'inline-block';
            
            // Populate form
            document.getElementById('slideTitle').value = currentEditSlide.title || '';
            document.getElementById('slideType').value = currentEditSlide.slide_type || 'standard';
            document.getElementById('isBioSlide').checked = currentEditSlide.is_bio_slide;
            document.getElementById('slideGif').value = currentEditSlide.gif || '';
            
            // Update GIF preview
            const gifPreview = document.getElementById('gifPreview');
            if (currentEditSlide.gif) {
                gifPreview.src = currentEditSlide.gif;
                gifPreview.style.display = 'block';
                gifPreview.onerror = () => {
                    gifPreview.style.display = 'none';
                };
            } else {
                gifPreview.style.display = 'none';
            }
            
            // Load content
            loadDynamicList('contentList', currentEditSlide.content);
            loadDynamicList('bulletsList', currentEditSlide.bullets);
            
            // Load poll data
            if (currentEditSlide.poll_question) {
                document.getElementById('pollQuestion').value = currentEditSlide.poll_question;
                loadPollOptions(currentEditSlide.poll_options, currentEditSlide.poll_routes);
            }
            
            // Load AI poll data
            if (currentEditSlide.slide_type === 'ai_poll' && currentEditSlide.ai_poll_prompts) {
                loadAIPollOptions(currentEditSlide.ai_poll_prompts);
            }
            
            handleSlideTypeChange();
            checkRouteDependencies();
            document.getElementById('editSlideModal').classList.add('active');
        }
        
        function closeSlideModal() {
            document.getElementById('editSlideModal').classList.remove('active');
            currentEditSlide = null;
        }
        
        function loadDynamicList(containerId, jsonData) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            
            if (!jsonData) return;
            
            try {
                const items = JSON.parse(jsonData);
                items.forEach(item => {
                    addDynamicItem(containerId, item);
                });
            } catch (e) {
                console.error('Failed to parse JSON:', e);
            }
        }
        
        function addDynamicItem(containerId, value = '') {
            const container = document.getElementById(containerId);
            const item = document.createElement('div');
            item.className = 'dynamic-item';
            item.innerHTML = \`
                <input type="text" class="form-control" value="\${escapeHtml(value)}" />
                <button onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            \`;
            container.appendChild(item);
        }
        
        function addContentItem() {
            addDynamicItem('contentList');
        }
        
        function addBulletItem() {
            addDynamicItem('bulletsList');
        }
        
        function getDynamicListValues(containerId) {
            const container = document.getElementById(containerId);
            const inputs = container.querySelectorAll('input');
            const values = Array.from(inputs).map(input => input.value).filter(v => v.trim());
            return values.length > 0 ? JSON.stringify(values) : null;
        }
        
        function handleSlideTypeChange() {
            const slideType = document.getElementById('slideType').value;
            document.getElementById('pollFields').style.display = slideType === 'poll' ? 'block' : 'none';
            document.getElementById('aiPollFields').style.display = slideType === 'ai_poll' ? 'block' : 'none';
        }
        
        function loadPollOptions(optionsJson, routesJson) {
            const container = document.getElementById('pollOptionsContainer');
            container.innerHTML = '';
            
            if (!optionsJson) return;
            
            try {
                const options = JSON.parse(optionsJson);
                const routes = routesJson ? JSON.parse(routesJson) : {};
                
                options.forEach(option => {
                    addPollOptionElement(option, routes[option.id]);
                });
            } catch (e) {
                console.error('Failed to parse poll data:', e);
            }
        }
        
        function addPollOption() {
            const option = {
                id: 'opt_' + Date.now(),
                label: '',
                emoji: ''
            };
            addPollOptionElement(option, null);
        }
        
        function addPollOptionElement(option, targetSlideId) {
            const container = document.getElementById('pollOptionsContainer');
            const optionDiv = document.createElement('div');
            optionDiv.className = 'poll-option-item';
            optionDiv.dataset.optionId = option.id;
            
            const slideOptions = slides.filter(s => s.id !== currentEditSlide?.id)
                .map(s => \`<option value="\${s.id}" \${targetSlideId === s.id ? 'selected' : ''}>\${escapeHtml(s.title)}</option>\`)
                .join('');
            
            optionDiv.innerHTML = \`
                <div class="poll-option-header">
                    <strong>Option</strong>
                    <button class="btn btn-danger btn-sm" onclick="this.closest('.poll-option-item').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="poll-option-fields">
                    <input type="text" class="form-control" placeholder="Emoji" value="\${escapeHtml(option.emoji || '')}" data-field="emoji" />
                    <input type="text" class="form-control" placeholder="Label" value="\${escapeHtml(option.label || '')}" data-field="label" />
                    <select class="form-control select" data-field="route">
                        <option value="">No redirect</option>
                        \${slideOptions}
                    </select>
                </div>
            \`;
            
            container.appendChild(optionDiv);
        }
        
        function getPollOptionsData() {
            const container = document.getElementById('pollOptionsContainer');
            const optionDivs = container.querySelectorAll('.poll-option-item');
            
            const options = [];
            const routes = {};
            
            optionDivs.forEach(div => {
                const optionId = div.dataset.optionId;
                const emoji = div.querySelector('[data-field="emoji"]').value;
                const label = div.querySelector('[data-field="label"]').value;
                const route = div.querySelector('[data-field="route"]').value;
                
                if (label) {
                    options.push({ id: optionId, label, emoji });
                    if (route) {
                        routes[optionId] = route;
                    }
                }
            });
            
            return {
                options: options.length > 0 ? JSON.stringify(options) : null,
                routes: Object.keys(routes).length > 0 ? JSON.stringify(routes) : null
            };
        }
        
        // AI Poll Functions
        function addAIPollOption() {
            const option = {
                id: 'ai_opt_' + Date.now(),
                key: '',
                value: '',
                type: 'image',
                model: ''
            };
            addAIPollOptionElement(option);
        }
        
        function addAIPollOptionElement(option) {
            const container = document.getElementById('aiPollOptionsContainer');
            const optionDiv = document.createElement('div');
            optionDiv.className = 'poll-option-item';
            optionDiv.dataset.optionId = option.id;
            optionDiv.style.marginBottom = '1.5rem';
            optionDiv.style.padding = '1rem';
            optionDiv.style.background = '#f8f9fa';
            optionDiv.style.borderRadius = '8px';
            
            optionDiv.innerHTML = \`
                <div class="poll-option-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <select class="form-control select" data-field="type" style="width: 120px; margin: 0;">
                            <option value="image" \${option.type === 'image' ? 'selected' : ''}>🎨 Image</option>
                            <option value="text" \${option.type === 'text' ? 'selected' : ''}>📝 Text</option>
                        </select>
                        <strong style="font-size: 0.95rem;">AI Option</strong>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="this.closest('.poll-option-item').remove()">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
                <div class="ai-poll-option-fields">
                    <input type="text" class="form-control" placeholder="Display Key (shown to users)" value="\${escapeHtml(option.key || '')}" data-field="key" />
                    <textarea class="form-control" placeholder="AI Prompt (what the AI will receive)" rows="3" data-field="value" style="resize: vertical; margin-top: 0.75rem;">\${escapeHtml(option.value || '')}</textarea>
                    <input type="hidden" data-field="model" value="@cf/openai/gpt-oss-120b" />
                </div>
            \`;
            
            container.appendChild(optionDiv);
        }
        
        function loadAIPollOptions(promptsJson) {
            const container = document.getElementById('aiPollOptionsContainer');
            container.innerHTML = '';
            
            if (!promptsJson) return;
            
            try {
                // Handle double-encoded JSON (if data was accidentally stringified twice)
                let prompts = promptsJson;
                if (typeof prompts === 'string') {
                    prompts = JSON.parse(prompts);
                    // Check if it's still a string (double-encoded)
                    if (typeof prompts === 'string') {
                        prompts = JSON.parse(prompts);
                    }
                }
                
                // Only process if we have a valid object
                if (prompts && typeof prompts === 'object') {
                    Object.entries(prompts).forEach(([id, option]) => {
                        if (option && typeof option === 'object') {
                            addAIPollOptionElement({ id, ...option });
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to parse AI poll prompts:', e, promptsJson);
            }
        }
        
        function getAIPollOptionsData() {
            const container = document.getElementById('aiPollOptionsContainer');
            const optionDivs = container.querySelectorAll('.poll-option-item');
            
            const prompts = {};
            
            optionDivs.forEach(div => {
                const optionId = div.dataset.optionId;
                const key = div.querySelector('[data-field="key"]')?.value;
                const value = div.querySelector('[data-field="value"]')?.value;
                const type = div.querySelector('[data-field="type"]')?.value;
                const model = div.querySelector('[data-field="model"]')?.value;
                
                if (key && value) {
                    prompts[optionId] = { key, value, type, model: model || '@cf/openai/gpt-oss-120b' };
                }
            });
            
            return Object.keys(prompts).length > 0 ? JSON.stringify(prompts) : null;
        }
        
        function checkRouteDependencies() {
            if (!currentEditSlide) return;
            
            const dependencies = slides.filter(s => {
                if (!s.poll_routes || s.id === currentEditSlide.id) return false;
                try {
                    const routes = JSON.parse(s.poll_routes);
                    return Object.values(routes).includes(currentEditSlide.id);
                } catch {
                    return false;
                }
            });
            
            const depDiv = document.getElementById('routeDependencies');
            if (dependencies.length > 0) {
                depDiv.style.display = 'flex';
                document.getElementById('routeDependenciesText').textContent = 
                    'This slide can be reached from: ' + dependencies.map(s => s.title).join(', ');
            } else {
                depDiv.style.display = 'none';
            }
        }
        
        async function saveSlide() {
            const slideData = {
                title: document.getElementById('slideTitle').value,
                slide_type: document.getElementById('slideType').value,
                is_bio_slide: document.getElementById('isBioSlide').checked,
                gif: document.getElementById('slideGif').value || null,
                content: getDynamicListValues('contentList'),
                bullets: getDynamicListValues('bulletsList')
            };
            
            if (slideData.slide_type === 'poll') {
                slideData.poll_question = document.getElementById('pollQuestion').value || null;
                const pollData = getPollOptionsData();
                slideData.poll_options = pollData.options;
                slideData.poll_routes = pollData.routes;
            } else if (slideData.slide_type === 'ai_poll') {
                const aiPollData = getAIPollOptionsData();
                slideData.ai_poll_prompts = aiPollData; // Already JSON stringified
            }
            
            try {
                let response;
                if (currentEditSlide) {
                    // Update existing slide
                    response = await fetch(\`/api/slides/\${currentEditSlide.id}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(slideData)
                    });
                } else {
                    // Create new slide
                    slideData.presentation_id = presentationId;
                    response = await fetch(\`/api/presentations/\${presentationId}/slides\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(slideData)
                    });
                }
                
                if (!response.ok) throw new Error('Failed to save slide');
                
                closeSlideModal();
                await loadSlides();
            } catch (error) {
                console.error('Failed to save slide:', error);
                alert('Failed to save slide');
            }
        }
        
        async function confirmDeleteSlide(slideId) {
            const slide = slides.find(s => s.id === slideId);
            if (!confirm(\`Delete slide "\${slide.title}"?\\n\\nThis action cannot be undone.\`)) return;
            
            try {
                const response = await fetch(\`/api/slides/\${slideId}\`, {
                    method: 'DELETE',
                    credentials: 'include' // Include cookies for authentication
                });
                
                if (response.status === 401) {
                    window.location.href = '/login?redirect=' + window.location.pathname;
                    return;
                }
                
                if (!response.ok) {
                    let error;
                    try {
                        error = await response.json();
                    } catch (e) {
                        error = { error: 'Failed to delete' };
                    }
                    throw new Error(error.error || 'Failed to delete');
                }
                
                // Deletion successful - reload slides
                await loadSlides();
                
            } catch (error) {
                console.error('Failed to delete slide:', error);
                alert('Failed to delete slide: ' + error.message);
            }
        }
        
        async function deleteSlide() {
            if (!currentEditSlide) return;
            await confirmDeleteSlide(currentEditSlide.id);
            closeSlideModal();
        }
        
        async function saveSlideOrder() {
            const slideIds = slides.map(s => s.id);
            
            try {
                const response = await fetch(\`/api/presentations/\${presentationId}/slides/reorder\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ slideIds })
                });
                
                if (!response.ok) throw new Error('Failed to save order');
                
                document.getElementById('saveOrderBtn').style.display = 'none';
                document.getElementById('cancelOrderBtn').style.display = 'none';
                // Success - no alert, just hide buttons
            } catch (error) {
                console.error('Failed to save slide order:', error);
                alert('Failed to save slide order');
            }
        }
        
        function cancelReorder() {
            slides = [...originalOrder];
            displaySlides();
            document.getElementById('saveOrderBtn').style.display = 'none';
            document.getElementById('cancelOrderBtn').style.display = 'none';
        }
        
        // GIF preview
        document.getElementById('slideGif').addEventListener('input', (e) => {
            const preview = document.getElementById('gifPreview');
            if (e.target.value) {
                preview.src = e.target.value;
                preview.style.display = 'block';
                preview.onerror = () => {
                    preview.style.display = 'none';
                };
            } else {
                preview.style.display = 'none';
            }
        });
        
        // Initialize
        loadPresentation();
    </script>
</body>
</html>`;