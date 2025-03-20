/**
 * Utility to test authentication status
 */
(function() {
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth-status', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Auth status:', data);
            return data;
        } catch (error) {
            console.error('Auth check error:', error);
            return { authenticated: false, error: error.message };
        }
    }

    // Add a auth status endpoint
    if (location.pathname === '/login.html') {
        // Add a test button to check auth at the bottom of the page
        const testBtn = document.createElement('button');
        testBtn.textContent = 'Check Auth Status';
        testBtn.style.marginTop = '20px';
        testBtn.onclick = async () => {
            const status = await checkAuthStatus();
            alert(JSON.stringify(status, null, 2));
        };
        
        document.querySelector('.auth-card').appendChild(testBtn);
    }
})(); 