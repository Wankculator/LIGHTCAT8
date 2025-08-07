/**
 * Full Site Optimization for RGBLightCat - Fixed Version
 * Ensures perfect scaling WITHOUT changing existing UI designs
 */

(function() {
    'use strict';

    // Global responsive styles - ONLY optimizations, no UI changes
    function addGlobalOptimizations() {
        const style = document.createElement('style');
        style.id = 'full-site-optimization-fixed';
        style.textContent = `
            /* Global box-sizing fix */
            *, *::before, *::after {
                box-sizing: border-box !important;
            }

            /* Prevent horizontal overflow site-wide */
            html, body {
                overflow-x: hidden !important;
                max-width: 100% !important;
                position: relative !important;
            }

            /* Container optimization - preserve existing styles */
            .container {
                max-width: 1200px !important;
                box-sizing: border-box !important;
            }

            /* Section optimization */
            section {
                overflow: hidden !important;
                position: relative !important;
            }

            /* Image responsiveness */
            img {
                max-width: 100% !important;
                height: auto !important;
            }

            /* Text responsiveness */
            h1, h2, h3, h4, h5, h6, p {
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                hyphens: auto !important;
            }

            /* Button and input optimization */
            button, input, select, textarea {
                max-width: 100% !important;
                font-size: 16px !important; /* Prevents zoom on iOS */
            }

            /* Table responsiveness */
            table {
                max-width: 100% !important;
                overflow-x: auto !important;
                display: block !important;
            }

            /* Fix game iframe container */
            .game-section {
                width: 100% !important;
                max-width: 100% !important;
                overflow: hidden !important;
            }

            .game-container {
                position: relative !important;
                width: 100% !important;
                max-width: 900px !important;
                margin: 0 auto !important;
                overflow: hidden !important;
            }

            .game-frame {
                width: 100% !important;
                border: none !important;
                display: block !important;
            }

            /* Purchase section optimization */
            .purchase-section {
                overflow: hidden !important;
            }

            /* Invoice section fix */
            .invoice-section {
                max-width: 100% !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }

            .invoice-display {
                word-break: break-all !important;
                overflow-wrap: anywhere !important;
                max-width: 100% !important;
            }

            /* Mobile menu optimization */
            .mobile-menu {
                width: 280px !important;
                max-width: 90vw !important;
            }

            /* Modal optimization */
            .modal {
                max-width: 95vw !important;
                max-height: 95vh !important;
                overflow-y: auto !important;
            }

            .modal-content {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }

            /* Scanner modal specific */
            #qrScannerModal .modal-content {
                width: 100% !important;
                max-width: 500px !important;
                height: auto !important;
                max-height: 90vh !important;
            }

            #scanner-container {
                width: 100% !important;
                max-width: 100% !important;
                aspect-ratio: 1 !important;
                overflow: hidden !important;
            }

            /* High DPI screens */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                /* Ensure text remains crisp */
                body {
                    -webkit-font-smoothing: antialiased !important;
                    -moz-osx-font-smoothing: grayscale !important;
                }
            }

            /* Fix for iOS Safari */
            @supports (-webkit-touch-callout: none) {
                /* iOS specific fixes */
                .modal {
                    -webkit-overflow-scrolling: touch !important;
                }

                input, select, textarea {
                    -webkit-appearance: none !important;
                    -webkit-border-radius: 0 !important;
                }
            }

            /* Accessibility improvements */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Dynamic viewport height fix for mobile browsers
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Fix iOS input zoom
    function fixIOSInputZoom() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
        inputs.forEach(input => {
            input.style.fontSize = '16px';
        });
    }

    // Optimize images for different screen sizes
    function optimizeImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageOptions = {
            threshold: 0.01,
            rootMargin: '50px'
        };

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, imageOptions);

        images.forEach(img => imageObserver.observe(img));
    }

    // Handle orientation changes
    function handleOrientationChange() {
        setTimeout(() => {
            setViewportHeight();
            window.scrollTo(0, 0);
        }, 500);
    }

    // Prevent overscroll on iOS
    function preventOverscroll() {
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = scrollTop + e.touches[0].pageY - startY;

            if (currentScroll < 0 || currentScroll > totalScroll) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Touch-friendly hover states
    function addTouchSupport() {
        document.addEventListener('touchstart', () => {
            document.body.classList.add('touch-device');
        }, { once: true });
    }

    // Initialize all optimizations
    function init() {
        addGlobalOptimizations();
        setViewportHeight();
        fixIOSInputZoom();
        optimizeImages();
        addTouchSupport();

        // Only prevent overscroll on iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            preventOverscroll();
        }

        // Event listeners
        window.addEventListener('resize', () => {
            setViewportHeight();
            fixIOSInputZoom();
        });

        window.addEventListener('orientationchange', handleOrientationChange);

        // Ensure game frame is responsive
        const gameFrame = document.querySelector('.game-frame');
        if (gameFrame) {
            const resizeGameFrame = () => {
                const aspectRatio = 16/9;
                const containerWidth = gameFrame.parentElement.offsetWidth;
                const maxHeight = window.innerHeight * 0.8;
                const calculatedHeight = containerWidth / aspectRatio;
                
                gameFrame.style.height = Math.min(calculatedHeight, maxHeight) + 'px';
            };

            resizeGameFrame();
            window.addEventListener('resize', resizeGameFrame);
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();