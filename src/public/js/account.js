/**
 * Account page functionality
 */
const accountPage = {
	/**
	 * Initialize account page
	 */
	init() {
		this.displayUsername();
		this.setupEventListeners();
	},
	
	/**
	 * Display the user's username
	 */
	displayUsername() {
		// Get username from cookie or previous API responses
		const usernameElement = document.getElementById('account-username');
		
		if (usernameElement) {
			// Try to get username from cookie
			const cookies = document.cookie.split(';');
			let username = '';
			
			for (const cookie of cookies) {
				const [name, value] = cookie.trim().split('=');
				if (name === 'username') {
					username = decodeURIComponent(value);
					break;
				}
			}
			
			if (username) {
				usernameElement.textContent = username;
			} else {
				// If username not found in cookie, show placeholder
				usernameElement.textContent = 'User';
			}
		}
	},
	
	/**
	 * Setup event listeners for account page
	 */
	setupEventListeners() {
		const changePasswordBtn = document.getElementById('change-password');
		const logoutBtn = document.getElementById('logout');
		const deleteAccountBtn = document.getElementById('delete-account');
		const changePasswordForm = document.getElementById('change-password-form');
		const cancelPasswordChangeBtn = document.getElementById('cancel-password-change');
		const confirmDeleteAccountBtn = document.getElementById('confirm-delete-account');
		const cancelDeleteAccountBtn = document.getElementById('cancel-delete-account');
		
		if (changePasswordBtn) {
			changePasswordBtn.addEventListener('click', this.showChangePasswordModal.bind(this));
		}
		
		if (logoutBtn) {
			logoutBtn.addEventListener('click', this.handleLogout.bind(this));
		}
		
		if (deleteAccountBtn) {
			deleteAccountBtn.addEventListener('click', this.showDeleteAccountModal.bind(this));
		}
		
		if (changePasswordForm) {
			changePasswordForm.addEventListener('submit', this.handleChangePassword.bind(this));
		}
		
		if (cancelPasswordChangeBtn) {
			cancelPasswordChangeBtn.addEventListener('click', this.hideChangePasswordModal.bind(this));
		}
		
		if (confirmDeleteAccountBtn) {
			confirmDeleteAccountBtn.addEventListener('click', this.handleDeleteAccount.bind(this));
		}
		
		if (cancelDeleteAccountBtn) {
			cancelDeleteAccountBtn.addEventListener('click', this.hideDeleteAccountModal.bind(this));
		}
	},
	
	/**
	 * Show change password modal
	 */
	showChangePasswordModal() {
		const modal = document.getElementById('change-password-modal');
		
		if (modal) {
			modal.classList.remove('hidden');
		}
	},
	
	/**
	 * Hide change password modal
	 */
	hideChangePasswordModal() {
		const modal = document.getElementById('change-password-modal');
		
		if (modal) {
			modal.classList.add('hidden');
			
			// Reset form
			const form = document.getElementById('change-password-form');
			if (form) {
				form.reset();
			}
			
			// Clear error message
			const errorElement = document.getElementById('change-password-error');
			if (errorElement) {
				errorElement.textContent = '';
			}
		}
	},
	
	/**
	 * Show delete account modal
	 */
	showDeleteAccountModal() {
		const modal = document.getElementById('delete-account-modal');
		
		if (modal) {
			modal.classList.remove('hidden');
		}
	},
	
	/**
	 * Hide delete account modal
	 */
	hideDeleteAccountModal() {
		const modal = document.getElementById('delete-account-modal');
		
		if (modal) {
			modal.classList.add('hidden');
		}
	},
	
	/**
	 * Handle change password form submission
	 * @param {Event} event - Form submit event
	 */
	async handleChangePassword(event) {
		event.preventDefault();
		
		const currentPassword = document.getElementById('current-password').value;
		const newPassword = document.getElementById('new-password').value;
		const confirmNewPassword = document.getElementById('confirm-new-password').value;
		const errorElement = document.getElementById('change-password-error');
		
		// Validate inputs
		if (!currentPassword || !newPassword || !confirmNewPassword) {
			errorElement.textContent = 'All fields are required';
			return;
		}
		
		if (newPassword !== confirmNewPassword) {
			errorElement.textContent = 'New passwords do not match';
			return;
		}
		
		// Validate password requirements
		if (newPassword.length < 8) {
			errorElement.textContent = 'Password must be at least 8 characters long';
			return;
		}
		
		if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
			errorElement.textContent = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
			return;
		}
		
		try {
			// Show loading state
			const submitButton = document.querySelector('#change-password-form button[type="submit"]');
			submitButton.disabled = true;
			submitButton.textContent = 'Changing...';
			
			// Call API to change password
			const response = await window.ApiClient.changePassword(currentPassword, newPassword);
			
			if (response.success) {
				// Hide modal and show success message
				this.hideChangePasswordModal();
				alert('Password changed successfully');
			} else {
				errorElement.textContent = response.error?.message || 'Failed to change password';
				submitButton.disabled = false;
				submitButton.textContent = 'Change Password';
			}
		} catch (error) {
			console.error('Change password error:', error);
			errorElement.textContent = error.message || 'Failed to change password';
			
			const submitButton = document.querySelector('#change-password-form button[type="submit"]');
			submitButton.disabled = false;
			submitButton.textContent = 'Change Password';
		}
	},
	
	/**
	 * Handle logout button click
	 */
	async handleLogout() {
		try {
			const logoutBtn = document.getElementById('logout');
			
			if (logoutBtn) {
				logoutBtn.disabled = true;
				logoutBtn.textContent = 'Logging out...';
			}
			
			// Call API to logout
			const response = await window.ApiClient.logout();
			
			if (response.success) {
				// Update authentication status and navigate to index
				window.router.setAuthentication(false);
			} else {
				alert(response.error?.message || 'Logout failed');
				
				if (logoutBtn) {
					logoutBtn.disabled = false;
					logoutBtn.textContent = 'Logout';
				}
			}
		} catch (error) {
			console.error('Logout error:', error);
			alert(error.message || 'Logout failed');
			
			const logoutBtn = document.getElementById('logout');
			if (logoutBtn) {
				logoutBtn.disabled = false;
				logoutBtn.textContent = 'Logout';
			}
		}
	},
	
	/**
	 * Handle delete account button click
	 */
	async handleDeleteAccount() {
		try {
			const confirmDeleteBtn = document.getElementById('confirm-delete-account');
			
			if (confirmDeleteBtn) {
				confirmDeleteBtn.disabled = true;
				confirmDeleteBtn.textContent = 'Deleting...';
			}
			
			// Call API to delete account
			const response = await window.ApiClient.deleteAccount();
			
			if (response.success) {
				// Update authentication status and navigate to index
				window.router.setAuthentication(false);
			} else {
				alert(response.error?.message || 'Failed to delete account');
				
				if (confirmDeleteBtn) {
					confirmDeleteBtn.disabled = false;
					confirmDeleteBtn.textContent = 'Delete My Account';
				}
				
				this.hideDeleteAccountModal();
			}
		} catch (error) {
			console.error('Delete account error:', error);
			alert(error.message || 'Failed to delete account');
			
			const confirmDeleteBtn = document.getElementById('confirm-delete-account');
			if (confirmDeleteBtn) {
				confirmDeleteBtn.disabled = false;
				confirmDeleteBtn.textContent = 'Delete My Account';
			}
			
			this.hideDeleteAccountModal();
		}
	}
};

// Export the module
window.accountPage = accountPage; 