/**
 * SPA Router for client-side navigation
 */
class Router {
	constructor() {
		this.routes = {
			'index': { template: 'index-template', authRequired: false },
			'login': { template: 'login-template', authRequired: false },
			'signup': { template: 'signup-template', authRequired: false },
			'home': { template: 'home-template', authRequired: true },
			'saved': { template: 'saved-template', authRequired: true },
			'saved-detail': { template: 'saved-detail-template', authRequired: true, params: ['id'] },
			'preferences': { template: 'preferences-template', authRequired: true },
			'account': { template: 'account-template', authRequired: true }
		};
		
		this.currentRoute = null;
		this.params = {};
		this.isAuthenticated = this.checkAuthentication();
		
		// Initialize router
		window.addEventListener('DOMContentLoaded', this.init.bind(this));
		window.addEventListener('popstate', this.handlePopState.bind(this));
	}
	
	/**
	 * Initialize the router
	 */
	init() {
		// Check authentication status and route to the appropriate page
		if (this.isAuthenticated) {
			const path = window.location.pathname.substring(1);
			const routeName = path || 'home';
			
			if (this.routes[routeName]) {
				if (!this.routes[routeName].authRequired || this.isAuthenticated) {
					this.navigate(routeName);
				} else {
					this.navigate('login');
				}
			} else {
				this.navigate('home');
			}
		} else {
			const path = window.location.pathname.substring(1);
			const routeName = path || 'index';
			
			if (this.routes[routeName] && !this.routes[routeName].authRequired) {
				this.navigate(routeName);
			} else {
				this.navigate('index');
			}
		}
		
		// Set up click handlers for navigation
		document.addEventListener('click', (event) => {
			if (event.target.matches('.tab-item') || event.target.closest('.tab-item')) {
				event.preventDefault();
				const tabItem = event.target.matches('.tab-item') ? event.target : event.target.closest('.tab-item');
				const page = tabItem.dataset.page;
				if (page) {
					this.navigate(page);
				}
			}
		});
	}
	
	/**
	 * Check if user is authenticated
	 * @returns {boolean} Authentication status
	 */
	checkAuthentication() {
		return document.cookie.includes('session=');
	}
	
	/**
	 * Handle popstate event (browser back/forward)
	 * @param {Event} event - Popstate event
	 */
	handlePopState(event) {
		const path = window.location.pathname.substring(1);
		const routeName = path || (this.isAuthenticated ? 'home' : 'index');
		
		this.loadRoute(routeName);
	}
	
	/**
	 * Navigate to a specific route
	 * @param {string} routeName - Route name
	 * @param {object} params - Route parameters
	 */
	navigate(routeName, params = {}) {
		// Check if route exists
		if (!this.routes[routeName]) {
			console.error(`Route "${routeName}" does not exist`);
			return;
		}
		
		// Check if authentication is required
		if (this.routes[routeName].authRequired && !this.isAuthenticated) {
			this.navigate('login');
			return;
		}
		
		// Update URL
		const url = routeName === 'index' ? '/' : `/${routeName}`;
		window.history.pushState({}, '', url);
		
		// Load route
		this.loadRoute(routeName, params);
	}
	
	/**
	 * Load a route
	 * @param {string} routeName - Route name
	 * @param {object} params - Route parameters
	 */
	loadRoute(routeName, params = {}) {
		this.currentRoute = routeName;
		this.params = params;
		
		// Get template
		const templateId = this.routes[routeName].template;
		const template = document.getElementById(templateId);
		
		if (!template) {
			console.error(`Template "${templateId}" not found`);
			return;
		}
		
		// Render template
		const appContainer = document.getElementById('app');
		appContainer.innerHTML = '';
		
		const content = document.importNode(template.content, true);
		appContainer.appendChild(content);
		
		// Initialize page-specific JavaScript
		this.initPageScript(routeName);
		
		// Update active tab
		this.updateActiveTab(routeName);
	}
	
	/**
	 * Initialize page-specific JavaScript
	 * @param {string} routeName - Route name
	 */
	initPageScript(routeName) {
		switch (routeName) {
			case 'index':
				if (window.indexPage && typeof window.indexPage.init === 'function') {
					window.indexPage.init();
				}
				break;
			case 'login':
				if (window.authPage && typeof window.authPage.initLogin === 'function') {
					window.authPage.initLogin();
				}
				break;
			case 'signup':
				if (window.authPage && typeof window.authPage.initSignup === 'function') {
					window.authPage.initSignup();
				}
				break;
			case 'home':
				if (window.homePage && typeof window.homePage.init === 'function') {
					window.homePage.init();
				}
				break;
			case 'saved':
				if (window.savedPage && typeof window.savedPage.init === 'function') {
					window.savedPage.init();
				}
				break;
			case 'saved-detail':
				if (window.savedPage && typeof window.savedPage.initDetail === 'function') {
					window.savedPage.initDetail(this.params.id);
				}
				break;
			case 'preferences':
				if (window.preferencesPage && typeof window.preferencesPage.init === 'function') {
					window.preferencesPage.init();
				}
				break;
			case 'account':
				if (window.accountPage && typeof window.accountPage.init === 'function') {
					window.accountPage.init();
				}
				break;
		}
	}
	
	/**
	 * Update active tab in navigation
	 * @param {string} routeName - Route name
	 */
	updateActiveTab(routeName) {
		const tabItems = document.querySelectorAll('.tab-item');
		
		if (!tabItems.length) {
			return;
		}
		
		tabItems.forEach(tab => {
			if (tab.dataset.page === routeName) {
				tab.classList.add('active');
			} else {
				tab.classList.remove('active');
			}
		});
	}
	
	/**
	 * Set authentication status
	 * @param {boolean} isAuthenticated - Authentication status
	 */
	setAuthentication(isAuthenticated) {
		this.isAuthenticated = isAuthenticated;
		
		if (isAuthenticated) {
			if (['index', 'login', 'signup'].includes(this.currentRoute)) {
				this.navigate('home');
			}
		} else {
			if (this.routes[this.currentRoute].authRequired) {
				this.navigate('index');
			}
		}
	}
}

// Create a singleton instance
const router = new Router();

// Export the singleton
window.router = router; 