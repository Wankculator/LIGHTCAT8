// This file requires memory-safe-events.js to be loaded first
/**
 * Smart Number Formatter for Mobile Displays
 * Converts large numbers to abbreviated format (1k, 34.5k, 1M, 3.16M)
 * Maintains exact values in data attributes for precision
 */

class NumberFormatter {
    /**
     * Format a number for display, with mobile-specific abbreviations
     * @param {number
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
} num - The number to format
     * @param {boolean} forceMobile - Force mobile formatting regardless of screen size
     * @returns {Object} - Object containing display, full, and raw values
     */
    static format(num, forceMobile = false) {
        // Ensure we have a valid number
        const value = typeof num === 'number' ? num : parseFloat(num) || 0;
        
        // Full formatted number with locale-specific separators
        const fullNumber = value.toLocaleString();
        
        // Check if we should use mobile formatting
        const isMobile = forceMobile || window.innerWidth <= 768;
        
        let displayNumber = fullNumber;
        
        if (isMobile && value >= 1000) {
            if (value >= 1000000) {
                // Format millions with up to 2 decimal places
                const millions = value / 1000000;
                if (millions >= 10) {
                    // For 10M+, show no decimals
                    displayNumber = Math.round(millions) + 'M';
                } else if (millions >= 1) {
                    // For 1-9.99M, show up to 2 decimals
                    const formatted = millions.toFixed(2);
                    // Remove trailing zeros
                    displayNumber = formatted.replace(/\.?0+$/, '') + 'M';
                }
            } else if (value >= 1000) {
                // Format thousands
                const thousands = value / 1000;
                if (thousands >= 100) {
                    // For 100k+, show no decimals
                    displayNumber = Math.round(thousands) + 'k';
                } else if (thousands >= 10) {
                    // For 10-99.9k, show up to 1 decimal
                    const formatted = thousands.toFixed(1);
                    // Remove trailing .0
                    displayNumber = formatted.replace(/\.0$/, '') + 'k';
                } else {
                    // For 1-9.99k, show up to 1 decimal
                    const formatted = thousands.toFixed(1);
                    displayNumber = formatted.replace(/\.0$/, '') + 'k';
                }
            }
        }
        
        return {
            display: displayNumber,
            full: fullNumber,
            raw: value
        };
    }
    
    /**
     * Apply formatted number to a DOM element with accessibility attributes
     * @param {string} elementId - The ID of the element to update
     * @param {number} value - The value to display
     * @param {string} label - Accessibility label for the value
     * @param {boolean} forceMobile - Force mobile formatting
     */
    static applyToElement(elementId, value, label, forceMobile = false) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element with ID '${elementId}' not found`);
            return;
        }
        
        const formatted = this.format(value, forceMobile);
        
        // Update element content
        element.textContent = formatted.display;
        
        // Add accessibility attributes
        element.setAttribute('aria-label', `${formatted.full} ${label}`);
        element.setAttribute('data-full-number', formatted.raw);
        element.setAttribute('title', formatted.full); // Tooltip on hover
        
        // Add a CSS class for styling
        element.classList.add('formatted-number');
        
        // Store the formatter data
        element._formatterData = formatted;
    }
    
    /**
     * Update all stat elements with formatted numbers
     * @param {Object} stats - Object containing stat values
     */
    static updateStats(stats) {
        if (stats.soldBatches !== undefined) {
            this.applyToElement('soldBatches', stats.soldBatches, 'batches sold');
        }
        if (stats.remainingBatches !== undefined) {
            this.applyToElement('remainingBatches', stats.remainingBatches, 'batches remaining');
        }
        if (stats.totalTokens !== undefined) {
            this.applyToElement('totalTokens', stats.totalTokens, 'tokens sold');
        }
        if (stats.uniqueBuyers !== undefined) {
            this.applyToElement('uniqueBuyers', stats.uniqueBuyers, 'unique wallets');
        }
    }
    
    /**
     * Re-apply formatting when screen size changes
     */
    static handleResize() {
        // Find all elements with formatter data and reapply
        const elements = document.querySelectorAll('.formatted-number');
        elements.forEach(element => {
            if (element._formatterData) {
                const label = element.getAttribute('aria-label')?.split(' ').slice(1).join(' ') || '';
                const value = element._formatterData.raw;
                const elementId = element.id;
                
                if (elementId && value !== undefined) {
                    this.applyToElement(elementId, value, label);
                }
            }
        });
    }
}

// Set up resize handler with debouncing
let resizeTimeout;
window.SafeEvents.on(window, 'resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        NumberFormatter.handleResize();
    }, 250);
});

// Export for use in other scripts
window.NumberFormatter = NumberFormatter;