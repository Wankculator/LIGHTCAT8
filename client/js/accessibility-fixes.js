/**
 * Accessibility Fixes for LIGHTCAT
 * Implements WCAG 2.1 AA compliance
 * Following CLAUDE.md standards
 */

(function() {
    'use strict';
    
    // Add ARIA labels to all buttons
    function addAriaLabels() {
        const ariaLabels = {
            // Game buttons
            'start-game': 'Start the Lightning Cat game',
            'play-again': 'Play the game again',
            'unlock-tier': 'Claim your unlocked tier rewards',
            'exit-game': 'Exit game and return to main page',
            
            // Mobile controls
            'mobile-joystick': 'Movement joystick control',
            'jump-button': 'Jump button',
            
            // Main page buttons
            'play-game-btn': 'Launch the Lightning Cat game',
            'scanQRBtn': 'Scan RGB invoice QR code',
            'closeQRScanner': 'Close QR scanner',
            'startScannerBtn': 'Start QR code scanner',
            'uploadQRBtn': 'Upload QR code image',
            
            // Form elements
            'rgbInvoice': 'Enter your RGB invoice',
            'emailAddress': 'Enter your email address (optional)',
            'batchCount': 'Select number of batches to purchase',
            
            // Twitter verification
            'verify-follow': 'Verify Twitter follow',
            
            // Payment buttons
            'copyInvoiceBtn': 'Copy Lightning invoice to clipboard',
            'downloadBtn': 'Download RGB consignment file'
        };
        
        // Apply ARIA labels
        Object.entries(ariaLabels).forEach(([id, label]) => {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('aria-label', label);
                element.setAttribute('role', element.tagName === 'BUTTON' ? 'button' : element.getAttribute('role') || 'button');
            }
        });
        
        // Add ARIA labels to buttons without IDs
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            const text = button.textContent.trim();
            if (text) {
                button.setAttribute('aria-label', text);
            }
        });
        
        // Add ARIA labels to links
        document.querySelectorAll('a:not([aria-label])').forEach(link => {
            const text = link.textContent.trim();
            if (text) {
                link.setAttribute('aria-label', text);
            }
        });
    }
    
    // Add keyboard navigation support
    function addKeyboardNavigation() {
        // Ensure all interactive elements are keyboard accessible
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [onclick]');
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
        });
        
        // Add keyboard event handlers for custom controls
        const joystick = document.getElementById('mobile-joystick');
        if (joystick) {
            joystick.addEventListener('keydown', handleJoystickKeyboard);
        }
        
        // Add skip link for game
        if (document.getElementById('game-container')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#game-ui';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to game controls';
            skipLink.setAttribute('aria-label', 'Skip to game controls');
            document.body.insertBefore(skipLink, document.body.firstChild);
        }
    }
    
    // Handle joystick keyboard controls
    function handleJoystickKeyboard(e) {
        const key = e.key;
        const moveDistance = 10;
        
        switch(key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                simulateJoystickMove(0, -moveDistance);
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                simulateJoystickMove(0, moveDistance);
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                simulateJoystickMove(-moveDistance, 0);
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                simulateJoystickMove(moveDistance, 0);
                e.preventDefault();
                break;
            case ' ':
            case 'Enter':
                // Trigger jump
                const jumpBtn = document.getElementById('jump-button');
                if (jumpBtn) {
                    jumpBtn.click();
                }
                e.preventDefault();
                break;
        }
    }
    
    // Simulate joystick movement
    function simulateJoystickMove(x, y) {
        if (window.gameInstance && window.gameInstance.handleJoystickInput) {
            window.gameInstance.handleJoystickInput(x, y);
        }
    }
    
    // Add screen reader announcements
    function addScreenReaderSupport() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'game-announcements';
        document.body.appendChild(liveRegion);
        
        // Create score announcement element
        const scoreAnnouncement = document.createElement('span');
        scoreAnnouncement.id = 'score-announcement';
        liveRegion.appendChild(scoreAnnouncement);
        
        // Create tier announcement element
        const tierAnnouncement = document.createElement('span');
        tierAnnouncement.id = 'tier-announcement';
        liveRegion.appendChild(tierAnnouncement);
        
        // Monitor score changes
        let lastScore = 0;
        setInterval(() => {
            const scoreElement = document.querySelector('.score-value');
            if (scoreElement) {
                const currentScore = parseInt(scoreElement.textContent);
                if (currentScore !== lastScore && currentScore > 0) {
                    lastScore = currentScore;
                    announceScore(currentScore);
                }
            }
        }, 1000);
    }
    
    // Announce score to screen readers
    function announceScore(score) {
        const announcement = document.getElementById('score-announcement');
        if (announcement) {
            announcement.textContent = `Score: ${score} points`;
            
            // Check for tier unlocks
            if (score >= 30) {
                announceTier('Gold');
            } else if (score >= 20) {
                announceTier('Silver');
            } else if (score >= 11) {
                announceTier('Bronze');
            }
        }
    }
    
    // Announce tier unlock
    function announceTier(tier) {
        const announcement = document.getElementById('tier-announcement');
        if (announcement) {
            announcement.textContent = `${tier} tier unlocked!`;
        }
    }
    
    // Add focus indicators
    function addFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            /* Focus indicators for accessibility */
            *:focus {
                outline: 3px solid #fff600 !important;
                outline-offset: 2px !important;
            }
            
            button:focus,
            a:focus {
                transform: scale(1.05);
                box-shadow: 0 0 15px rgba(255, 246, 0, 0.8);
            }
            
            /* Skip link styling */
            .skip-link {
                position: absolute;
                top: -40px;
                left: 0;
                background: #fff600;
                color: #000;
                padding: 8px;
                text-decoration: none;
                border-radius: 0 0 4px 0;
                font-weight: bold;
            }
            
            .skip-link:focus {
                top: 0;
            }
            
            /* Screen reader only class */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0,0,0,0);
                white-space: nowrap;
                border: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize all accessibility features
    function init() {
        addAriaLabels();
        addKeyboardNavigation();
        addScreenReaderSupport();
        addFocusIndicators();
        
        // Re-apply on dynamic content changes
        const observer = new MutationObserver(() => {
            addAriaLabels();
            addKeyboardNavigation();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();