/**
 * Comprehensive UI Polish for LIGHTCAT
 * Fixes all positioning, scaling, and visual imperfections
 * Following CLAUDE.md UI/UX requirements
 */

(function() {
    'use strict';
    
    // Device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    console.log('[UIPolish] Initializing comprehensive UI fixes...');
    
    // Fix viewport scaling issues
    function fixViewportScaling() {
        // Ensure proper viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        
        // Prevent iOS bounce scrolling
        if (isIOS) {
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Fix button sizing and touch targets
    function fixButtonSizing() {
        const style = document.createElement('style');
        style.textContent = `
            /* Ensure all buttons meet 44px minimum touch target */
            button, .btn, .go-btn, a[role="button"], .batch-btn {
                min-height: 44px !important;
                min-width: 44px !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: transparent !important;
            }
            
            /* Game buttons specific fixes */
            #start-game, #play-again, #unlock-tier {
                padding: 12px 24px !important;
                font-size: 16px !important;
                font-weight: 600 !important;
            }
            
            /* Mobile controls positioning fix */
            @media (max-width: 768px) {
                .mobile-controls {
                    bottom: 120px !important;
                    padding: 10px !important;
                }
                
                #mobile-joystick {
                    width: 120px !important;
                    height: 120px !important;
                }
                
                #jump-button, #mobile-jump {
                    width: 80px !important;
                    height: 80px !important;
                    font-size: 18px !important;
                    font-weight: bold !important;
                }
            }
            
            /* Fix game canvas sizing */
            #game-canvas {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                touch-action: none !important;
            }
            
            #game-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                overflow: hidden !important;
            }
            
            /* Fix game over screen */
            #game-over {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: #000 !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            /* Fix loading screen */
            #loading-screen {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: #000 !important;
                z-index: 99999 !important;
            }
            
            /* Polish animations */
            * {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
            }
            
            /* Fix text scaling on mobile */
            @media (max-width: 480px) {
                body {
                    font-size: 14px !important;
                }
                
                h1 { font-size: 1.75rem !important; }
                h2 { font-size: 1.5rem !important; }
                h3 { font-size: 1.25rem !important; }
                
                .go-title {
                    font-size: 1.5rem !important;
                    line-height: 1.2 !important;
                }
                
                #final-score {
                    font-size: 2.5rem !important;
                }
            }
            
            /* Fix QR scanner modal */
            #qrScannerModal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 100000 !important;
            }
            
            .modal-content {
                max-width: 90vw !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
            }
            
            /* Polish form elements */
            input, select, textarea {
                font-size: 16px !important; /* Prevents zoom on iOS */
                border-radius: 8px !important;
            }
            
            /* Fix batch selector alignment */
            .batch-selector {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 15px !important;
            }
            
            .batch-count {
                min-width: 80px !important;
                text-align: center !important;
            }
            
            /* Polish scrollbars */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            ::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
            }
            
            ::-webkit-scrollbar-thumb {
                background: #fff600;
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: #e6dd00;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fix specific UI elements
    function fixUIElements() {
        // Fix mobile controls visibility
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls && isMobile) {
            mobileControls.style.display = 'block';
            mobileControls.style.bottom = '120px';
            mobileControls.style.zIndex = '1000';
        }
        
        // Fix game canvas touch events
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.touchAction = 'none';
            canvas.style.userSelect = 'none';
            canvas.style.webkitUserSelect = 'none';
        }
        
        // Fix button active states
        document.querySelectorAll('button, .btn, .go-btn').forEach(btn => {
            btn.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            btn.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });
        
        // Fix iOS input zoom
        if (isIOS) {
            document.querySelectorAll('input, select, textarea').forEach(input => {
                input.style.fontSize = '16px';
            });
        }
    }
    
    // Polish animations
    function polishAnimations() {
        // Add smooth transitions
        const transitionStyle = document.createElement('style');
        transitionStyle.textContent = `
            button, .btn, .go-btn {
                transition: all 0.2s ease !important;
            }
            
            button:active, .btn:active, .go-btn:active {
                transform: scale(0.95) !important;
            }
            
            /* Smooth page transitions */
            .fade-in {
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* Polish hover effects */
            @media (hover: hover) {
                button:hover, .btn:hover, .go-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255, 246, 0, 0.3);
                }
            }
        `;
        document.head.appendChild(transitionStyle);
    }
    
    // Fix responsive issues
    function fixResponsiveIssues() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                fixViewportScaling();
                fixUIElements();
            }, 100);
        });
        
        // Handle resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                fixViewportScaling();
                fixUIElements();
            }, 250);
        });
    }
    
    // Fix game-specific UI issues
    function fixGameUI() {
        // Ensure game UI is properly layered
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.style.position = 'fixed';
            gameUI.style.top = '0';
            gameUI.style.left = '0';
            gameUI.style.right = '0';
            gameUI.style.zIndex = '100';
            gameUI.style.pointerEvents = 'none';
            
            // Make interactive elements clickable
            gameUI.querySelectorAll('button, .btn').forEach(el => {
                el.style.pointerEvents = 'auto';
            });
        }
        
        // Fix score display
        const scoreDisplay = document.querySelector('.score-display');
        if (scoreDisplay) {
            scoreDisplay.style.fontSize = isMobile ? '1.2rem' : '1.5rem';
            scoreDisplay.style.fontWeight = 'bold';
        }
        
        // Fix timer display
        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.style.fontSize = isMobile ? '1.2rem' : '1.5rem';
            timerDisplay.style.fontWeight = 'bold';
        }
    }
    
    // Performance optimizations
    function optimizePerformance() {
        // Disable unnecessary animations on low-end devices
        if (isMobile && viewportWidth < 400) {
            const style = document.createElement('style');
            style.textContent = `
                * {
                    animation-duration: 0s !important;
                    transition-duration: 0s !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Enable GPU acceleration for transforms
        document.querySelectorAll('.mobile-controls, #game-canvas, .go-btn').forEach(el => {
            el.style.transform = 'translateZ(0)';
        });
    }
    
    // Initialize all fixes
    function init() {
        fixViewportScaling();
        fixButtonSizing();
        fixUIElements();
        polishAnimations();
        fixResponsiveIssues();
        fixGameUI();
        optimizePerformance();
        
        console.log('[UIPolish] All UI fixes applied successfully');
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();