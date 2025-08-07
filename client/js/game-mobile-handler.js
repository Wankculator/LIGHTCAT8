// This file requires memory-safe-events.js to be loaded first
// Game Mobile Handler - Professional UI/UX Fixes
(function() {
    'use strict';
    
    // Detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) return;
    
    // Wait for DOM
    window.SafeEvents.on(document, 'DOMContentLoaded', function() {
        // Fix viewport height on mobile browsers
        function setViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        setViewportHeight();
        window.SafeEvents.on(window, 'resize', setViewportHeight);
        window.addEventListener('orientationchange', setViewportHeight);
        
        // Prevent double-tap zoom on game controls
        const gameControls = document.querySelectorAll('.mobile-jump, .mobile-joystick, .go-btn, button');
        gameControls.forEach(control => {
            window.SafeEvents.on(control, 'touchstart', function(e) {
                e.preventDefault();
            });
        });
        
        // Handle game over screen visibility
        const gameOver = document.getElementById('game-over');
        if (gameOver) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'style') {
                        const display = gameOver.style.display;
                        if (display === 'block') {
                            // Ensure proper mobile layout when game over shows
                            setTimeout(() => {
                                const twitterVerify = document.getElementById('twitter-verify');
                                const tierUnlocked = document.getElementById('tier-unlocked');
                                const allocationMessage = document.getElementById('allocation-message');
                                
                                // Show twitter verify only if tier is unlocked
                                if (tierUnlocked && tierUnlocked.textContent !== 'NO TIER') {
                                    if (twitterVerify) twitterVerify.style.display = 'block';
                                } else {
                                    // Ensure retry message is visible
                                    if (allocationMessage && allocationMessage.style.display === 'block') {
                                        allocationMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }
                            }, 100);
                        }
                    }
                });
            });
            
            observer.observe(gameOver, { attributes: true });
        }
        
        // Optimize touch response for game controls
        const jumpButton = document.getElementById('mobile-jump');
        if (jumpButton) {
            let touchActive = false;
            
            window.SafeEvents.on(jumpButton, 'touchstart', function(e) {
                e.preventDefault();
                if (!touchActive) {
                    touchActive = true;
                    this.style.transform = 'scale(0.9)';
                    this.style.background = 'rgba(255, 255, 0, 0.4)';
                }
            });
            
            window.SafeEvents.on(jumpButton, 'touchend', function(e) {
                e.preventDefault();
                touchActive = false;
                this.style.transform = 'scale(1)';
                this.style.background = 'rgba(255, 255, 0, 0.2)';
            });
        }
        
        // Fix mobile keyboard issues
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            window.SafeEvents.on(input, 'focus', function() {
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        });
        
        // Ensure back button is always visible on mobile
        const backButton = document.getElementById('backButton');
        if (backButton && isMobile) {
            backButton.style.display = 'block';
        }
    });
})();