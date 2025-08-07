// This file requires memory-safe-events.js to be loaded first
/**
 * iOS Game Freeze Fix
 * Fixes iPhone/iPad game freeze after timer expiration
 * Ensures proper game over screen display on iOS devices
 */
(function() {
    'use strict';
    
    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent);
    
    if (!isIOS) {
        console.log('[IOSFix] Not iOS device, skipping fixes');
        return;
    }
    
    console.log('[IOSFix] Initializing iOS-specific game freeze fixes');
    
    // Store original showGameOver function
    let originalShowGameOver = null;
    let gameOverTimeout = null;
    let lastTimerValue = 30;
    let gameEndHandled = false;
    
    // Force game over display
    function forceGameOverDisplay() {
        console.log('[IOSFix] Forcing game over display');
        
        // Stop any running animations
        if (window.gameInstance && window.gameInstance.renderer) {
            try {
                window.gameInstance.renderer.setAnimationLoop(null);
            } catch (e) {
                console.warn('[IOSFix] Could not stop animation loop:', e);
            }
        }
        
        // Ensure game over screen is visible
        const gameOver = document.getElementById('game-over');
        const gameUI = document.getElementById('game-ui');
        const gameCanvas = document.getElementById('game-canvas');
        
        if (gameOver) {
            // Use requestAnimationFrame for smooth transition
            requestAnimationFrame(() => {
                gameOver.style.display = 'block';
                gameOver.style.opacity = '1';
                gameOver.style.visibility = 'visible';
                gameOver.style.zIndex = '9999';
                
                // Force repaint
                gameOver.offsetHeight;
                
                // Hide game UI
                if (gameUI) {
                    gameUI.style.display = 'none';
                }
                
                // Hide or dim canvas
                if (gameCanvas) {
                    gameCanvas.style.opacity = '0.3';
                    gameCanvas.style.pointerEvents = 'none';
                }
                
                console.log('[IOSFix] Game over screen forced to display');
            });
        }
    }
    
    // Monitor timer for iOS
    function monitorTimer() {
        const timerElement = document.getElementById('timer');
        if (!timerElement) return;
        
        const timerValue = parseInt(timerElement.textContent);
        
        // Detect if timer is stuck or at 0
        if (timerValue === 0 && !gameEndHandled) {
            console.log('[IOSFix] Timer reached 0, triggering game over');
            gameEndHandled = true;
            
            // Try normal game over first
            if (window.showGameOver && typeof window.showGameOver === 'function') {
                try {
                    window.showGameOver();
                } catch (e) {
                    console.error('[IOSFix] showGameOver failed:', e);
                    forceGameOverDisplay();
                }
            } else {
                forceGameOverDisplay();
            }
            
            // Failsafe timeout
            setTimeout(() => {
                const gameOver = document.getElementById('game-over');
                if (!gameOver || gameOver.style.display === 'none') {
                    console.log('[IOSFix] Failsafe triggered');
                    forceGameOverDisplay();
                }
            }, 500);
        }
        
        lastTimerValue = timerValue;
    }
    
    // Override showGameOver for iOS
    function overrideShowGameOver() {
        if (window.showGameOver && !originalShowGameOver) {
            originalShowGameOver = window.showGameOver;
            
            window.showGameOver = function() {
                console.log('[IOSFix] iOS-optimized showGameOver called');
                
                // Clear any existing timeouts
                if (gameOverTimeout) {
                    clearTimeout(gameOverTimeout);
                }
                
                // Stop game loop first
                if (window.gameInstance) {
                    if (window.gameInstance.isRunning) {
                        window.gameInstance.isRunning = false;
                    }
                    if (window.gameInstance.animationId) {
                        cancelAnimationFrame(window.gameInstance.animationId);
                        window.gameInstance.animationId = null;
                    }
                }
                
                // Use setTimeout to break out of current execution context
                setTimeout(() => {
                    try {
                        // Call original function
                        originalShowGameOver.apply(this, arguments);
                        
                        // Ensure display after short delay
                        setTimeout(() => {
                            const gameOver = document.getElementById('game-over');
                            if (gameOver && gameOver.style.display === 'none') {
                                forceGameOverDisplay();
                            }
                        }, 100);
                    } catch (e) {
                        console.error('[IOSFix] Error in showGameOver:', e);
                        forceGameOverDisplay();
                    }
                }, 0);
            };
        }
    }
    
    // Initialize fixes when DOM is ready
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('[IOSFix] Initializing iOS fixes');
        
        // Override showGameOver
        overrideShowGameOver();
        
        // Start timer monitoring
        setInterval(monitorTimer, 100);
        
        // Also check for showGameOver availability periodically
        const checkInterval = setInterval(() => {
            if (window.showGameOver && !originalShowGameOver) {
                overrideShowGameOver();
                clearInterval(checkInterval);
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
        
        // iOS-specific touch event optimization
        window.SafeEvents.on(document, 'touchstart', function() {}, {passive: true});
        window.SafeEvents.on(document, 'touchmove', function() {}, {passive: true});
        
        // Handle visibility changes (important for iOS)
        window.SafeEvents.on(document, 'visibilitychange', function() {
            if (document.hidden && window.gameInstance && window.gameInstance.isRunning) {
                console.log('[IOSFix] App backgrounded, pausing game');
                if (window.gameInstance.pause) {
                    window.gameInstance.pause();
                }
            }
        });
        
        // iOS memory pressure handler
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memory = window.performance.memory;
                const usedPercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                if (usedPercent > 0.9) {
                    console.warn('[IOSFix] High memory usage detected:', Math.round(usedPercent * 100) + '%');
                }
            }, 5000);
        }
    }
    
    // Expose force function globally for debugging
    window.forceGameOverIOS = forceGameOverDisplay;
    
})();