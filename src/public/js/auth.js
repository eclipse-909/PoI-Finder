/**
 * Authentication functionality for login and signup
 */
const authPage = {
  /**
   * Initialize login page
   */
  initLogin() {
    const loginForm = document.getElementById('login-form');
    const toSignupLink = document.getElementById('to-signup');
    
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }
    
    if (toSignupLink) {
      toSignupLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.router.navigate('signup');
      });
    }
  },
  
  /**
   * Initialize signup page
   */
  initSignup() {
    const signupForm = document.getElementById('signup-form');
    const toLoginLink = document.getElementById('to-login');
    
    if (signupForm) {
      signupForm.addEventListener('submit', this.handleSignup.bind(this));
    }
    
    if (toLoginLink) {
      toLoginLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.router.navigate('login');
      });
    }
  },
  
  /**
   * Handle login form submission
   * @param {Event} event - Form submit event
   */
  async handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    if (!username || !password) {
      errorElement.textContent = 'Please enter both username and password';
      return;
    }
    
    try {
      // Show loading state
      const submitButton = document.querySelector('#login-form button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
      
      // Call API to login
      const response = await window.api.login(username, password);
      
      if (response.success) {
        // Update authentication status and navigate to home
        window.router.setAuthentication(true);
      } else {
        errorElement.textContent = response.error?.message || 'Login failed';
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      }
    } catch (error) {
      errorElement.textContent = error.message || 'Login failed';
      const submitButton = document.querySelector('#login-form button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  },
  
  /**
   * Handle signup form submission
   * @param {Event} event - Form submit event
   */
  async handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('signup-error');
    
    if (!username || !password || !confirmPassword) {
      errorElement.textContent = 'Please fill out all fields';
      return;
    }
    
    if (password !== confirmPassword) {
      errorElement.textContent = 'Passwords do not match';
      return;
    }
    
    // Validate password requirements
    if (password.length < 8) {
      errorElement.textContent = 'Password must be at least 8 characters long';
      return;
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      errorElement.textContent = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      return;
    }
    
    try {
      // Show loading state
      const submitButton = document.querySelector('#signup-form button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
      
      // Call API to sign up
      const response = await window.api.signup(username, password);
      
      if (response.success) {
        // Update authentication status and navigate to home
        window.router.setAuthentication(true);
      } else {
        errorElement.textContent = response.error?.message || 'Signup failed';
        submitButton.disabled = false;
        submitButton.textContent = 'Sign Up';
      }
    } catch (error) {
      errorElement.textContent = error.message || 'Signup failed';
      const submitButton = document.querySelector('#signup-form button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = 'Sign Up';
    }
  },
  
  /**
   * Initialize index page handlers
   * (Login and Signup buttons)
   */
  initIndexHandlers() {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.router.navigate('login');
      });
    }
    
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        window.router.navigate('signup');
      });
    }
  }
};

// Index page initialization
const indexPage = {
  init() {
    authPage.initIndexHandlers();
  }
};

// Export the modules
window.authPage = authPage;
window.indexPage = indexPage; 