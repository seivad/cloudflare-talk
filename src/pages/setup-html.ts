export const SETUP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup - Cloudflare Tech Talk</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        .setup-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 450px;
            padding: 3rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .header h1 {
            font-size: 2rem;
            color: #333;
            margin-bottom: 0.5rem;
        }
        
        .header .emoji {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .header p {
            color: #666;
            font-size: 0.95rem;
            line-height: 1.5;
        }
        
        .welcome-box {
            background: linear-gradient(135deg, #667eea15, #764ba215);
            border: 2px solid #667eea30;
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 2rem;
        }
        
        .welcome-box h3 {
            color: #667eea;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }
        
        .welcome-box p {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #555;
            font-weight: 500;
            font-size: 0.95rem;
        }
        
        input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .password-requirements {
            margin-top: 0.5rem;
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 0.85rem;
            color: #666;
        }
        
        .requirement {
            display: flex;
            align-items: center;
            margin-bottom: 0.25rem;
        }
        
        .requirement:last-child {
            margin-bottom: 0;
        }
        
        .requirement .icon {
            width: 16px;
            margin-right: 0.5rem;
            color: #999;
        }
        
        .requirement.met .icon {
            color: #4caf50;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: none;
            font-size: 0.9rem;
        }
        
        .error-message.show {
            display: block;
        }
        
        .submit-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        
        .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .loader {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .login-link {
            text-align: center;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e1e8ed;
        }
        
        .login-link p {
            color: #666;
            font-size: 0.9rem;
        }
        
        .login-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .login-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <div class="header">
            <div class="emoji">🎉</div>
            <h1>Welcome!</h1>
            <p>Let's set up your first admin account</p>
        </div>
        
        <div class="welcome-box">
            <h3>First Time Setup</h3>
            <p>Create your admin account to start managing presentations and slides. You'll be able to create additional users later.</p>
        </div>
        
        <div id="errorMessage" class="error-message"></div>
        
        <form id="setupForm">
            <div class="form-group">
                <label for="name">Your Name</label>
                <input type="text" id="name" name="name" required placeholder="John Doe">
            </div>
            
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="your@email.com">
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="••••••••">
                <div class="password-requirements">
                    <div class="requirement" id="req-length">
                        <span class="icon">○</span>
                        <span>At least 8 characters</span>
                    </div>
                    <div class="requirement" id="req-letter">
                        <span class="icon">○</span>
                        <span>Contains a letter</span>
                    </div>
                    <div class="requirement" id="req-number">
                        <span class="icon">○</span>
                        <span>Contains a number</span>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="••••••••">
            </div>
            
            <button type="submit" class="submit-btn" id="submitBtn">
                <span id="btnText">Create Account</span>
                <span id="btnLoader" style="display: none;">
                    <span class="loader"></span> Creating...
                </span>
            </button>
        </form>
        
        <div class="login-link" id="loginLink" style="display: none;">
            <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
    </div>
    
    <script>
        // Check if users already exist
        async function checkUsers() {
            try {
                const response = await fetch('/api/auth/check-users');
                const data = await response.json();
                if (data.userCount > 0) {
                    // Redirect to login if users exist
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Failed to check users:', error);
            }
        }
        
        // Password validation
        const passwordInput = document.getElementById('password');
        const reqLength = document.getElementById('req-length');
        const reqLetter = document.getElementById('req-letter');
        const reqNumber = document.getElementById('req-number');
        
        function updatePasswordRequirements() {
            const password = passwordInput.value;
            
            // Check length
            if (password.length >= 8) {
                reqLength.classList.add('met');
                reqLength.querySelector('.icon').textContent = '✓';
            } else {
                reqLength.classList.remove('met');
                reqLength.querySelector('.icon').textContent = '○';
            }
            
            // Check for letter
            if (/[a-zA-Z]/.test(password)) {
                reqLetter.classList.add('met');
                reqLetter.querySelector('.icon').textContent = '✓';
            } else {
                reqLetter.classList.remove('met');
                reqLetter.querySelector('.icon').textContent = '○';
            }
            
            // Check for number
            if (/[0-9]/.test(password)) {
                reqNumber.classList.add('met');
                reqNumber.querySelector('.icon').textContent = '✓';
            } else {
                reqNumber.classList.remove('met');
                reqNumber.querySelector('.icon').textContent = '○';
            }
        }
        
        passwordInput.addEventListener('input', updatePasswordRequirements);
        
        // Handle form submission
        document.getElementById('setupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const errorMsg = document.getElementById('errorMessage');
            const submitBtn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const btnLoader = document.getElementById('btnLoader');
            
            // Clear error
            errorMsg.classList.remove('show');
            
            // Validate passwords match
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                errorMsg.textContent = 'Passwords do not match';
                errorMsg.classList.add('show');
                return;
            }
            
            // Validate password requirements
            if (password.length < 8) {
                errorMsg.textContent = 'Password must be at least 8 characters';
                errorMsg.classList.add('show');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: password
            };
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Auto-login successful, redirect to presenter
                    window.location.href = '/presenter';
                } else {
                    errorMsg.textContent = data.error || 'Failed to create account';
                    errorMsg.classList.add('show');
                    
                    // Reset button
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline';
                    btnLoader.style.display = 'none';
                    
                    // Show login link if appropriate
                    if (data.error && data.error.includes('already exist')) {
                        document.getElementById('loginLink').style.display = 'block';
                    }
                }
            } catch (error) {
                errorMsg.textContent = 'An error occurred. Please try again.';
                errorMsg.classList.add('show');
                
                // Reset button
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }
        });
        
        // Check users on load
        checkUsers();
    </script>
</body>
</html>`;