/**
 * Accessibility Improvements
 * WCAG 2.1 AA Compliance Features
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }

    function initAccessibility() {
        console.log('🔧 Initializing accessibility improvements...');

        // Add ARIA labels to all buttons
        addButtonLabels();
        
        // Add keyboard navigation
        setupKeyboardNavigation();
        
        // Add focus indicators
        setupFocusIndicators();
        
        // Add screen reader announcements
        setupScreenReaderSupport();
        
        // Add skip links
        addSkipLinks();
        
        // Improve form accessibility
        improveFormAccessibility();
        
        // Add live regions for dynamic content
        setupLiveRegions();

        console.log('✅ Accessibility improvements initialized');
    }

    /**
     * Add ARIA labels to all buttons
     */
    function addButtonLabels() {
        const buttonMappings = {
            'play-btn': 'Start the Lightning Cat game',
            'start-game': 'Begin playing the Lightning Cat game',
            'claim-btn': 'Claim your unlocked tier rewards',
            'unlock-tier': 'Unlock tier and proceed to purchase',
            'generate-invoice': 'Generate Lightning invoice for payment',
            'copy-invoice': 'Copy Lightning invoice to clipboard',
            'download-consignment': 'Download RGB consignment file',
            'show-qr': 'Show QR code for Lightning invoice',
            'scan-qr': 'Scan QR code for payment',
            'mint-tokens': 'Proceed to mint RGB tokens',
            'toggle-music': 'Toggle game music on/off',
            'toggle-sound': 'Toggle game sound effects on/off'
        };

        Object.entries(buttonMappings).forEach(([id, label]) => {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('aria-label', label);
                element.setAttribute('role', 'button');
                
                // Add tabindex if missing
                if (!element.hasAttribute('tabindex')) {
                    element.setAttribute('tabindex', '0');
                }
            }
        });

        // Add labels to all buttons without aria-label
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            const text = button.textContent.trim();
            if (text) {
                button.setAttribute('aria-label', text);
            }
        });
    }

    /**
     * Setup keyboard navigation
     */
    function setupKeyboardNavigation() {
        // Make all interactive elements keyboard accessible
        const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, [role="button"], [onclick]'
        );

        interactiveElements.forEach(element => {
            // Add tabindex if not present
            if (!element.hasAttribute('tabindex') && 
                element.tagName !== 'INPUT' && 
                element.tagName !== 'SELECT' && 
                element.tagName !== 'TEXTAREA' &&
                element.tagName !== 'A') {
                element.setAttribute('tabindex', '0');
            }

            // Add keyboard event listeners for clickable elements
            if (element.hasAttribute('onclick') || element.tagName === 'BUTTON') {
                element.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        element.click();
                    }
                });
            }
        });

        // Tab navigation improvements
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', function() {
            document.body.classList.remove('keyboard-nav');
        });
    }

    /**
     * Setup focus indicators
     */
    function setupFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced focus indicators */
            .keyboard-nav *:focus {
                outline: 3px solid #FFFF00 !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 5px rgba(255, 255, 0, 0.3) !important;
            }
            
            /* Skip link styles */
            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                background: #000;
                color: #FFFF00;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 0 0 4px 0;
                font-weight: bold;
                z-index: 10000;
            }
            
            .skip-link:focus {
                top: 0;
            }
            
            /* Screen reader only text */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .btn, button {
                    border: 2px solid currentColor !important;
                }
            }
            
            /* Reduced motion support */
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

    /**
     * Setup screen reader support
     */
    function setupScreenReaderSupport() {
        // Create live regions
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-announcements';
        document.body.appendChild(liveRegion);

        // Score announcements
        if (window.gameObserver) {
            window.gameObserver.on('scoreUpdate', (score) => {
                announceToScreenReader(`Score: ${score} points`);
            });

            window.gameObserver.on('tierUnlocked', (tier) => {
                announceToScreenReader(`Congratulations! ${tier} tier unlocked!`);
            });
        }

        // Payment status announcements
        const originalUpdateStatus = window.updatePaymentStatus;
        if (originalUpdateStatus) {
            window.updatePaymentStatus = function(status) {
                originalUpdateStatus.apply(this, arguments);
                
                const statusMessages = {
                    'pending': 'Payment pending',
                    'paid': 'Payment confirmed! Generating consignment file',
                    'expired': 'Payment expired. Please try again',
                    'failed': 'Payment failed. Please try again',
                    'delivered': 'Consignment ready for download'
                };
                
                if (statusMessages[status]) {
                    announceToScreenReader(statusMessages[status]);
                }
            };
        }
    }

    /**
     * Announce to screen readers
     */
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    /**
     * Add skip links
     */
    function addSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Ensure main content has ID
        const mainContent = document.querySelector('main') || document.querySelector('.container');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    /**
     * Improve form accessibility
     */
    function improveFormAccessibility() {
        // Add labels to inputs without labels
        document.querySelectorAll('input:not([aria-label])').forEach(input => {
            const placeholder = input.placeholder;
            if (placeholder) {
                input.setAttribute('aria-label', placeholder);
            }
        });

        // Add required indicators
        document.querySelectorAll('input[required]').forEach(input => {
            input.setAttribute('aria-required', 'true');
            
            // Add visual indicator
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label && !label.textContent.includes('*')) {
                label.innerHTML += ' <span aria-label="required">*</span>';
            }
        });

        // Add error descriptions
        document.querySelectorAll('.error-message').forEach(error => {
            const input = error.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                const errorId = 'error-' + (input.id || Math.random().toString(36).substr(2, 9));
                error.id = errorId;
                input.setAttribute('aria-describedby', errorId);
                input.setAttribute('aria-invalid', 'true');
            }
        });
    }

    /**
     * Setup live regions for dynamic content
     */
    function setupLiveRegions() {
        // Stats updates
        const statsElement = document.querySelector('.stats-grid');
        if (statsElement) {
            statsElement.setAttribute('aria-live', 'polite');
            statsElement.setAttribute('aria-label', 'Token sale statistics');
        }

        // Timer updates
        const timerElement = document.querySelector('.timer');
        if (timerElement) {
            timerElement.setAttribute('aria-live', 'off'); // Too frequent
            timerElement.setAttribute('aria-label', 'Game timer');
        }

        // Progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.setAttribute('role', 'progressbar');
            progressBar.setAttribute('aria-label', 'Token sale progress');
            
            const updateProgress = () => {
                const percent = progressBar.style.width;
                if (percent) {
                    progressBar.setAttribute('aria-valuenow', parseInt(percent));
                    progressBar.setAttribute('aria-valuemin', '0');
                    progressBar.setAttribute('aria-valuemax', '100');
                }
            };
            
            // Watch for changes
            const observer = new MutationObserver(updateProgress);
            observer.observe(progressBar, { attributes: true, attributeFilter: ['style'] });
            updateProgress();
        }
    }

    // Expose for external use
    window.AccessibilityManager = {
        announce: announceToScreenReader,
        addLabel: function(element, label) {
            if (element) {
                element.setAttribute('aria-label', label);
            }
        },
        makeAccessible: function(element) {
            if (element) {
                element.setAttribute('tabindex', '0');
                element.setAttribute('role', 'button');
            }
        }
    };

})();