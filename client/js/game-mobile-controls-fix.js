// This file requires memory-safe-events.js to be loaded first
/**
 * Mobile Game Controls Fix
 * Ensures game buttons are visible and functional on mobile devices
 */

(function() {
    'use strict';
    
    console.log('Mobile controls fix loading...');
    
    // Wait for game to be ready
    function initializeMobileControls() {
        const mobileControls = document.querySelector('.mobile-controls');
        const mobileJoystick = document.getElementById('mobile-joystick');
        const mobileJump = document.getElementById('mobile-jump');
        const joystickHandle = document.getElementById('joystick-handle');
        
        if (!mobileControls) {
            console.log('Mobile controls not found, retrying...');
            setTimeout(initializeMobileControls, 500);
            return;
        }
        
        console.log('Initializing mobile controls...');
        
        // Force mobile controls to be visible on mobile
        if (window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            // Override CSS to ensure visibility
            mobileControls.style.display = 'block';
            mobileControls.style.visibility = 'visible';
            mobileControls.style.opacity = '1';
            mobileControls.style.pointerEvents = 'none'; // Container doesn't capture events
            
            // Ensure individual controls can be interacted with
            if (mobileJoystick) {
                mobileJoystick.style.display = 'block';
                mobileJoystick.style.visibility = 'visible';
                mobileJoystick.style.opacity = '0.8';
                mobileJoystick.style.pointerEvents = 'auto';
                mobileJoystick.style.touchAction = 'none';
                mobileJoystick.style.userSelect = 'none';
                mobileJoystick.style.position = 'absolute';
                mobileJoystick.style.left = '10px';
                mobileJoystick.style.bottom = '10px';
                mobileJoystick.style.width = '100px';
                mobileJoystick.style.height = '100px';
                mobileJoystick.style.background = 'rgba(255, 255, 0, 0.1)';
                mobileJoystick.style.border = '2px solid #FFD700';
                mobileJoystick.style.borderRadius = '50%';
                mobileJoystick.style.zIndex = '101';
            }
            
            if (mobileJump) {
                mobileJump.style.display = 'flex';
                mobileJump.style.visibility = 'visible';
                mobileJump.style.opacity = '0.8';
                mobileJump.style.pointerEvents = 'auto';
                mobileJump.style.touchAction = 'none';
                mobileJump.style.userSelect = 'none';
                mobileJump.style.position = 'absolute';
                mobileJump.style.right = '10px';
                mobileJump.style.bottom = '10px';
                mobileJump.style.width = '80px';
                mobileJump.style.height = '80px';
                mobileJump.style.background = 'rgba(255, 255, 0, 0.2)';
                mobileJump.style.border = '2px solid #FFD700';
                mobileJump.style.borderRadius = '50%';
                mobileJump.style.alignItems = 'center';
                mobileJump.style.justifyContent = 'center';
                mobileJump.style.fontSize = '0.9rem';
                mobileJump.style.fontWeight = 'bold';
                mobileJump.style.color = '#FFD700';
                mobileJump.style.textTransform = 'uppercase';
                mobileJump.style.zIndex = '101';
            }
            
            if (joystickHandle) {
                joystickHandle.style.position = 'absolute';
                joystickHandle.style.top = '50%';
                joystickHandle.style.left = '50%';
                joystickHandle.style.transform = 'translate(-50%, -50%)';
                joystickHandle.style.width = '40px';
                joystickHandle.style.height = '40px';
                joystickHandle.style.background = 'rgba(255, 255, 0, 0.4)';
                joystickHandle.style.border = '2px solid #FFD700';
                joystickHandle.style.borderRadius = '50%';
                joystickHandle.style.pointerEvents = 'none';
            }
            
            console.log('Mobile controls styled and ready');
            
            // Add event listeners
            if (mobileJump) {
                window.SafeEvents.on(mobileJump, 'touchstart', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Trigger jump in game
                    if (window.game && window.game.jump) {
                        window.game.jump();
                    }
                    
                    // Visual feedback
                    mobileJump.style.background = 'rgba(255, 255, 0, 0.4)';
                    mobileJump.style.transform = 'scale(0.95)';
                    
                    console.log('Jump button pressed');
                });
                
                window.SafeEvents.on(mobileJump, 'touchend', function(e) {
                    e.preventDefault();
                    // Reset visual feedback
                    mobileJump.style.background = 'rgba(255, 255, 0, 0.2)';
                    mobileJump.style.transform = 'scale(1)';
                });
            }
            
            // Joystick handling
            if (mobileJoystick) {
                let isJoystickActive = false;
                let joystickCenter = { x: 0, y: 0 };
                
                function updateJoystickCenter() {
                    const rect = mobileJoystick.getBoundingClientRect();
                    joystickCenter = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
                
                updateJoystickCenter();
                
                window.SafeEvents.on(mobileJoystick, 'touchstart', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    isJoystickActive = true;
                    updateJoystickCenter();
                    
                    const touch = e.touches[0];
                    handleJoystickMove(touch.clientX, touch.clientY);
                });
                
                window.SafeEvents.on(mobileJoystick, 'touchmove', function(e) {
                    e.preventDefault();
                    if (!isJoystickActive) return;
                    
                    const touch = e.touches[0];
                    handleJoystickMove(touch.clientX, touch.clientY);
                });
                
                window.SafeEvents.on(mobileJoystick, 'touchend', function(e) {
                    e.preventDefault();
                    isJoystickActive = false;
                    
                    // Reset joystick position
                    if (joystickHandle) {
                        joystickHandle.style.transform = 'translate(-50%, -50%)';
                    }
                    
                    // Stop movement in game
                    if (window.game && window.game.stopMovement) {
                        window.game.stopMovement();
                    }
                });
                
                function handleJoystickMove(touchX, touchY) {
                    const dx = touchX - joystickCenter.x;
                    const dy = touchY - joystickCenter.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const maxDistance = 30;
                    
                    let normalizedX = dx / maxDistance;
                    let normalizedY = dy / maxDistance;
                    
                    if (distance > maxDistance) {
                        normalizedX = (dx / distance) * maxDistance / maxDistance;
                        normalizedY = (dy / distance) * maxDistance / maxDistance;
                    }
                    
                    // Update joystick handle position
                    if (joystickHandle) {
                        const handleX = normalizedX * maxDistance;
                        const handleY = normalizedY * maxDistance;
                        joystickHandle.style.transform = `translate(calc(-50% + ${handleX}px), calc(-50% + ${handleY}px))`;
                    }
                    
                    // Send movement to game
                    if (window.game && window.game.move) {
                        window.game.move(normalizedX, -normalizedY); // Invert Y for game coordinates
                    }
                }
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', initializeMobileControls);
    } else {
        initializeMobileControls();
    }
    
    // Also initialize when game loads
    window.addEventListener('gameReady', initializeMobileControls);
    
})();