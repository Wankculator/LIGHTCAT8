/**
 * Loading Screen Restore
 * Ensures the loading screen with logo is properly displayed
 */

(function() {
    'use strict';
    
    console.log('[Loading Screen] Restoring loading screen...');
    
    // Ensure loading screen is visible initially
    const loadingScreen = document.getElementById('loading-progress');
    if (loadingScreen) {
        // Force display
        loadingScreen.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #000000 !important;
            z-index: 9999 !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
        `;
        
        // Ensure logo is visible
        const logo = loadingScreen.querySelector('img');
        if (logo) {
            logo.style.display = 'block';
            logo.style.visibility = 'visible';
            logo.style.opacity = '1';
        }
        
        console.log('[Loading Screen] Loading screen displayed');
    }
    
    // Proper hiding function that only hides when game is ready
    window.hideLoadingScreen = function() {
        if (window.gameReady || window.game?.scene) {
            console.log('[Loading Screen] Game ready, hiding loading screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        } else {
            console.log('[Loading Screen] Game not ready yet, keeping loading screen');
        }
    };
    
    // Monitor for premature hiding
    if (loadingScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const display = loadingScreen.style.display;
                    if (display === 'none' && !window.gameReady && !window.game?.scene) {
                        console.log('[Loading Screen] Prevented premature hiding');
                        loadingScreen.style.display = 'flex';
                    }
                }
            });
        });
        
        observer.observe(loadingScreen, {
            attributes: true,
            attributeFilter: ['style']
        });
        
        // Stop monitoring after 15 seconds (game should be loaded by then)
        setTimeout(() => observer.disconnect(), 15000);
    }
    
    console.log('[Loading Screen] Fix applied');
    
})();