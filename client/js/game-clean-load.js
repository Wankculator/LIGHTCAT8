/**
 * Game Clean Load - Eliminates all loading glitches and flashes
 */
(function() {
    'use strict';
    
    // Immediately hide any potential flash elements
    const immediateStyle = document.createElement('style');
    immediateStyle.id = 'game-clean-load-style';
    immediateStyle.textContent = `
        /* Prevent ALL flashes during load */
        body {
            background: #000000 !important;
            overflow: hidden;
        }
        
        #game-container {
            background: #000000 !important;
            opacity: 0;
            transition: opacity 0.5s ease-in;
        }
        
        #loading-progress {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: #000000 !important;
            z-index: 9999 !important;
            opacity: 1;
            transition: opacity 0.3s ease-out;
        }
        
        /* Hide everything else during load */
        #game-ui,
        #game-canvas,
        #start-screen,
        #game-over,
        .tier-notification {
            opacity: 0 !important;
            visibility: hidden !important;
        }
        
        /* Ready state */
        body.game-loaded {
            overflow: visible;
        }
        
        body.game-loaded #game-container {
            opacity: 1;
        }
        
        body.game-loaded #game-ui {
            opacity: 1 !important;
            visibility: visible !important;
            transition: opacity 0.3s ease-in 0.2s;
        }
        
        body.game-loaded #game-canvas {
            opacity: 1 !important;
            visibility: visible !important;
            transition: opacity 0.3s ease-in 0.1s;
        }
        
        /* Prevent yellow elements from showing during load */
        .progress-fill,
        #loading-progress h2,
        #loading-progress p {
            color: #ffffff !important;
        }
        
        .progress-bar {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }
        
        .progress-fill {
            background: #ffffff !important;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5) !important;
        }
    `;
    
    // Insert style as first element in head to ensure it applies immediately
    const firstHeadElement = document.head.firstChild;
    if (firstHeadElement) {
        document.head.insertBefore(immediateStyle, firstHeadElement);
    } else {
        document.head.appendChild(immediateStyle);
    }
    
    // Track loading state
    let isLoading = true;
    let gameStarted = false;
    
    // Override the loading screen hide to make it smooth
    const originalHideLoading = window.hideLoadingScreen;
    window.hideLoadingScreen = function() {
        // Don't hide immediately, wait for game to be ready
    };
    
    // Smooth transition when game is ready
    function smoothStartGame() {
        if (!isLoading || gameStarted) return;
        gameStarted = true;
        
        console.log('[Game Clean Load] Starting smooth transition...');
        
        const loadingScreen = document.getElementById('loading-progress');
        const gameContainer = document.getElementById('game-container');
        const gameUI = document.getElementById('game-ui');
        
        // Ensure game UI is ready but hidden
        if (gameUI) {
            gameUI.style.display = 'flex';
        }
        
        // Start transition
        setTimeout(() => {
            // Fade out loading screen
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.pointerEvents = 'none';
            }
            
            // Add loaded class to body for CSS transitions
            document.body.classList.add('game-loaded');
            
            // Remove loading screen after fade
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
                
                // Clean up the style after everything is loaded
                setTimeout(() => {
                    const styleElement = document.getElementById('game-clean-load-style');
                    if (styleElement) {
                        styleElement.remove();
                    }
                }, 1000);
            }, 300);
        }, 100);
        
        isLoading = false;
    }
    
    // Monitor for game ready state
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        checkCount++;
        
        // Check various indicators that game is ready
        const gameCanvas = document.getElementById('game-canvas');
        const hasGameInstance = window.gameInstance || window.game;
        const hasProGame = window.ProGame && gameCanvas;
        const loadingProgress = document.getElementById('loading-progress');
        
        // Check if loading text says "Ready!"
        const loadingText = document.getElementById('loading-text');
        const isReady = loadingText && loadingText.textContent.includes('Ready');
        
        if ((hasGameInstance || hasProGame || isReady) && !gameStarted) {
            clearInterval(checkInterval);
            // Small delay to ensure everything is truly ready
            setTimeout(smoothStartGame, 300);
        }
        
        // Fallback after 3 seconds
        if (checkCount > 60 && !gameStarted) {
            clearInterval(checkInterval);
            smoothStartGame();
        }
    }, 50);
    
    // Listen for game events
    window.addEventListener('gamestart', smoothStartGame);
    window.addEventListener('gameready', smoothStartGame);
    
    // Intercept any immediate display changes to loading screen
    const observer = new MutationObserver((mutations) => {
        if (!isLoading) return;
        
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'loading-progress' && 
                mutation.attributeName === 'style') {
                const loadingScreen = mutation.target;
                if (loadingScreen.style.display === 'none' && isLoading) {
                    // Prevent premature hiding
                    loadingScreen.style.display = 'flex';
                }
            }
        });
    });
    
    // Start observing once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const loadingScreen = document.getElementById('loading-progress');
            if (loadingScreen) {
                observer.observe(loadingScreen, {
                    attributes: true,
                    attributeFilter: ['style']
                });
            }
        });
    }
    
    console.log('[Game Clean Load] Initialized');
})();