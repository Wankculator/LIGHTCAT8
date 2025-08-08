// This file requires memory-safe-events.js to be loaded first
/**
 * Game Controls Manager
 * Handles control initialization based on device type
 */

(function() {
    'use strict';
    
    // Enhanced mobile detection - check for touch capability too
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const hasTouch = ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0) || 
                     (navigator.msMaxTouchPoints > 0);
    const shouldShowControls = isMobile || hasTouch;
    
    console.log('[GameControls] Device type:', isMobile ? 'Mobile' : 'Desktop');
    console.log('[GameControls] Touch support:', hasTouch ? 'Yes' : 'No');
    console.log('[GameControls] Show controls:', shouldShowControls ? 'Yes' : 'No');
    
    // Always load mobile CSS for consistent styling
    const mobileStyles = [
        'css/game-mobile-fix.css',
        'css/mobile-animation-fix.css'
    ];
    
    mobileStyles.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    });
    
    window.SafeEvents.on(window, 'DOMContentLoaded', function() {
        const mobileControls = document.querySelector('.mobile-controls');
        const toggleButton = document.getElementById('controls-toggle');
        
        // Show toggle button ONLY on mobile devices (not desktop with touch)
        if (isMobile && toggleButton) {
            toggleButton.style.display = 'block';
            
            // Toggle controls visibility
            toggleButton.addEventListener('click', function() {
                if (mobileControls) {
                    const isVisible = mobileControls.style.display === 'block';
                    mobileControls.style.display = isVisible ? 'none' : 'block';
                    toggleButton.textContent = isVisible ? 'Show Controls' : 'Hide Controls';
                    localStorage.setItem('mobileControlsVisible', !isVisible);
                }
            });
        }
        
        // Check saved preference or auto-show ONLY on actual mobile devices
        const savedPref = localStorage.getItem('mobileControlsVisible');
        const showControls = savedPref !== null ? savedPref === 'true' : isMobile;
        
        if (mobileControls) {
            if (showControls) {
                console.log('[GameControls] Showing mobile controls');
                mobileControls.style.display = 'block';
                if (toggleButton) toggleButton.textContent = 'Hide Controls';
            } else {
                console.log('[GameControls] Hiding mobile controls');
                mobileControls.style.display = 'none';
                if (toggleButton) toggleButton.textContent = 'Show Controls';
            }
            
            // Initialize controls regardless of visibility
            initializeMobileControls();
        }
    });
    
    function initializeMobileControls() {
        const mobileJump = document.getElementById('mobile-jump');
        const mobileJoystick = document.getElementById('mobile-joystick');
        const joystickHandle = document.getElementById('joystick-handle');
        
        if (mobileJump) {
            window.SafeEvents.on(mobileJump, 'touchstart', function(e) {
                e.preventDefault();
                if (window.game && window.game.proGame) {
                    window.game.proGame.jump();
                }
                // Visual feedback
                mobileJump.style.transform = 'scale(0.95)';
            });
            
            mobileJump.addEventListener('touchend', function(e) {
                e.preventDefault();
                mobileJump.style.transform = 'scale(1)';
            });
        }
        
        if (mobileJoystick && joystickHandle) {
            let isActive = false;
            let centerX = 0;
            let centerY = 0;
            
            function updateCenter() {
                const rect = mobileJoystick.getBoundingClientRect();
                centerX = rect.left + rect.width / 2;
                centerY = rect.top + rect.height / 2;
            }
            
            window.SafeEvents.on(mobileJoystick, 'touchstart', function(e) {
                e.preventDefault();
                isActive = true;
                updateCenter();
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            });
            
            window.SafeEvents.on(mobileJoystick, 'touchmove', function(e) {
                e.preventDefault();
                if (!isActive) return;
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            });
            
            window.SafeEvents.on(mobileJoystick, 'touchend', function(e) {
                e.preventDefault();
                isActive = false;
                joystickHandle.style.transform = 'translate(-50%, -50%)';
                
                if (window.game && window.game.proGame) {
                    window.game.proGame.movement.x = 0;
                    window.game.proGame.movement.z = 0;
                }
            });
            
            function handleMove(x, y) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 30;
                
                let nx = dx / maxDist;
                let ny = dy / maxDist;
                
                if (distance > maxDist) {
                    nx = (dx / distance);
                    ny = (dy / distance);
                }
                
                // Update joystick visual
                joystickHandle.style.transform = `translate(calc(-50% + ${nx * maxDist}px), calc(-50% + ${ny * maxDist}px))`;
                
                // Update game movement
                if (window.game && window.game.proGame) {
                    window.game.proGame.movement.x = nx;
                    window.game.proGame.movement.z = ny;
                }
            }
        }
    }
})();