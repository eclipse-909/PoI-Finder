/**
 * API Client for interacting with the backend services
 */
class ApiClient {
  constructor() {
    this.baseUrl = '/api';
    this.csrfToken = null;
  }

  /**
   * Get CSRF token for forms
   * @returns {Promise<string>} CSRF token
   */
  async getCsrfToken() {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}/csrf-token`);
      if (!response.ok) {
        throw new Error('Failed to get CSRF token');
      }
      
      const data = await response.json();
      this.csrfToken = data.csrfToken;
      return this.csrfToken;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<object>} Login response
   */
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Sign up a new user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<object>} Signup response
   */
  async signup(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Signup failed');
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @returns {Promise<object>} Logout response
   */
  async logout() {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
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
  async deleteAccount() {
    try {
      const csrfToken = await this.getCsrfToken();
      
      const response = await fetch(`${this.baseUrl}/delete_account`, {
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
  async search(searchData) {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
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
  async getPreferences() {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`, {
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
  async updatePreferences(preferences) {
    try {
      const csrfToken = await this.getCsrfToken();
      
      const response = await fetch(`${this.baseUrl}/preferences`, {
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
  async getSavedSearches() {
    try {
      const response = await fetch(`${this.baseUrl}/saved_searches`, {
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
   * @returns {Promise<object>} Saved search details
   */
  async getSavedSearch(id) {
    try {
      const response = await fetch(`${this.baseUrl}/saved_search/${id}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get saved search');
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
  async deleteSearch(id) {
    try {
      const csrfToken = await this.getCsrfToken();
      
      const response = await fetch(`${this.baseUrl}/delete_search/${id}`, {
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
   * Save a search
   * @param {number} id - Search ID
   * @returns {Promise<object>} Save response
   */
  async saveSearch(id) {
    try {
      const csrfToken = await this.getCsrfToken();
      
      const response = await fetch(`${this.baseUrl}/save_search/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save search');
      }

      return data;
    } catch (error) {
      console.error('Save search error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Change password response
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const csrfToken = await this.getCsrfToken();
      
      const response = await fetch(`${this.baseUrl}/change_password`, {
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

// Create a singleton instance
const api = new ApiClient();

// Export the singleton
window.api = api; 