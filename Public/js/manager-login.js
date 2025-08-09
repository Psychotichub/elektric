// Manager Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Manager Login initialized');
    // Clear any stale auth data to avoid loops when opening manager login directly
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('managerAccess');
        localStorage.removeItem('managerSite');
        localStorage.removeItem('managerCompany');
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('token');
        }
    } catch (e) {
        console.error('Failed to clear local storage:', e);
    }
    
    const loginForm = document.getElementById('managerLoginForm');
    const messageDiv = document.getElementById('message');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const isHidden = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isHidden ? 'text' : 'password');
            this.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
            this.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;
        
        // Validation
        if (!username) return showMessage('Please enter your username.', 'error');
        if (!password) return showMessage('Please enter your password.', 'error');
        
        try {
            console.log('🔐 Attempting manager login...');
            showMessage('Logging in...', 'info');
            // Disable form while submitting
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.classList.add('is-loading');
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ Manager login successful');
                
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Store manager-specific info
                localStorage.setItem('managerAccess', 'true');
                
                showMessage('Login successful! Redirecting to manager dashboard...', 'success');
                
                // Redirect to manager dashboard
                setTimeout(() => {
                    window.location.href = '/manager-dashboard';
                }, 1500);
                
            } else {
                console.log('❌ Manager login failed:', data.message);
                showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            showMessage('Network error. Please try again.', 'error');
        } finally {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
        }
    });
    
    // Show message function
    function showMessage(message, type = 'info') {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}); 