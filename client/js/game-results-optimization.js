/**
 * Game Results Screen Optimization
 * Fixes overflow, right slider issues, and ensures perfect fit in game frame
 */

(function() {
    'use strict';

    // Add optimized styles for game results screen
    function addOptimizedStyles() {
        const style = document.createElement('style');
        style.id = 'game-results-optimization';
        style.textContent = `
            /* Fix game over container to prevent overflow and scrollbars */
            #game-over {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                right: auto !important;
                bottom: auto !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* Fix gallery wrapper to prevent horizontal scroll */
            .game-over-gallery {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }

            /* Gallery wrapper should not exceed viewport */
            .gallery-wrapper {
                width: 200% !important; /* Only 2 pages */
                height: 100% !important;
                display: flex !important;
                transition: transform 0.3s ease !important;
                overflow: hidden !important;
            }

            /* Content wrapper optimization */
            .content-wrapper {
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                padding: 20px !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
            }

            /* Ensure all text fits without overflow */
            .go-title {
                font-size: clamp(1.2rem, 4vw, 2rem) !important;
                margin-bottom: 10px !important;
                text-align: center !important;
                word-wrap: break-word !important;
            }

            .score-display {
                font-size: clamp(2rem, 6vw, 3rem) !important;
                margin: 10px 0 !important;
            }

            .tier-badge {
                font-size: clamp(1rem, 3vw, 1.5rem) !important;
                padding: 8px 16px !important;
                margin: 10px 0 !important;
                white-space: nowrap !important;
                max-width: 90% !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
            }

            /* Rewards text optimization */
            .rewards-text {
                font-size: clamp(0.8rem, 2.5vw, 1rem) !important;
                padding: 10px !important;
                max-width: 90% !important;
                text-align: center !important;
                overflow: hidden !important;
            }

            /* Button container optimization */
            .button-row {
                display: flex !important;
                flex-wrap: wrap !important;
                justify-content: center !important;
                gap: 10px !important;
                width: 100% !important;
                max-width: 400px !important;
                margin: 10px auto !important;
                padding: 0 10px !important;
                box-sizing: border-box !important;
            }

            /* Button optimization */
            .game-btn, .action-btn {
                min-width: 120px !important;
                max-width: 180px !important;
                padding: 10px 15px !important;
                font-size: clamp(0.75rem, 2vw, 0.9rem) !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                flex: 1 1 auto !important;
            }

            /* Social section optimization */
            .social-section {
                width: 100% !important;
                max-width: 350px !important;
                margin: 10px auto !important;
                padding: 10px !important;
                box-sizing: border-box !important;
            }

            /* Exit button positioning */
            .exit-btn {
                position: absolute !important;
                top: 10px !important;
                right: 10px !important;
                width: 40px !important;
                height: 40px !important;
                padding: 0 !important;
                font-size: 1.2rem !important;
                z-index: 10003 !important;
            }

            /* Mobile-specific optimizations */
            @media (max-width: 768px) {
                .content-wrapper {
                    padding: 10px !important;
                }

                .go-title {
                    font-size: 1.1rem !important;
                    margin-bottom: 5px !important;
                }

                .score-display {
                    font-size: 1.8rem !important;
                    margin: 5px 0 !important;
                }

                .tier-badge {
                    font-size: 0.9rem !important;
                    padding: 5px 10px !important;
                }

                .rewards-text {
                    font-size: 0.75rem !important;
                    padding: 5px !important;
                }

                .button-row {
                    gap: 5px !important;
                    padding: 0 5px !important;
                }

                .game-btn, .action-btn {
                    min-width: 90px !important;
                    padding: 8px 10px !important;
                    font-size: 0.7rem !important;
                }

                .social-section {
                    padding: 5px !important;
                }

                /* Prevent any scrolling on mobile */
                #game-over, .game-over-gallery {
                    touch-action: none !important;
                    -webkit-overflow-scrolling: auto !important;
                    overflow: hidden !important;
                }
            }

            /* Small mobile devices (iPhone SE, etc.) */
            @media (max-width: 375px) {
                .go-title {
                    font-size: 1rem !important;
                }

                .score-display {
                    font-size: 1.5rem !important;
                }

                .game-btn, .action-btn {
                    min-width: 80px !important;
                    font-size: 0.65rem !important;
                    padding: 6px 8px !important;
                }
            }

            /* Landscape orientation fix */
            @media (orientation: landscape) and (max-height: 500px) {
                .content-wrapper {
                    padding: 5px !important;
                    justify-content: flex-start !important;
                }

                .go-title {
                    display: none !important;
                }

                .score-display {
                    font-size: 1.5rem !important;
                    margin: 2px 0 !important;
                }

                .button-row {
                    margin: 5px auto !important;
                }
            }

            /* Remove any potential scrollbars */
            #game-over::-webkit-scrollbar,
            .game-over-gallery::-webkit-scrollbar,
            .gallery-wrapper::-webkit-scrollbar {
                display: none !important;
            }

            #game-over,
            .game-over-gallery,
            .gallery-wrapper {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
            }

            /* Ensure no elements can cause overflow */
            #game-over * {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }

            /* Fix tier information display */
            .tier-info {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 5px !important;
                margin: 10px 0 !important;
            }

            /* Batch information styling */
            .batch-info {
                font-size: clamp(0.7rem, 2vw, 0.85rem) !important;
                color: var(--primary-yellow) !important;
                text-align: center !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    // Fix gallery swipe functionality
    function fixGallerySwipe() {
        const gallery = document.querySelector('.game-over-gallery');
        if (!gallery) return;

        // Prevent default touch behavior that might cause scrolling
        gallery.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }, { passive: false });

        gallery.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Optimize button layout dynamically
    function optimizeButtonLayout() {
        const buttonRows = document.querySelectorAll('.button-row');
        buttonRows.forEach(row => {
            const buttons = row.querySelectorAll('.game-btn, .action-btn');
            if (buttons.length > 3 && window.innerWidth < 400) {
                row.style.gridTemplateColumns = 'repeat(2, 1fr)';
            }
        });
    }

    // Fix text overflow in results
    function fixTextOverflow() {
        // Fix long tier names
        const tierElements = document.querySelectorAll('.tier-badge, #tier-unlocked');
        tierElements.forEach(el => {
            if (el.scrollWidth > el.clientWidth) {
                el.style.fontSize = '0.8rem';
            }
        });

        // Fix reward text
        const rewardTexts = document.querySelectorAll('.rewards-text');
        rewardTexts.forEach(text => {
            if (text.scrollHeight > text.clientHeight) {
                text.style.fontSize = '0.7rem';
                text.style.lineHeight = '1.2';
            }
        });
    }

    // Monitor for game over screen display
    function monitorGameOverScreen() {
        const gameOver = document.getElementById('game-over');
        if (!gameOver) return;

        // Create mutation observer to watch for display changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const display = window.getComputedStyle(gameOver).display;
                    if (display !== 'none') {
                        // Game over screen is visible, apply fixes
                        setTimeout(() => {
                            fixGallerySwipe();
                            optimizeButtonLayout();
                            fixTextOverflow();
                        }, 100);
                    }
                }
            });
        });

        observer.observe(gameOver, {
            attributes: true,
            attributeFilter: ['style']
        });
    }

    // Responsive viewport fix
    function fixViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    // Initialize all optimizations
    function init() {
        fixViewport();
        addOptimizedStyles();
        monitorGameOverScreen();

        // Reapply optimizations on resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                optimizeButtonLayout();
                fixTextOverflow();
            }, 250);
        });

        // Reapply on orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                optimizeButtonLayout();
                fixTextOverflow();
            }, 100);
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();