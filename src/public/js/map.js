let map;
let marker;
let infoWindow;
let geocoder;
let center = { lat: 40.749933, lng: -73.98633 }; // New York City

document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('manual-location').addEventListener('click', () => window.homePage.handleManualLocation());
});

// Function to initialize the map
async function initMap() {
    try {
        // Wait for the Google Maps API to be available
        if (typeof google === 'undefined') {
            throw new Error('Google Maps API not loaded');
        }

        // Request needed libraries.
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
            google.maps.importLibrary("marker"),
            google.maps.importLibrary("places")
        ]);

        // Initialize the map.
        map = new google.maps.Map(document.getElementById('map'), { // BUG: if the document is not ready, the map will be null
            center,
            zoom: 13,
            mapId: '4504f8b37365c3d0',
            mapTypeControl: false,
            streetViewControl: false
        });

        // Initialize the geocoder
        geocoder = new google.maps.Geocoder();

        // Initialize the autocomplete
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
        placeAutocomplete.id = 'place-autocomplete-input';
        placeAutocomplete.locationBias = center;

        const card = document.getElementById('place-autocomplete-card');
        if (card) {
            card.appendChild(placeAutocomplete);
        }

        // Create the marker and infowindow
        marker = new google.maps.marker.AdvancedMarkerElement({
            map,
        });
        infoWindow = new google.maps.InfoWindow({});

        // Add the gmp-placeselect listener, and display the results on the map.
        placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
            
            // If the place has a geometry, then present it on a map.
            if (place.viewport) {
                map.fitBounds(place.viewport);
            } else {
                map.setCenter(place.location);
                map.setZoom(17);
            }

            let content = '<div id="infowindow-content">' +
                '<span id="place-displayname" class="title">' + place.displayName + '</span><br />' +
                '<span id="place-address">' + place.formattedAddress + '</span>' +
                '</div>';
            updateInfoWindow(content, place.location);
            marker.position = place.location;
        });

        // Add click event listener to the map
        map.addListener('click', (event) => {
            const latLng = event.latLng;
            geocodeLatLng(latLng);
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
            alert('Please disable your ad blocker to use the map feature. The map requires access to Google Maps services to function properly.');
        } else if (error.message.includes('Google Maps API not loaded')) {
            // Don't show an alert for this error as it's expected during initial load
            console.log('Waiting for Google Maps API to load...');
        } else {
            alert('Error loading map. Please try refreshing the page.');
        }
    }
}

// Function to perform reverse geocoding
function geocodeLatLng(latLng) {
    geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK') {
            if (results[0]) {
                marker.position = latLng;

                const address = results[0].formatted_address;
                infoWindow.setContent(address);
                infoWindow.open(map, marker);

				// If address is valid, then update the address input field.
                // I noticed that uninhabited areas have a + in the address.
                // We can just check if the address doesn't contain a +.
                if (!address.includes('+')) {
                    document.getElementById('place-autocomplete-input').Eg.value = address;
                }
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}

// Helper function to create an info window.
function updateInfoWindow(content, center) {
    infoWindow.setContent(content);
    infoWindow.setPosition(center);
    infoWindow.open({
        map,
        anchor: marker,
        shouldFocus: false,
    });
}