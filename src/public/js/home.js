/**
 * Home page functionality for searching points of interest
 */
const homePage = {
	searchResults: null,

	/**
	 * Handle using current location
	 */
	handleCurrentLocation() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser');
			return;
		}
		
		// Show searching container
		document.getElementById('manual-location-container').classList.add('hidden');
		document.getElementById('searching-container').classList.remove('hidden');
		document.getElementById('results-container').classList.add('hidden');
		
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				
				// Search using current location
				this.performSearch({
					useCurrentLocation: true,
					latitude,
					longitude
				});
			},
			(error) => {
				console.error('Geolocation error:', error);
				alert('Unable to get your location. Please try entering it manually.');
				
				// Hide searching container and show manual input
				document.getElementById('searching-container').classList.add('hidden');
			}
		);
	},
	
	/**
	 * Handle manual location input
	 */
	handleManualLocation() {
		document.getElementById('manual-location-container').classList.remove('hidden');
		document.getElementById('searching-container').classList.add('hidden');
		document.getElementById('results-container').classList.add('hidden');
	},
	
	/**
	 * Handle search button click
	 */
	handleSearch() {
		const locationInput = document.getElementById('place-autocomplete-input').Eg;
		
		if (!locationInput || locationInput.value.trim() === '') {
			alert('Please enter a location');
			return;
		}
		
		// Show searching container
		document.getElementById('manual-location-container').classList.add('hidden');
		document.getElementById('searching-container').classList.remove('hidden');
		document.getElementById('results-container').classList.add('hidden');
		
		// Perform search with entered location
		this.performSearch({
			latitude: marker.position.lat,
			longitude: marker.position.lng
		});
	},
	
	/**
	 * Perform search for points of interest
	 * @param {object} searchData - Search data
	 */
	async performSearch(searchData) {
		try {
			// Call API to search for points of interest
			const response = await window.ApiClient.search(searchData);
			
			if (response.success) {
				// Hide searching container
				document.getElementById('searching-container').classList.add('hidden');
				
				// Switch to saved tab
				const savedTab = document.querySelector('.tab-item[data-tab="saved"]');
				if (savedTab) {
					savedTab.click();
				}
				
				// Initialize saved page with the new search ID
				if (window.savedPage && typeof window.savedPage.initDetail === 'function') {
					window.savedPage.initDetail(response.data.searchId);
				}
			} else {
				// Hide loading UI
				document.getElementById('searching-container').classList.add('hidden');
				
				// Show appropriate error
				if (response.error?.code === 'API_KEYS_MISSING') {
					alert('This application is running in debug mode without required API keys (Google Maps and Google Gemini). Search functionality is disabled.');
				} else {
					alert(response.error?.message || 'Search failed');
				}
			}
		} catch (error) {
			console.error('Search error:', error);
			
			// Show appropriate error and UI
			document.getElementById('searching-container').classList.add('hidden');
			alert(error.message || 'Search failed');
		}
	}
};

document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('use-current-location').addEventListener('click', () => homePage.handleCurrentLocation());
	document.getElementById('manual-location').addEventListener('click', () => homePage.handleManualLocation());
});

// Export the module
window.homePage = homePage; 