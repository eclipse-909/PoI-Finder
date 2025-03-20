/**
 * Saved searches page functionality
 */
const savedPage = {
  savedSearches: [],
  currentSearchId: null,
  
  /**
   * Initialize saved searches page
   */
  init() {
    this.loadSavedSearches();
  },
  
  /**
   * Initialize saved search detail page
   * @param {number} id - Search ID
   */
  initDetail(id) {
    this.currentSearchId = id;
    this.loadSavedSearch(id);
    
    // Set up back button
    const backButton = document.getElementById('back-to-saved');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.router.navigate('saved');
      });
    }
    
    // Set up delete button
    const deleteButton = document.getElementById('delete-saved-search');
    if (deleteButton) {
      deleteButton.addEventListener('click', this.handleDeleteSearch.bind(this));
    }
  },
  
  /**
   * Load saved searches
   */
  async loadSavedSearches() {
    try {
      const savedSearchesContainer = document.getElementById('saved-searches');
      
      if (!savedSearchesContainer) {
        return;
      }
      
      // Show loading state
      savedSearchesContainer.innerHTML = '<div class="loading-spinner"></div>';
      
      // Call API to get saved searches
      const response = await window.api.getSavedSearches();
      
      if (response.success && response.data) {
        this.savedSearches = response.data;
        
        // Clear loading state
        savedSearchesContainer.innerHTML = '';
        
        if (this.savedSearches.length === 0) {
          savedSearchesContainer.innerHTML = '<p class="no-results">You have no saved searches yet.</p>';
          return;
        }
        
        // Create saved search cards
        this.savedSearches.forEach(search => {
          const searchCard = this.createSavedSearchCard(search);
          savedSearchesContainer.appendChild(searchCard);
        });
      } else {
        savedSearchesContainer.innerHTML = '<p class="error">Failed to load saved searches.</p>';
      }
    } catch (error) {
      console.error('Load saved searches error:', error);
      const savedSearchesContainer = document.getElementById('saved-searches');
      if (savedSearchesContainer) {
        savedSearchesContainer.innerHTML = '<p class="error">Failed to load saved searches.</p>';
      }
    }
  },
  
  /**
   * Create a saved search card element
   * @param {object} search - Saved search data
   * @returns {HTMLElement} Saved search card element
   */
  createSavedSearchCard(search) {
    const card = document.createElement('div');
    card.className = 'saved-search-card';
    card.dataset.id = search.id;
    
    const info = document.createElement('div');
    info.className = 'saved-search-info';
    
    const location = document.createElement('div');
    location.className = 'saved-search-location';
    location.textContent = search.location;
    
    const date = document.createElement('div');
    date.className = 'saved-search-date';
    date.textContent = new Date(search.date).toLocaleString();
    
    const count = document.createElement('div');
    count.className = 'saved-search-count';
    count.textContent = `${search.count} points of interest`;
    
    info.appendChild(location);
    info.appendChild(date);
    info.appendChild(count);
    card.appendChild(info);
    
    // Click handler for card
    card.addEventListener('click', () => {
      window.router.navigate('saved-detail', { id: search.id });
    });
    
    return card;
  },
  
  /**
   * Load a specific saved search
   * @param {number} id - Search ID
   */
  async loadSavedSearch(id) {
    try {
      const poiListContainer = document.getElementById('saved-detail-poi-list');
      const locationElement = document.getElementById('saved-detail-location');
      const dateElement = document.getElementById('saved-detail-date');
      
      if (!poiListContainer || !locationElement || !dateElement) {
        return;
      }
      
      // Show loading state
      poiListContainer.innerHTML = '<div class="loading-spinner"></div>';
      
      // Call API to get saved search
      const response = await window.api.getSavedSearch(id);
      
      if (response.success && response.data) {
        const searchData = response.data;
        
        // Update location and date
        locationElement.textContent = `Points of Interest in ${searchData.location}`;
        dateElement.textContent = `Date: ${new Date(searchData.date).toLocaleString()}`;
        
        // Clear loading state
        poiListContainer.innerHTML = '';
        
        if (!searchData.pointsOfInterest || searchData.pointsOfInterest.length === 0) {
          poiListContainer.innerHTML = '<p class="no-results">No points of interest in this search.</p>';
          return;
        }
        
        // Create POI cards
        searchData.pointsOfInterest.forEach(poi => {
          const poiCard = this.createPoiCard(poi);
          poiListContainer.appendChild(poiCard);
        });
      } else {
        poiListContainer.innerHTML = '<p class="error">Failed to load search details.</p>';
      }
    } catch (error) {
      console.error('Load saved search error:', error);
      const poiListContainer = document.getElementById('saved-detail-poi-list');
      if (poiListContainer) {
        poiListContainer.innerHTML = '<p class="error">Failed to load search details.</p>';
      }
    }
  },
  
  /**
   * Create a POI card element
   * @param {object} poi - Point of interest data
   * @returns {HTMLElement} POI card element
   */
  createPoiCard(poi) {
    const card = document.createElement('div');
    card.className = 'poi-card';
    
    // Image
    if (poi.image_url) {
      const img = document.createElement('img');
      img.src = poi.image_url;
      img.alt = poi.name;
      img.className = 'poi-image';
      card.appendChild(img);
    }
    
    // Content
    const content = document.createElement('div');
    content.className = 'poi-content';
    
    // Name
    const name = document.createElement('h3');
    name.className = 'poi-name';
    name.textContent = poi.name;
    content.appendChild(name);
    
    // Description
    const description = document.createElement('p');
    description.className = 'poi-description';
    description.textContent = poi.description;
    content.appendChild(description);
    
    // Details
    const details = document.createElement('div');
    details.className = 'poi-details';
    
    // Address
    if (poi.address) {
      const addressDetail = document.createElement('div');
      addressDetail.className = 'poi-detail';
      
      const addressLabel = document.createElement('span');
      addressLabel.className = 'poi-detail-label';
      addressLabel.textContent = 'Address:';
      
      const addressValue = document.createElement('span');
      addressValue.className = 'poi-detail-value';
      addressValue.textContent = poi.address;
      
      addressDetail.appendChild(addressLabel);
      addressDetail.appendChild(addressValue);
      details.appendChild(addressDetail);
    }
    
    // Transport mode
    if (poi.mode_of_transport) {
      const transportDetail = document.createElement('div');
      transportDetail.className = 'poi-detail';
      
      const transportLabel = document.createElement('span');
      transportLabel.className = 'poi-detail-label';
      transportLabel.textContent = 'Transport:';
      
      const transportValue = document.createElement('span');
      transportValue.className = 'poi-detail-value';
      transportValue.textContent = poi.mode_of_transport.charAt(0).toUpperCase() + poi.mode_of_transport.slice(1);
      
      transportDetail.appendChild(transportLabel);
      transportDetail.appendChild(transportValue);
      details.appendChild(transportDetail);
    }
    
    content.appendChild(details);
    card.appendChild(content);
    
    return card;
  },
  
  /**
   * Handle deleting a saved search
   */
  async handleDeleteSearch() {
    if (!this.currentSearchId) {
      alert('No search selected');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this search?')) {
      return;
    }
    
    try {
      // Call API to delete search
      const response = await window.api.deleteSearch(this.currentSearchId);
      
      if (response.success) {
        // Navigate back to saved searches list
        window.router.navigate('saved');
      } else {
        alert(response.error?.message || 'Failed to delete search');
      }
    } catch (error) {
      console.error('Delete search error:', error);
      alert(error.message || 'Failed to delete search');
    }
  }
};

// Export the module
window.savedPage = savedPage; 