/**
 * Preferences page functionality
 */
const preferencesPage = {
	formChanged: false,
	
	/**
	 * Initialize preferences page
	 */
	init() {
		this.formChanged = false;
		this.loadPreferences();
		
		// Initialize button state
		const submitButton = document.querySelector('#preferences-form button[type="submit"]');
		if (submitButton) {
			submitButton.disabled = true;
		}
	},
	
	/**
	 * Load user preferences
	 */
	async loadPreferences() {
		try {
			const form = document.getElementById('preferences-form');
			
			if (!form) {
				return;
			}
			
			// Show loading
			form.classList.add('loading');
			const submitButton = form.querySelector('button[type="submit"]');
			if (submitButton) {
				submitButton.disabled = true;
			}
			
			// Call API to get preferences
			const response = await window.ApiClient.getPreferences();
			
			// Hide loading
			form.classList.remove('loading');
			
			// Reset form changed state after loading preferences
			this.formChanged = false;
			if (submitButton) {
				submitButton.disabled = true;
			}
			
			if (response.success && response.data) {
				const preferences = response.data;
				
				// Update form values
				const modeSelect = document.getElementById('mode-of-transport');
				const eatOutCheckbox = document.getElementById('eat-out');
				const wakeUpInput = document.getElementById('wake-up');
				const homeByInput = document.getElementById('home-by');
				const startDateInput = document.getElementById('start-date');
				const endDateInput = document.getElementById('end-date');
				const rangeInput = document.getElementById('range');
				const rangeValue = document.getElementById('range-value');
				const contextInput = document.getElementById('context');
				
				if (modeSelect) {
					modeSelect.value = preferences.mode_of_transport;
				}
				
				if (eatOutCheckbox) {
					eatOutCheckbox.checked = preferences.eat_out;
				}
				
				if (wakeUpInput && preferences.wake_up) {
					wakeUpInput.value = preferences.wake_up;
				}
				
				if (homeByInput && preferences.home_by) {
					homeByInput.value = preferences.home_by;
				}
				
				if (startDateInput && preferences.start_date) {
					startDateInput.value = preferences.start_date;
				}
				
				if (endDateInput && preferences.end_date) {
					endDateInput.value = preferences.end_date;
				}
				
				if (rangeInput && preferences.range) {
					rangeInput.value = preferences.range;
					
					if (rangeValue) {
						rangeValue.textContent = preferences.range;
					}
				}
				
				if (contextInput && preferences.context) {
					contextInput.value = preferences.context;
				}
			}
		} catch (error) {
			console.error('Load preferences error:', error);
			alert('Failed to load preferences');
		}
	},
	
	/**
	 * Handle form submission
	 * @param {Event} event - Form submit event
	 */
	async handleSubmit(event) {
		event.preventDefault();
		
		// If no changes, don't submit
		if (!this.formChanged) {
			return;
		}
		
		const form = event.target;
		const formData = new FormData(form);
		
		// Create preferences object
		const preferences = {
			mode_of_transport: formData.get('mode_of_transport'),
			eat_out: formData.get('eat_out') === 'on',
			wake_up: formData.get('wake_up'),
			home_by: formData.get('home_by'),
			start_date: formData.get('start_date'),
			end_date: formData.get('end_date'),
			range: parseInt(formData.get('range'), 10),
			context: formData.get('context')
		};
		
		try {
			// Show loading
			const submitButton = form.querySelector('button[type="submit"]');
			const statusElement = document.getElementById('preferences-status');
			
			if (submitButton) {
				submitButton.disabled = true;
				submitButton.textContent = 'Saving...';
			}
			
			// Call API to update preferences
			const response = await window.ApiClient.updatePreferences(preferences);
			
			// Hide loading
			if (submitButton) {
				submitButton.textContent = 'Save Preferences';
			}
			
			if (response.success) {
				// Reset form changed state
				this.formChanged = false;

				const range = document.getElementById('range-value');
				if (range.innerHTML == 0) {
					range.innerHTML = '60';
				}
				
				// Keep button disabled after successful save
				if (submitButton) {
					submitButton.disabled = true;
				}
				
				// Show success message
				if (statusElement) {
					statusElement.textContent = 'Preferences saved successfully';
					statusElement.classList.remove('hidden');
					
					// Hide message after 3 seconds
					setTimeout(() => {
						statusElement.classList.add('hidden');
					}, 3000);
				}
			} else {
				// Re-enable button if save failed
				if (submitButton) {
					submitButton.disabled = false;
				}
				alert(response.error?.message || 'Failed to save preferences');
			}
		} catch (error) {
			console.error('Update preferences error:', error);
			alert(error.message || 'Failed to save preferences');
			
			// Re-enable button if save failed
			const submitButton = form.querySelector('button[type="submit"]');
			if (submitButton) {
				submitButton.disabled = false;
				submitButton.textContent = 'Save Preferences';
			}
		}
	}
};

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('preferences-form');
	const rangeInput = document.getElementById('range');
	const rangeValue = document.getElementById('range-value');
	
	if (form) {
		form.addEventListener('submit', preferencesPage.handleSubmit.bind(preferencesPage));
		
		// Add change detection to all form inputs
		const formInputs = form.querySelectorAll('input, select, textarea');
		formInputs.forEach(input => {
			const eventType = input.type === 'checkbox' ? 'change' : 'input';
			input.addEventListener(eventType, () => {
				preferencesPage.formChanged = true;
				const submitButton = form.querySelector('button[type="submit"]');
				if (submitButton) {
					submitButton.disabled = false;
				}
			});
		});
	}
	
	if (rangeInput && rangeValue) {
		rangeInput.addEventListener('input', () => {
			rangeValue.textContent = rangeInput.value;
		});
	}
});

// Export the module
window.preferencesPage = preferencesPage; 