/**
 * Full Site Optimization for RGBLightCat
 * Ensures perfect scaling and responsiveness across all devices
 */

(function() {
    'use strict';

    // Global responsive styles
    function addGlobalOptimizations() {
        const style = document.createElement('style');
        style.id = 'full-site-optimization';
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

            /* Container optimization */
            .container {
                width: 100% !important;
                max-width: 1200px !important;
                margin: 0 auto !important;
                padding: 0 15px !important;
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
                display: block !important;
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
                padding: 40px 0 !important;
                overflow: hidden !important;
            }

            .batch-selector {
                max-width: 100% !important;
                margin: 0 auto !important;
            }

            /* Invoice section fix */
            .invoice-section {
                max-width: 100% !important;
                overflow: hidden !important;
                padding: 20px !important;
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

            /* Stats grid responsiveness */
            .stats-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
                gap: 20px !important;
                width: 100% !important;
            }

            /* Card components */
            .stat-card, .tier-card, .benefits-box {
                width: 100% !important;
                max-width: 100% !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }

            /* Modal optimization */
            .modal {
                max-width: 95vw !important;
                max-height: 95vh !important;
                overflow-y: auto !important;
            }

            .modal-content {
                max-width: 100% !important;
                padding: 20px !important;
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

            /* Tablet optimizations */
            @media (max-width: 1024px) {
                .container {
                    padding: 0 20px !important;
                }

                .section-title {
                    font-size: 2rem !important;
                }

                .stats-grid {
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
                }
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                .container {
                    padding: 0 15px !important;
                }

                .section-title {
                    font-size: 1.5rem !important;
                }

                .hero-section {
                    min-height: 80vh !important;
                }

                .hero h1 {
                    font-size: 2rem !important;
                }

                .stats-grid {
                    grid-template-columns: 1fr !important;
                    gap: 15px !important;
                }

                .tier-grid {
                    grid-template-columns: 1fr !important;
                }

                .batch-selector {
                    flex-direction: column !important;
                    gap: 15px !important;
                }

                .btn {
                    min-height: 44px !important;
                    font-size: 0.9rem !important;
                }

                /* Fix overlapping elements */
                .hero-content {
                    padding: 20px !important;
                    text-align: center !important;
                }

                /* Purchase flow optimization */
                .invoice-input {
                    font-size: 14px !important;
                }

                /* Game frame responsive */
                .game-frame {
                    height: 500px !important;
                }
            }

            /* Small mobile devices */
            @media (max-width: 375px) {
                .section-title {
                    font-size: 1.25rem !important;
                    line-height: 1.2 !important;
                }

                .hero h1 {
                    font-size: 1.75rem !important;
                }

                .btn {
                    padding: 10px 15px !important;
                    font-size: 0.85rem !important;
                }

                .stat-card {
                    padding: 15px !important;
                }

                .game-frame {
                    height: 450px !important;
                }
            }

            /* Landscape mobile optimization */
            @media (orientation: landscape) and (max-height: 500px) {
                .hero-section {
                    min-height: 100vh !important;
                }

                .section {
                    padding: 20px 0 !important;
                }

                .game-frame {
                    height: 90vh !important;
                }
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

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                /* Already dark theme, but ensure contrasts */
                .text-muted {
                    color: #a0a0a0 !important;
                }
            }

            /* Print styles */
            @media print {
                .no-print {
                    display: none !important;
                }

                body {
                    background: white !important;
                    color: black !important;
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