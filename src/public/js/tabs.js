/**
 * Tab switching functionality for app.html
 */
document.addEventListener('DOMContentLoaded', () => {
    const tabItems = document.querySelectorAll('.tab-item');
    
    // Add click event listeners to tabs
    tabItems.forEach(tab => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            switchTab(tab.dataset.tab);
        });
    });
});

/**
 * Switch to a specific tab
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(tabName) {
    // Update active tab
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Initialize the page content based on tab
    switch (tabName) {
        case 'home':
            if (window.homePage && typeof window.homePage.init === 'function') {
                window.homePage.init();
            }
            break;
        case 'saved':
            if (window.savedPage && typeof window.savedPage.init === 'function') {
                window.savedPage.init();
            }
            break;
        case 'preferences':
            if (window.preferencesPage && typeof window.preferencesPage.init === 'function') {
                window.preferencesPage.init();
            }
            break;
        case 'account':
            if (window.accountPage && typeof window.accountPage.init === 'function') {
                window.accountPage.init();
            }
            break;
    }
}

// Make function available globally
window.switchTab = switchTab; 