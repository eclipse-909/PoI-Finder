/**
 * API Client for interacting with the backend services
 */
class ApiClient {
	static BASE_URL = '/api';

	/**
	 * Get CSRF token for secure requests
	 * @returns {Promise<string>} CSRF token
	 */
	static async getCsrfToken() {
		const csrfCookie = document.cookie
			.split('; ')
			.find(row => row.startsWith('csrfToken='));
		
		if (csrfCookie) {
			return csrfCookie.split('=')[1];
		}
		
		const response = await fetch(`${ApiClient.BASE_URL}/csrf-token`);
		const data = await response.json();
		return data.csrfToken;
	}

	/**
	 * Login user
	 * @param {string} username - Username
	 * @param {string} password - Password
	 * @returns {Promise<object>} Response data
	 */
	static async login(username, password) {
		try {
			const response = await fetch(`${ApiClient.BASE_URL}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include', // Important for cookies
				body: JSON.stringify({ username, password })
			});
			
			return await response.json();
		} catch (error) {
			console.error('Login error:', error);
			return {
				success: false,
				error: {
					message: 'Network error during login'
				}
			};
		}
	}

	/**
	 * Sign up new user
	 * @param {string} username - Username
	 * @param {string} password - Password
	 * @returns {Promise<object>} Response data
	 */
	static async signup(username, password) {
		try {
			const response = await fetch(`${ApiClient.BASE_URL}/signup`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ username, password })
			});
			
			return await response.json();
		} catch (error) {
			console.error('Signup error:', error);
			return {
				success: false,
				error: {
					message: 'Network error during signup'
				}
			};
		}
	}

	/**
	 * Logout user
	 * @returns {Promise<object>} Logout response
	 */
	static async logout() {
		try {
			const response = await fetch(`${ApiClient.BASE_URL}/logout`, {
				method: 'GET',
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Logout failed');
			}

			return data;
		} catch (error) {
			console.error('Logout error:', error);
			throw error;
		}
	}

	/**
	 * Delete user account
	 * @returns {Promise<object>} Delete account response
	 */
	static async deleteAccount() {
		try {
			const csrfToken = await this.getCsrfToken();
			
			const response = await fetch(`${ApiClient.BASE_URL}/delete_account`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'CSRF-Token': csrfToken
				},
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Account deletion failed');
			}

			return data;
		} catch (error) {
			console.error('Delete account error:', error);
			throw error;
		}
	}

	/**
	 * Search for points of interest
	 * @param {object} searchData - Search data
	 * @returns {Promise<object>} Search response
	 */
	static async search(searchData) {
		try {
			const response = await fetch(`${ApiClient.BASE_URL}/search`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(searchData),
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				// Special handling for missing API keys
				if (data.error?.code === 'API_KEYS_MISSING') {
					return data;
				}
				throw new Error(data.error?.message || 'Search failed');
			}

			return data;
		} catch (error) {
			console.error('Search error:', error);
			throw error;
		}
	}

	/**
	 * Get user preferences
	 * @returns {Promise<object>} User preferences
	 */
	static async getPreferences() {
		try {
			const response = await fetch(`${ApiClient.BASE_URL}/preferences`, {
				method: 'GET',
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Failed to get preferences');
			}

			return data;
		} catch (error) {
			console.error('Get preferences error:', error);
			throw error;
		}
	}

	/**
	 * Update user preferences
	 * @param {object} preferences - User preferences
	 * @returns {Promise<object>} Update response
	 */
	static async updatePreferences(preferences) {
		try {
			const csrfToken = await this.getCsrfToken();
			
			const response = await fetch(`${ApiClient.BASE_URL}/preferences`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'CSRF-Token': csrfToken
				},
				body: JSON.stringify(preferences),
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Failed to update preferences');
			}

			return data;
		} catch (error) {
			console.error('Update preferences error:', error);
			throw error;
		}
	}

	/**
	 * Get user's saved searches
	 * @returns {Promise<object>} Saved searches
	 */
	static async getSavedSearches() {
		try {
			const response = await fetch(`${ApiClient.BASE_URL}/saved_searches`, {
				method: 'GET',
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Failed to get saved searches');
			}

			return data;
		} catch (error) {
			console.error('Get saved searches error:', error);
			throw error;
		}
	}

	/**
	 * Get a specific saved search
	 * @param {number} id - Search ID
	 * @returns {Promise<ApiResponse>} API response
	 */
	static async getSavedSearch(id) {
		try {
			const response = await fetch(`${ApiClient.BASE_URL}/saved_search/${id}`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Search not found');
			}
			
			return data;
		} catch (error) {
			console.error('Get saved search error:', error);
			throw error;
		}
	}

	/**
	 * Delete a saved search
	 * @param {number} id - Search ID
	 * @returns {Promise<object>} Delete response
	 */
	static async deleteSearch(id) {
		try {
			const csrfToken = await this.getCsrfToken();
			
			const response = await fetch(`${ApiClient.BASE_URL}/delete_search/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'CSRF-Token': csrfToken
				},
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Failed to delete search');
			}

			return data;
		} catch (error) {
			console.error('Delete search error:', error);
			throw error;
		}
	}

	/**
	 * Change user password
	 * @param {string} currentPassword - Current password
	 * @param {string} newPassword - New password
	 * @returns {Promise<object>} Change password response
	 */
	static async changePassword(currentPassword, newPassword) {
		try {
			const csrfToken = await this.getCsrfToken();
			
			const response = await fetch(`${ApiClient.BASE_URL}/change_password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'CSRF-Token': csrfToken
				},
				body: JSON.stringify({
					current_password: currentPassword,
					new_password: newPassword
				}),
				credentials: 'include'
			});

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error?.message || 'Failed to change password');
			}

			return data;
		} catch (error) {
			console.error('Change password error:', error);
			throw error;
		}
	}
}

// Use this:
window.ApiClient = ApiClient; 