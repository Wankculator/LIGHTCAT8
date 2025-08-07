// This file requires memory-safe-events.js to be loaded first
/**
 * Game Text Optimizer
 * Shortens text labels for better mobile display
 */

(function() {
    'use strict';
    
    function optimizeGameText() {
        // Find the Lightning Collected header
        const gameStats = document.querySelectorAll('.game-stats h3');
        
        gameStats.forEach(stat => {
            if (stat.textContent === 'Lightning Collected') {
                // Shorten text based on screen size
                if (window.innerWidth <= 375) {
                    stat.textContent = 'Lightning'; // Very small screens
                } else if (window.innerWidth <= 768) {
                    stat.textContent = 'Lightning Score'; // Mobile
                } else {
                    stat.textContent = 'Lightning Collected'; // Desktop
                }
            }
        });
    }
    
    // Run on load and resize
    window.SafeEvents.on(window, 'DOMContentLoaded', optimizeGameText);
    window.addEventListener('resize', optimizeGameText);
    
    // Also run when game UI shows
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'game-ui' && mutation.attributeName === 'style') {
                setTimeout(optimizeGameText, 100);
            }
        });
    });
    
    // Start observing when ready
    function init() {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            observer.observe(gameUI, { attributes: true });
        }
    }
    
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    } else {
        init();
    }
})();