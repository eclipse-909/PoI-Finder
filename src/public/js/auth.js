/**
 * Authentication functionality for login and signup
 */
const apiClient = new ApiClient();

// Define the authPage object first before using it
const authPage = {
	initLoginPage: function() {
		console.log("Initializing login page...");
		const loginForm = document.getElementById('login-form');
		if (!loginForm) {
			console.error("Login form not found!");
			return;
		}
		
		loginForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			
			const username = document.getElementById('username').value;
			const password = document.getElementById('password').value;
			const errorElement = document.getElementById('login-error');
			
			if (!username || !password) {
				errorElement.textContent = 'Username and password are required';
				errorElement.classList.remove('hidden');
				return;
			}
			
			try {
				console.log("Attempting login...");
				errorElement.textContent = '';
				errorElement.classList.add('hidden');
				
				const response = await apiClient.login(username, password);
				console.log("Login response:", response);
				
				if (response.success) {
					console.log("Login successful, storing token and redirecting...");
					// Store the CSRF token
					document.cookie = `csrfToken=${response.data.csrfToken}; path=/; max-age=86400; secure; samesite=lax`;
					
					// Add a slight delay before redirecting to ensure cookies are set
					setTimeout(() => {
						try {
							console.log("Redirecting to app page...");
							window.location.href = '/app.html';
						} catch (e) {
							console.error("Error during redirection:", e);
							alert("Login successful but couldn't redirect. Please go to /app.html manually.");
						}
					}, 100);
				} else {
					console.error("Login failed:", response.error);
					errorElement.textContent = response.error?.message || 'Login failed';
					errorElement.classList.remove('hidden');
				}
			} catch (error) {
				console.error("Exception during login:", error);
				errorElement.textContent = 'An error occurred during login. Please try again.';
				errorElement.classList.remove('hidden');
			}
		});
	},
	
	initSignupPage: function() {
		const signupForm = document.getElementById('signup-form');
		if (!signupForm) return;
		
		signupForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			
			const username = document.getElementById('signup-username').value;
			const password = document.getElementById('signup-password').value;
			const confirmPassword = document.getElementById('confirm-password').value;
			const errorElement = document.getElementById('signup-error');
			
			if (!username || !password || !confirmPassword) {
				errorElement.textContent = 'All fields are required';
				errorElement.classList.remove('hidden');
				return;
			}
			
			if (password !== confirmPassword) {
				errorElement.textContent = 'Passwords do not match';
				errorElement.classList.remove('hidden');
				return;
			}
			
			// Password validation
			if (password.length < 8) {
				errorElement.textContent = 'Password must be at least 8 characters long';
				errorElement.classList.remove('hidden');
				return;
			}
			
			if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
				errorElement.textContent = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
				errorElement.classList.remove('hidden');
				return;
			}
			
			try {
				errorElement.textContent = '';
				errorElement.classList.add('hidden');
				
				const response = await apiClient.signup(username, password);
				
				if (response.success) {
					// Redirect to login page
					window.location.href = '/login.html?registered=true';
				} else {
					errorElement.textContent = response.error?.message || 'Signup failed';
					errorElement.classList.remove('hidden');
				}
			} catch (error) {
				errorElement.textContent = 'An error occurred during signup. Please try again.';
				errorElement.classList.remove('hidden');
				console.error('Signup error:', error);
			}
		});
	},
	
	initIndexHandlers: function() {
		// Any index page specific auth handlers would go here
		console.log('Index page auth handlers initialized');
	}
};

// Index page initialization
const indexPage = {
	init() {
		authPage.initIndexHandlers();
	}
};

// Document ready event handler
document.addEventListener('DOMContentLoaded', () => {
	// Determine which page we're on
	const isLoginPage = window.location.pathname.includes('login.html');
	const isSignupPage = window.location.pathname.includes('signup.html');
	const isIndexPage = window.location.pathname === '/' || window.location.pathname.includes('index.html');
	
	if (isLoginPage) {
		authPage.initLoginPage();
	} else if (isSignupPage) {
		authPage.initSignupPage();
	} else if (isIndexPage) {
		indexPage.init();
	}
});

// Export the modules
window.authPage = authPage;
window.indexPage = indexPage; 