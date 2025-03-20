/**
 * Main application initialization
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('POI Finder initialized');
  
  // Set meta tag for Google Maps API key
  addGoogleMapsApiKeyMeta();
  
  // Initialize debouncing for inputs
  initDebouncing();
  
  // Add Google Maps API script
  loadGoogleMapsApi();
});

/**
 * Add meta tag for Google Maps API key
 * This will be set by the server before sending the page
 */
function addGoogleMapsApiKeyMeta() {
  const meta = document.createElement('meta');
  meta.name = 'google-maps-api-key';
  // This value will be replaced by the server with the actual API key
  meta.content = '%%GOOGLE_MAPS_API_KEY%%';
  document.head.appendChild(meta);
}

/**
 * Initialize debouncing for search inputs
 */
function initDebouncing() {
  // Utility function to create a debounced version of a function
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };
  
  // Apply debounce to search input when it's available
  window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('location-input');
    
    if (searchInput) {
      const originalListener = searchInput.oninput;
      searchInput.oninput = debounce((event) => {
        if (originalListener) {
          originalListener(event);
        }
      }, 300);
    }
  });
}

/**
 * Load Google Maps API dynamically
 */
function loadGoogleMapsApi() {
  // Check if loaded from home page
  if (window.homePage && typeof window.homePage.initMap === 'function') {
    return;
  }
  
  // Add script to the end of index.html
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=%%GOOGLE_MAPS_API_KEY%%&libraries=places`;
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
}

/**
 * Handle errors gracefully
 * @param {Error} error - The error to handle
 */
window.handleError = (error) => {
  console.error('Application error:', error);
  
  // Check if the error is due to network issues
  if (error instanceof TypeError && error.message.includes('fetch')) {
    alert('Network error. Please check your internet connection and try again.');
  } else if (error.message.includes('API')) {
    // API error
    alert(`API error: ${error.message}`);
  } else {
    // Generic error
    alert('An error occurred. Please try again later.');
  }
};

/**
 * Add caching for API responses
 */
window.apiCache = {
  cache: {},
  
  // Set a cache item with expiration
  set(key, value, expirationMinutes = 5) {
    const expirationMs = expirationMinutes * 60 * 1000;
    const expires = Date.now() + expirationMs;
    
    this.cache[key] = {
      value,
      expires
    };
  },
  
  // Get a cache item if valid
  get(key) {
    const item = this.cache[key];
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      delete this.cache[key];
      return null;
    }
    
    return item.value;
  },
  
  // Clear cache
  clear() {
    this.cache = {};
  }
};

/**
 * Add retry logic for API calls
 * @param {Function} fn - The function to call
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} - Promise resolving to the function result
 */
window.retryApi = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return window.retryApi(fn, retries - 1, delay * 2);
  }
}; 