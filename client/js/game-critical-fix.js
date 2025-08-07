/**
 * Game Critical Fix - Ensures SafeEvents is available and prevents game loop
 */
(function() {
    'use strict';
    
    console.log('[Game Critical Fix] Applying emergency fixes...');
    
    // 1. Ensure SafeEvents exists globally
    if (!window.SafeEvents) {
        console.log('[Game Critical Fix] Creating SafeEvents stub...');
        window.SafeEvents = {
            on: function(target, event, handler, options) {
                target.addEventListener(event, handler, options);
                return function() {
                    target.removeEventListener(event, handler, options);
                };
            },
            off: function(target, event, handler) {
                target.removeEventListener(event, handler);
            },
            removeAll: function(target) {
                // Stub implementation
            },
            delegate: function(container, selector, event, handler) {
                const delegatedHandler = (e) => {
                    const target = e.target.closest(selector);
                    if (target && container.contains(target)) {
                        handler.call(target, e);
                    }
                };
                container.addEventListener(event, delegatedHandler);
                return function() {
                    container.removeEventListener(event, delegatedHandler);
                };
            },
            once: function(target, event, handler) {
                const onceHandler = function(e) {
                    target.removeEventListener(event, onceHandler);
                    handler.call(this, e);
                };
                target.addEventListener(event, onceHandler);
                return function() {
                    target.removeEventListener(event, onceHandler);
                };
            },
            cleanup: function() {
                // Stub implementation
            },
            getStats: function() {
                return { totalListeners: 0, activeElements: 0 };
            }
        };
    }
    
    // 2. Prevent multiple game instances
    let gameInitialized = false;
    let gameInitAttempts = 0;
    const MAX_INIT_ATTEMPTS = 1;
    
    // Store original LightcatGame constructor if it exists
    if (window.LightcatGame) {
        const OriginalLightcatGame = window.LightcatGame;
        window.LightcatGame = function(...args) {
            gameInitAttempts++;
            if (gameInitialized || gameInitAttempts > MAX_INIT_ATTEMPTS) {
                console.log('[Game Critical Fix] Preventing duplicate game instance');
                return window.gameInstance || null;
            }
            gameInitialized = true;
            const instance = new OriginalLightcatGame(...args);
            window.gameInstance = instance;
            return instance;
        };
        // Copy prototype
        window.LightcatGame.prototype = OriginalLightcatGame.prototype;
    }
    
    // 3. Hide loading screen after delay if stuck
    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-progress');
        if (loadingScreen && loadingScreen.style.display !== 'none') {
            console.log('[Game Critical Fix] Force hiding stuck loading screen');
            loadingScreen.style.display = 'none';
            
            const gameUI = document.getElementById('game-ui');
            if (gameUI) {
                gameUI.style.display = 'flex';
            }
        }
    }, 5000);
    
    console.log('[Game Critical Fix] Fixes applied');
})();