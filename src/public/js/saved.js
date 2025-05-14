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
			const response = await window.ApiClient.getSavedSearches();
			
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
		card.dataset.id = search.search_id;
		
		const info = document.createElement('div');
		info.className = 'saved-search-info';
		
		const location = document.createElement('div');
		location.className = 'saved-search-location';
		location.textContent = `${search.latitude.toFixed(4)}, ${search.longitude.toFixed(4)}`;
		
		const date = document.createElement('div');
		date.className = 'saved-search-date';
		date.textContent = new Date(search.date).toLocaleString();
		
		const count = document.createElement('div');
		count.className = 'saved-search-count';
		count.textContent = `${search.poi_count} points of interest`;
		
		info.appendChild(location);
		info.appendChild(date);
		info.appendChild(count);
		card.appendChild(info);
		
		// Click handler for card
		card.addEventListener('click', () => {
			// Show the saved search detail view
			document.getElementById('saved-searches').classList.add('hidden');
			
			// Create and show the detail view if it doesn't exist
			let detailView = document.getElementById('saved-detail');
			if (!detailView) {
				detailView = document.createElement('div');
				detailView.id = 'saved-detail';
				detailView.className = 'saved-detail';
				
				// Add back button
				const backButton = document.createElement('button');
				backButton.id = 'back-to-saved';
				backButton.className = 'btn';
				backButton.textContent = 'Back to Saved Searches';
				backButton.addEventListener('click', () => {
					this.currentSearchId = null;
					document.getElementById('saved-detail').classList.add('hidden');
					document.getElementById('saved-searches').classList.remove('hidden');
				});
				
				// Add delete button
				const deleteButton = document.createElement('button');
				deleteButton.id = 'delete-saved-search';
				deleteButton.className = 'btn btn-danger';
				deleteButton.textContent = 'Delete Search';
				deleteButton.addEventListener('click', this.handleDeleteSearch.bind(this));
				
				// Add header
				const header = document.createElement('div');
				header.className = 'saved-detail-header';
				header.appendChild(backButton);
				header.appendChild(deleteButton);
				
				// Add location and date
				const locationElement = document.createElement('h3');
				locationElement.id = 'saved-detail-location';
				
				const dateElement = document.createElement('p');
				dateElement.id = 'saved-detail-date';
				
				// Add POI list container
				const poiList = document.createElement('div');
				poiList.id = 'saved-detail-poi-list';
				
				detailView.appendChild(header);
				detailView.appendChild(locationElement);
				detailView.appendChild(dateElement);
				detailView.appendChild(poiList);
				
				document.getElementById('saved-content').appendChild(detailView);
			}
			
			// Show the detail view
			detailView.classList.remove('hidden');
			
			// Load the search details
			this.loadSavedSearch(search.search_id);
		});
		
		return card;
	},
	
	/**
	 * Load a specific saved search
	 * @param {number} id - Search ID
	 */
	async loadSavedSearch(id) {
		try {
			this.currentSearchId = id;
			const poiListContainer = document.getElementById('saved-detail-poi-list');
			const locationElement = document.getElementById('saved-detail-location');
			const dateElement = document.getElementById('saved-detail-date');
			
			if (!poiListContainer || !locationElement || !dateElement) {
				return;
			}
			
			// Show loading state
			poiListContainer.innerHTML = '<div class="loading-spinner"></div>';
			
			// Call API to get saved search
			const response = await window.ApiClient.getSavedSearch(id);
			
			if (response.success && response.data) {
				const searchData = response.data;
				
				// Update location and date
				locationElement.textContent = `Points of Interest in ${searchData.location.latitude.toFixed(4)}, ${searchData.location.longitude.toFixed(4)}`;
				dateElement.textContent = `Date: ${new Date(searchData.date).toLocaleString()}`;
				
				// Clear loading state
				poiListContainer.innerHTML = '';
				
				if (!searchData.pointsOfInterest || searchData.pointsOfInterest.length === 0) {
					poiListContainer.innerHTML = '<p class="no-results">No points of interest in this search.</p>';
					return;
				}
				
				// Create POI cards
				searchData.pointsOfInterest.forEach(async (poi) => {
					const poiCard = await this.createPoiCard(poi);
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
	async createPoiCard(poi) {
		const card = document.createElement('div');
		card.className = 'poi-card';
		
		// Image container with attribution
		if (poi.poi.photos && poi.poi.photos.length > 0) {
			// Create image container
			const imageContainer = document.createElement('div');
			imageContainer.className = 'poi-image-container';
			
			// Create image element
			const img = document.createElement('img');
			img.className = 'poi-image';
			img.alt = poi.poi.displayName.text;
			img.style.objectFit = 'contain'; // Preserve aspect ratio
			img.style.maxHeight = '200px'; // Set maximum height
			
			// Current photo index
			let currentPhotoIndex = 0;
			const photos = poi.poi.photos;
			
			// Function to update the displayed photo
			const updatePhoto = async () => {
				const photo = photos[currentPhotoIndex];
				
				// Wait for the Places library to be loaded
				const { Photo } = await google.maps.importLibrary("places");
				
				// Use the getURI method of the photo to get the image source
				const p = new Photo(photo);
				img.src = p.getURI({ maxHeight: 200 });
				
				if (photo.authorAttributions && photo.authorAttributions.length > 0) {
					// Update attribution
					const attribution = imageContainer.querySelector('.poi-image-attribution');
					if (attribution) {
						attribution.href = photo.authorAttributions[0].uri;
						attribution.textContent = photo.authorAttributions[0].displayName;
					}
				}
				
				// Update navigation buttons state
				prevButton.style.opacity = currentPhotoIndex > 0 ? '1' : '0.3';
				nextButton.style.opacity = currentPhotoIndex < photos.length - 1 ? '1' : '0.3';
			};
			
			// Create left arrow button
			const prevButton = document.createElement('button');
			prevButton.className = 'photo-nav-button photo-nav-prev';
			prevButton.innerHTML = '&#10094;'; // Left arrow
			prevButton.addEventListener('click', (e) => {
				e.stopPropagation(); // Prevent card click
				if (currentPhotoIndex > 0) {
					currentPhotoIndex--;
					updatePhoto();
				}
			});
			
			// Create right arrow button
			const nextButton = document.createElement('button');
			nextButton.className = 'photo-nav-button photo-nav-next';
			nextButton.innerHTML = '&#10095;'; // Right arrow
			nextButton.addEventListener('click', (e) => {
				e.stopPropagation(); // Prevent card click
				if (currentPhotoIndex < photos.length - 1) {
					currentPhotoIndex++;
					updatePhoto();
				}
			});
			
			// Create attribution container
			const attributionContainer = document.createElement('div');
			attributionContainer.className = 'poi-image-attribution-container';
			
			if (photos[0].authorAttributions && photos[0].authorAttributions.length > 0) {
				// Create attribution link
				const attribution = document.createElement('a');
				attribution.className = 'poi-image-attribution';
				attribution.href = photos[0].authorAttributions[0].uri;
				attribution.target = '_blank';
				attribution.textContent = photos[0].authorAttributions[0].displayName;
				
				// Add attribution to container
				attributionContainer.appendChild(attribution);
			}
			
			// Add image to container
			imageContainer.appendChild(img);
			imageContainer.appendChild(attributionContainer);
			
			// Add navigation buttons if there are multiple photos
			if (photos.length > 1) {
				imageContainer.appendChild(prevButton);
				imageContainer.appendChild(nextButton);
				
				// Initialize button states
				prevButton.style.opacity = '0.3'; // Disabled initially (first photo)
				nextButton.style.opacity = photos.length > 1 ? '1' : '0.3';
			}
			
			// Add image container to card
			card.appendChild(imageContainer);
			
			// Set the initial image
			await updatePhoto();
		}
		
		// Content
		const content = document.createElement('div');
		content.className = 'poi-content';
		
		// Name
		const name = document.createElement('h3');
		name.className = 'poi-name';
		name.textContent = poi.poi.displayName.text;
		content.appendChild(name);
		
		// Description
		if (poi.poi.editorialSummary) {
			const description = document.createElement('p');
			description.className = 'poi-description';
			description.textContent = poi.poi.editorialSummary.text;
			content.appendChild(description);
		}
		
		// Details
		const details = document.createElement('div');
		details.className = 'poi-details';
		
		// Website link if available
		if (poi.poi.websiteUri) {
			const websiteDetail = document.createElement('div');
			websiteDetail.className = 'poi-detail';
			
			const websiteLabel = document.createElement('span');
			websiteLabel.className = 'poi-detail-label';
			websiteLabel.textContent = 'Website:';
			
			const websiteValue = document.createElement('a');
			websiteValue.className = 'poi-detail-value';
			websiteValue.href = poi.poi.websiteUri;
			websiteValue.target = '_blank';
			websiteValue.textContent = 'Visit website';
			
			websiteDetail.appendChild(websiteLabel);
			websiteDetail.appendChild(websiteValue);
			details.appendChild(websiteDetail);
		}
		
		// Address
		if (poi.poi.formattedAddress) {
			const addressDetail = document.createElement('div');
			addressDetail.className = 'poi-detail';
			
			const addressLabel = document.createElement('span');
			addressLabel.className = 'poi-detail-label';
			addressLabel.textContent = 'Address:';
			
			const addressValue = document.createElement('span');
			addressValue.className = 'poi-detail-value';
			addressValue.textContent = poi.poi.formattedAddress;
			
			addressDetail.appendChild(addressLabel);
			addressDetail.appendChild(addressValue);
			details.appendChild(addressDetail);
		}
		
		// Arrival Time
		const arrivalDetail = document.createElement('div');
		arrivalDetail.className = 'poi-detail';
		
		const arrivalLabel = document.createElement('span');
		arrivalLabel.className = 'poi-detail-label';
		arrivalLabel.textContent = 'Arrival Time:';
		
		const arrivalValue = document.createElement('span');
		arrivalValue.className = 'poi-detail-value';
		arrivalValue.textContent = new Date(poi.arrivalTime).toLocaleTimeString();
		
		arrivalDetail.appendChild(arrivalLabel);
		arrivalDetail.appendChild(arrivalValue);
		details.appendChild(arrivalDetail);
		
		// Route Duration
		const routeDetail = document.createElement('div');
		routeDetail.className = 'poi-detail';
		
		const routeLabel = document.createElement('span');
		routeLabel.className = 'poi-detail-label';
		routeLabel.textContent = 'Travel Time:';
		
		const routeValue = document.createElement('span');
		routeValue.className = 'poi-detail-value';
		const duration = Math.ceil(Number.parseInt(poi.routeDuration.replace('s','')) / 600) * 10;
		routeValue.textContent = `${duration} minutes by ${poi.modeOfTransport}`;
		
		routeDetail.appendChild(routeLabel);
		routeDetail.appendChild(routeValue);
		details.appendChild(routeDetail);
		
		// Weather
		if (poi.weatherCondition) {
			const weatherDetail = document.createElement('div');
			weatherDetail.className = 'poi-detail';
			
			const weatherLabel = document.createElement('span');
			weatherLabel.className = 'poi-detail-label';
			weatherLabel.textContent = 'Weather:';
			
			const weatherValue = document.createElement('span');
			weatherValue.className = 'poi-detail-value';
			weatherValue.textContent = poi.weatherCondition.description.text;
			
			weatherDetail.appendChild(weatherLabel);
			weatherDetail.appendChild(weatherValue);
			details.appendChild(weatherDetail);
			
			// Add weather icon if available
			if (poi.weatherCondition.iconBaseUri) {
				const weatherIcon = document.createElement('img');
				weatherIcon.src = poi.weatherCondition.iconBaseUri + '.svg';
				weatherIcon.alt = poi.weatherCondition.description.text;
				weatherIcon.className = 'weather-icon';
				weatherDetail.appendChild(weatherIcon);
			}
		}
		
	// Temperature
	if (poi.temperature) {
		const tempDetail = document.createElement('div');
		tempDetail.className = 'poi-detail';
		
		const tempLabel = document.createElement('span');
		tempLabel.className = 'poi-detail-label';
		tempLabel.textContent = 'Temperature:';
		
		const tempValue = document.createElement('span');
		tempValue.className = 'poi-detail-value';
		tempValue.textContent = `${poi.temperature.degrees}°${poi.temperature.unit}`;
		
		tempDetail.appendChild(tempLabel);
		tempDetail.appendChild(tempValue);
		details.appendChild(tempDetail);
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
		const response = await window.ApiClient.deleteSearch(this.currentSearchId);
		
		if (response.success) {
			// Navigate back to saved searches list
			this.currentSearchId = null;
			document.getElementById('saved-detail').classList.add('hidden');
			document.getElementById('saved-searches').classList.remove('hidden');
			this.loadSavedSearches();
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