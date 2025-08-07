// This file requires memory-safe-events.js to be loaded first
// Perfect 10/10 UI/UX Enhancements for LIGHTCAT

// ===== ACCESSIBILITY ENHANCEMENTS =====

// Add ARIA labels to abbreviated numbers
function enhanceNumberAccessibility() {
    document.querySelectorAll('.stat-number').forEach(element => {
        const displayText = element.textContent;
        const fullNumber = element.getAttribute('data-full-number');
        
        if (displayText.includes('M') || displayText.includes('K')) {
            // Extract the full number from data attribute or calculate it
            let ariaLabel = '';
            
            if (displayText.includes('M')) {
                const millions = parseFloat(displayText.replace('M', ''));
                const fullValue = millions * 1000000;
                ariaLabel = `${fullValue.toLocaleString()} ${element.nextElementSibling?.textContent || ''}`.trim();
            } else if (displayText.includes('K')) {
                const thousands = parseFloat(displayText.replace('K', ''));
                const fullValue = thousands * 1000;
                ariaLabel = `${fullValue.toLocaleString()} ${element.nextElementSibling?.textContent || ''}`.trim();
            }
            
            element.setAttribute('aria-label', ariaLabel);
            element.setAttribute('role', 'text');
        }
    });
}

// Enhanced skip navigation
function createSkipNavigation() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Announce dynamic updates to screen readers
function announceUpdate(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

// ===== PERFORMANCE OPTIMIZATIONS =====

// Consolidated resize observer for better performance
class ResponsiveManager {
    constructor() {
        this.callbacks = new Map();
        this.resizeObserver = null;
        this.debounceTimer = null;
        this.init();
    
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}
    
    init() {
        // Use ResizeObserver for better performance
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(entries => {
                this.handleResize();
            });
            this.resizeObserver.observe(document.body);
        } else {
            // Fallback to window resize
            window.SafeEvents.on(window, 'resize', () => this.handleResize());
        }
    }
    
    handleResize() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.callbacks.forEach(callback => callback());
        }, 250);
    }
    
    register(id, callback) {
        this.callbacks.set(id, callback);
    }
    
    unregister(id) {
        this.callbacks.delete(id);
    }
}

const responsiveManager = new ResponsiveManager();

// ===== LAZY LOADING SYSTEM =====

class LazyLoader {
    constructor() {
        this.observer = null;
        this.init();
    
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}
    
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadElement(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            // Observe all lazy elements
            document.querySelectorAll('[data-lazy]').forEach(el => {
                this.observer.observe(el);
            });
        }
    }
    
    loadElement(element) {
        const loader = element.getAttribute('data-lazy');
        
        switch(loader) {
            case 'game':
                this.loadGameResources();
                break;
            case 'image':
                this.loadImage(element);
                break;
            case 'iframe':
                this.loadIframe(element);
                break;
        }
        
        // Stop observing once loaded
        this.observer.unobserve(element);
        element.removeAttribute('data-lazy');
    }
    
    loadGameResources() {
        // Load game assets when user scrolls near game section
        const gameFrame = document.querySelector('.game-frame');
        if (gameFrame && !gameFrame.querySelector('iframe')) {
            gameFrame.innerHTML = '<iframe src="/game.html" title="LIGHTCAT Game" allowfullscreen></iframe>';
            announceUpdate('Game loaded and ready to play');
        }
    }
    
    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }
    }
    
    loadIframe(iframe) {
        const src = iframe.getAttribute('data-src');
        if (src) {
            iframe.src = src;
            iframe.removeAttribute('data-src');
        }
    }
}

// ===== LOADING STATES =====

function showLoading(element) {
    element.classList.add('loading');
    element.setAttribute('aria-busy', 'true');
}

function hideLoading(element) {
    element.classList.remove('loading');
    element.setAttribute('aria-busy', 'false');
}

// ===== SCROLL INDICATORS REMOVED =====
// Tier cards fit perfectly on mobile - no scroll indicators needed

// ===== TRUST SIGNALS =====

function addTrustSignals() {
    const purchaseForm = document.querySelector('.purchase-form');
    if (purchaseForm) {
        const trustBadge = document.createElement('div');
        trustBadge.className = 'security-badge';
        trustBadge.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            background: rgba(255, 255, 0, 0.1);
            border: 1px solid rgba(255, 255, 0, 0.3);
            border-radius: 24px;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.95);
            margin: 0 auto 25px auto;
            width: fit-content;
            max-width: 90%;
        `;
        trustBadge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: var(--yellow);">
                <path d="M12 2L4 7v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7l-8-5z"/>
            </svg>
            <span>Secured by Bitcoin Lightning Network</span>
        `;
        
        purchaseForm.insertBefore(trustBadge, purchaseForm.firstChild);
    }
}

// ===== FORM VALIDATION WITH ACCESSIBILITY =====

function enhanceFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Add ARIA attributes
            const label = form.querySelector(`label[for="${input.id}"]`);
            if (label) {
                input.setAttribute('aria-labelledby', label.id);
            }
            
            // Real-time validation
            window.SafeEvents.on(input, 'blur', () => validateInput(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateInput(input);
                }
            });
        });
        
        // Prevent zoom on iOS
        window.SafeEvents.on(form, 'submit', (e) => {
            const viewport = document.querySelector('meta[name="viewport"]');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
            
            // Reset after submit
            setTimeout(() => {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }, 1000);
        });
    });
}

function validateInput(input) {
    const isValid = input.checkValidity();
    const errorId = `${input.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!isValid) {
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            input.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = input.validationMessage;
        input.setAttribute('aria-describedby', errorId);
        
        // Announce error to screen readers
        announceUpdate(`Error: ${input.validationMessage}`, 'assertive');
    } else {
        input.classList.remove('error');
        input.setAttribute('aria-invalid', 'false');
        
        if (errorElement) {
            errorElement.remove();
            input.removeAttribute('aria-describedby');
        }
    }
}

// ===== TOOLTIP SYSTEM =====

function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.setAttribute('aria-label', element.getAttribute('data-tooltip'));
    });
}

// ===== INITIALIZE ALL ENHANCEMENTS =====

window.SafeEvents.on(document, 'DOMContentLoaded', () => {
    // Accessibility
    createSkipNavigation();
    enhanceNumberAccessibility();
    
    // Performance
    new LazyLoader();
    
    // UI Enhancements
    addTrustSignals();
    enhanceFormValidation();
    initTooltips();
    
    // Update accessibility on dynamic changes
    responsiveManager.register('accessibility', () => {
        enhanceNumberAccessibility();
    });
    
    // Set main content ID for skip navigation
    const mainContent = document.querySelector('.stats-section');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
    }
    
    // Add logo alt text if missing
    const logo = document.querySelector('.logo');
    if (logo && !logo.alt) {
        logo.alt = 'LIGHTCAT - RGB Protocol Token';
    }
    
    // Announce page ready to screen readers
    setTimeout(() => {
        announceUpdate('LIGHTCAT page loaded and ready');
    }, 1000);
});

// ===== EXPORT UTILITIES =====

window.LIGHTCAT_ENHANCEMENTS = {
    announceUpdate,
    showLoading,
    hideLoading,
    responsiveManager
};