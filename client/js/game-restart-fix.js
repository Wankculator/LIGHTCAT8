// This file requires memory-safe-events.js to be loaded first
/**
 * Game Restart and Joystick Fix
 * Fixes darkness on restart and joystick sticking issues
 */
(function() {
    'use strict';
    
    console.log('[RestartFix] Initializing game restart and joystick fixes');
    
    // Fix 1: Darkness on Play Again
    function fixPlayAgainDarkness() {
        const playAgainBtn = document.getElementById('play-again');
        if (!playAgainBtn) return;
        
        // Store original click handler
        const originalOnclick = playAgainBtn.onclick;
        
        // Override click handler
        playAgainBtn.onclick = function(e) {
            console.log('[RestartFix] Play Again clicked, fixing brightness');
            
            // Reset canvas opacity
            const gameCanvas = document.getElementById('game-canvas');
            if (gameCanvas) {
                gameCanvas.style.opacity = '1';
                gameCanvas.style.pointerEvents = 'auto';
            }
            
            // Reset game container
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.style.opacity = '1';
                gameContainer.style.backgroundColor = '#000000';
            }
            
            // Reset any dimmed elements
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.style.opacity === '0.3' || el.style.opacity === '0.5') {
                    el.style.opacity = '1';
                }
            });
            
            // Call original handler or reload
            if (originalOnclick) {
                originalOnclick.call(this, e);
            } else {
                location.reload();
            }
        };
        
        // Also add event listener as backup
        window.SafeEvents.on(playAgainBtn, 'click', function(e) {
            // This runs before reload
            const gameCanvas = document.getElementById('game-canvas');
            if (gameCanvas) {
                gameCanvas.style.opacity = '1';
            }
        }, true);
    }
    
    // Fix 2: Joystick Sticking Issue
    function fixJoystickControls() {
        const joystick = document.getElementById('mobile-joystick');
        const handle = document.getElementById('joystick-handle');
        
        if (!joystick || !handle) return;
        
        console.log('[RestartFix] Setting up joystick fix');
        
        let isDragging = false;
        let joystickRect = null;
        let centerX = 0;
        let centerY = 0;
        const maxDistance = 35; // Maximum distance from center (radius)
        
        // Add smooth transition for return animation
        handle.style.transition = 'none';
        handle.style.willChange = 'transform';
        
        // Calculate joystick center
        function updateJoystickCenter() {
            joystickRect = joystick.getBoundingClientRect();
            centerX = joystickRect.width / 2;
            centerY = joystickRect.height / 2;
        }
        
        // Reset handle to center
        function resetHandle() {
            handle.style.transition = 'transform 0.2s ease-out';
            handle.style.transform = 'translate(-50%, -50%)';
            isDragging = false;
            
            // Remove transition after animation
            setTimeout(() => {
                handle.style.transition = 'none';
            }, 200);
        }
        
        // Update handle position
        function updateHandlePosition(clientX, clientY) {
            if (!isDragging || !joystickRect) return;
            
            // Calculate position relative to joystick
            const x = clientX - joystickRect.left - centerX;
            const y = clientY - joystickRect.top - centerY;
            
            // Calculate distance from center
            const distance = Math.sqrt(x * x + y * y);
            
            // Limit to max distance
            let finalX = x;
            let finalY = y;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(y, x);
                finalX = Math.cos(angle) * maxDistance;
                finalY = Math.sin(angle) * maxDistance;
            }
            
            // Apply transform (keeping the -50% to center the handle)
            handle.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;
        }
        
        // Touch start
        window.SafeEvents.on(joystick, 'touchstart', function(e) {
            e.preventDefault();
            isDragging = true;
            updateJoystickCenter();
            handle.style.transition = 'none';
            
            const touch = e.touches[0];
            updateHandlePosition(touch.clientX, touch.clientY);
        }, { passive: false });
        
        // Touch move
        window.SafeEvents.on(joystick, 'touchmove', function(e) {
            e.preventDefault();
            if (!isDragging) return;
            
            const touch = e.touches[0];
            updateHandlePosition(touch.clientX, touch.clientY);
        }, { passive: false });
        
        // Touch end
        window.SafeEvents.on(joystick, 'touchend', function(e) {
            e.preventDefault();
            resetHandle();
        }, { passive: false });
        
        // Touch cancel
        window.SafeEvents.on(joystick, 'touchcancel', function(e) {
            e.preventDefault();
            resetHandle();
        }, { passive: false });
        
        // Mouse events for desktop testing
        window.SafeEvents.on(joystick, 'mousedown', function(e) {
            isDragging = true;
            updateJoystickCenter();
            handle.style.transition = 'none';
            updateHandlePosition(e.clientX, e.clientY);
        });
        
        window.SafeEvents.on(document, 'mousemove', function(e) {
            if (!isDragging) return;
            updateHandlePosition(e.clientX, e.clientY);
        });
        
        window.SafeEvents.on(document, 'mouseup', function() {
            if (isDragging) {
                resetHandle();
            }
        });
        
        // Update center on resize
        window.addEventListener('resize', updateJoystickCenter);
        window.SafeEvents.on(window, 'orientationchange', updateJoystickCenter);
        
        // Initial center calculation
        updateJoystickCenter();
    }
    
    // Initialize fixes
    function init() {
        fixPlayAgainDarkness();
        fixJoystickControls();
        
        // Re-apply fixes if elements are added dynamically
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    fixPlayAgainDarkness();
                    fixJoystickControls();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also fix on page show (for back/forward cache)
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            const gameCanvas = document.getElementById('game-canvas');
            if (gameCanvas) {
                gameCanvas.style.opacity = '1';
            }
        }
    });
    
})();