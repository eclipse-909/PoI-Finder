// Add this to the top of app.js or as a separate file
// This ensures users are authenticated before accessing app.html
/**
 * Authentication check for app.html
 */
(function() {
    // Check if user is authenticated
    const isAuthenticated = document.cookie.includes('session=');
    
    if (!isAuthenticated) {
        window.location.href = '/login.html';
    }
})(); 