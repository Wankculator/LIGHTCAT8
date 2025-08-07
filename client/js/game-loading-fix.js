/**
 * Game Loading Fix
 * Fixes the loading screen display issue
 */

(function() {
    'use strict';
    
    console.log('[GameLoadingFix] Initializing...');
    
    // Fix loading screen display issue
    function fixLoadingScreen() {
        const loadingScreen = document.getElementById('loading-progress');
        if (loadingScreen) {
            // Remove inline style with !important
            loadingScreen.removeAttribute('style');
            // Set proper display
            loadingScreen.style.display = 'flex';
            loadingScreen.style.backgroundColor = '#000000';
            console.log('[GameLoadingFix] Fixed loading screen display');
        }
    }
    
    // Hide loading screen when game is ready
    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-progress');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('[GameLoadingFix] Loading screen hidden');
        }
    }
    
    // Monitor for game ready state
    function monitorGameState() {
        // Check if game has loaded
        if (window.gameHasStarted || window.gameIsReady) {
            hideLoadingScreen();
            return;
        }
        
        // Also hide if main.js tries to hide it
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const loadingScreen = document.getElementById('loading-progress');
                    if (loadingScreen && loadingScreen.style.display === 'none') {
                        // Ensure it's actually hidden
                        loadingScreen.style.setProperty('display', 'none', 'important');
                    }
                }
            });
        });
        
        const loadingScreen = document.getElementById('loading-progress');
        if (loadingScreen) {
            observer.observe(loadingScreen, { attributes: true });
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            fixLoadingScreen();
            monitorGameState();
        });
    } else {
        fixLoadingScreen();
        monitorGameState();
    }
    
    // Force hide after 10 seconds as fallback
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-progress');
        if (loadingScreen && loadingScreen.style.display !== 'none') {
            console.log('[GameLoadingFix] Force hiding loading screen after timeout');
            loadingScreen.style.setProperty('display', 'none', 'important');
        }
    }, 10000);
    
    // Expose function for manual control
    window.hideGameLoadingScreen = hideLoadingScreen;
    
})();