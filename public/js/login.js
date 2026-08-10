document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            window.location.href = data.redirect;
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.classList.remove('hidden');
        }
    } catch (err) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.remove('hidden');
    }
});
