/**
 * Home page functionality for searching points of interest
 */
const homePage = {
	googleMap: null,
	autocomplete: null,
	markers: [],
	searchResults: null,
	
	/**
	 * Initialize home page
	 */
	init() {
		this.initLocationButtons();
		this.initMap();
	},
	
	/**
	 * Initialize location selection buttons
	 */
	initLocationButtons() {
		const useCurrentLocationBtn = document.getElementById('use-current-location');
		const manualLocationBtn = document.getElementById('manual-location');
		const searchLocationBtn = document.getElementById('search-location');
		const saveResultsBtn = document.getElementById('save-results');
		
		if (useCurrentLocationBtn) {
			useCurrentLocationBtn.addEventListener('click', this.handleCurrentLocation.bind(this));
		}
		
		if (manualLocationBtn) {
			manualLocationBtn.addEventListener('click', this.handleManualLocation.bind(this));
		}
		
		if (searchLocationBtn) {
			searchLocationBtn.addEventListener('click', this.handleSearch.bind(this));
		}
		
		if (saveResultsBtn) {
			saveResultsBtn.addEventListener('click', this.handleSaveResults.bind(this));
		}
	},
	
	/**
	 * Initialize Google Maps
	 */
	initMap() {
		// If Google Maps API is not loaded yet, wait for it
		if (!window.google || !window.google.maps) {
			// Load Google Maps API dynamically
			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${this.getGoogleMapsApiKey()}&libraries=places`;
			script.async = true;
			script.defer = true;
			script.onload = () => this.setupMap();
			
			// Add script to the end of index.html
			const scriptTags = document.getElementsByTagName('script');
			const lastScript = scriptTags[scriptTags.length - 1];
			lastScript.parentNode.replaceChild(script, lastScript);
		} else {
			this.setupMap();
		}
	},
	
	/**
	 * Get Google Maps API key from meta tag
	 * The actual key would be set in the server before sending the page
	 */
	getGoogleMapsApiKey() {
		const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
		return metaTag ? metaTag.content : '';
	},
	
	/**
	 * Setup Google Maps after API is loaded
	 */
	setupMap() {
		const mapContainer = document.getElementById('map-container');
		
		if (!mapContainer) {
			return;
		}
		
		// Create map with default center
		this.googleMap = new google.maps.Map(mapContainer, {
			center: { lat: 40.7128, lng: -74.0060 }, // New York by default
			zoom: 12,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: false
		});
		
		// Setup autocomplete for location input
		const input = document.getElementById('location-input');
		
		if (input) {
			this.autocomplete = new google.maps.places.Autocomplete(input);
			this.autocomplete.bindTo('bounds', this.googleMap);
			
			// When a place is selected from the dropdown
			this.autocomplete.addListener('place_changed', () => {
				const place = this.autocomplete.getPlace();
				
				if (!place.geometry) {
					return;
				}
				
				// Clear existing markers
				this.clearMarkers();
				
				// Center map on selected place
				if (place.geometry.viewport) {
					this.googleMap.fitBounds(place.geometry.viewport);
				} else {
					this.googleMap.setCenter(place.geometry.location);
					this.googleMap.setZoom(17);
				}
				
				// Add marker for selected place
				this.addMarker(place.geometry.location, place.name);
			});
		}
		
		// Allow clicking on map to select location
		this.googleMap.addListener('click', (event) => {
			// Clear existing markers
			this.clearMarkers();
			
			// Add marker at clicked location
			this.addMarker(event.latLng);
			
			// Get address for clicked location and update input
			this.getAddressFromLatLng(event.latLng);
		});
	},
	
	/**
	 * Add a marker to the map
	 * @param {google.maps.LatLng} position - Marker position
	 * @param {string} title - Marker title
	 */
	addMarker(position, title = 'Selected Location') {
		const marker = new google.maps.Marker({
			position,
			map: this.googleMap,
			title,
			animation: google.maps.Animation.DROP
		});
		
		this.markers.push(marker);
		return marker;
	},
	
	/**
	 * Clear all markers from the map
	 */
	clearMarkers() {
		this.markers.forEach(marker => marker.setMap(null));
		this.markers = [];
	},
	
	/**
	 * Get address from latitude and longitude
	 * @param {google.maps.LatLng} latLng - Location coordinates
	 */
	getAddressFromLatLng(latLng) {
		const geocoder = new google.maps.Geocoder();
		
		geocoder.geocode({ location: latLng }, (results, status) => {
			if (status === 'OK' && results[0]) {
				const input = document.getElementById('location-input');
				if (input) {
					input.value = results[0].formatted_address;
				}
			}
		});
	},
	
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
				this.handleManualLocation();
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
		const locationInput = document.getElementById('location-input');
		
		if (!locationInput || !locationInput.value.trim()) {
			alert('Please enter a location');
			return;
		}
		
		// Show searching container
		document.getElementById('manual-location-container').classList.add('hidden');
		document.getElementById('searching-container').classList.remove('hidden');
		document.getElementById('results-container').classList.add('hidden');
		
		// Perform search with entered location
		this.performSearch({
			location: locationInput.value.trim()
		});
	},
	
	/**
	 * Perform search for points of interest
	 * @param {object} searchData - Search data
	 */
	async performSearch(searchData) {
		try {
			// Call API to search for points of interest
			const response = await window.api.search(searchData);
			
			if (response.success) {
				this.searchResults = response.data;
				this.displayResults(response.data);
			} else {
				alert(response.error?.message || 'Search failed');
				document.getElementById('searching-container').classList.add('hidden');
				document.getElementById('manual-location-container').classList.remove('hidden');
			}
		} catch (error) {
			console.error('Search error:', error);
			alert(error.message || 'Search failed');
			document.getElementById('searching-container').classList.add('hidden');
			document.getElementById('manual-location-container').classList.remove('hidden');
		}
	},
	
	/**
	 * Display search results
	 * @param {object} data - Search results data
	 */
	displayResults(data) {
		const resultsContainer = document.getElementById('results-container');
		const poiResults = document.getElementById('poi-results');
		const saveStatus = document.getElementById('save-status');
		
		// Hide searching container
		document.getElementById('searching-container').classList.add('hidden');
		
		// Clear previous results
		poiResults.innerHTML = '';
		saveStatus.classList.add('hidden');
		saveStatus.textContent = '';
		
		// Create POI cards for each result
		if (data.pointsOfInterest && data.pointsOfInterest.length > 0) {
			data.pointsOfInterest.forEach(poi => {
				const poiCard = this.createPoiCard(poi);
				poiResults.appendChild(poiCard);
			});
		} else {
			// No results found
			poiResults.innerHTML = '<p class="no-results">No points of interest found for this location</p>';
		}
		
		// Show results container
		resultsContainer.classList.remove('hidden');
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
		
		// Route info
		if (poi.route) {
			const routeDetail = document.createElement('div');
			routeDetail.className = 'poi-detail';
			
			const routeLabel = document.createElement('span');
			routeLabel.className = 'poi-detail-label';
			routeLabel.textContent = 'Travel:';
			
			const routeValue = document.createElement('span');
			routeValue.className = 'poi-detail-value';
			routeValue.textContent = `${poi.route.distance} (${poi.route.duration})`;
			
			routeDetail.appendChild(routeLabel);
			routeDetail.appendChild(routeValue);
			details.appendChild(routeDetail);
		}
		
		content.appendChild(details);
		card.appendChild(content);
		
		return card;
	},
	
	/**
	 * Handle saving search results
	 */
	async handleSaveResults() {
		if (!this.searchResults || !this.searchResults.searchId) {
			alert('No search results to save');
			return;
		}
		
		try {
			const saveStatus = document.getElementById('save-status');
			const saveButton = document.getElementById('save-results');
			
			// Disable button during save
			saveButton.disabled = true;
			saveButton.textContent = 'Saving...';
			
			// Call API to save search
			const response = await window.api.saveSearch(this.searchResults.searchId);
			
			if (response.success) {
				saveStatus.textContent = 'Search saved successfully';
				saveStatus.classList.remove('hidden');
				
				// Change button text
				saveButton.textContent = 'Saved';
			} else {
				alert(response.error?.message || 'Failed to save search');
				saveButton.disabled = false;
				saveButton.textContent = 'Save This List';
			}
		} catch (error) {
			console.error('Save search error:', error);
			alert(error.message || 'Failed to save search');
			
			const saveButton = document.getElementById('save-results');
			saveButton.disabled = false;
			saveButton.textContent = 'Save This List';
		}
	}
};

// Export the module
window.homePage = homePage; 