// This file requires memory-safe-events.js to be loaded first
/**
 * Game UI Layout Handler
 * Ensures proper UI element positioning and visibility
 */

(function() {
    'use strict';
    
    console.log('Game UI layout handler initializing...');
    
    // Function to show back button when game starts
    function showBackButton() {
        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.style.display = 'flex';
            console.log('Back button shown');
        }
    }
    
    // Function to ensure UI layout is correct
    function checkUILayout() {
        const gameUI = document.getElementById('game-ui');
        const backButton = document.getElementById('backButton');
        
        if (gameUI && gameUI.style.display !== 'none') {
            // Game is active, show back button
            showBackButton();
        }
    }
    
    // Monitor game UI visibility
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'game-ui' && mutation.attributeName === 'style') {
                checkUILayout();
            }
        });
    });
    
    // Start observing when DOM is ready
    function init() {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            observer.observe(gameUI, { attributes: true, attributeFilter: ['style'] });
            
            // Check initial state
            checkUILayout();
        }
        
        // Also check when game starts
        window.SafeEvents.on(window, 'gameStarted', showBackButton);
        window.addEventListener('gameReady', showBackButton);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Debug function to check layout
    window.debugGameUI = function() {
        document.body.classList.add('ui-debug');
        console.log('UI Debug mode enabled');
        
        const gameUI = document.getElementById('game-ui');
        const stats = gameUI.querySelectorAll('.game-stats');
        const backButton = document.getElementById('backButton');
        
        console.log('Game UI:', gameUI);
        console.log('Stats elements:', stats.length);
        console.log('Back button:', backButton);
        
        stats.forEach((stat, index) => {
            console.log(`Stat ${index}:`, stat.querySelector('h3')?.textContent);
        });
    };
    
})();