/**
 * Number Formatter for LIGHTCAT
 * Formats large numbers with K, M, B suffixes
 */

class NumberFormatter {
    static format(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    static formatWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    static formatSats(sats) {
        return this.formatWithCommas(sats) + ' sats';
    }
    
    static formatBTC(sats) {
        const btc = sats / 100000000;
        return btc.toFixed(8) + ' BTC';
    }
    
    static applyToElement(elementOrId, value, suffix = '') {
        // Handle both element references and string IDs
        const element = typeof elementOrId === 'string' 
            ? document.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            // Handle the suffix properly based on the call from index.html
            if (suffix) {
                element.textContent = this.formatWithCommas(value);
                // Add suffix as a separate element if needed
                const parent = element.parentElement;
                if (parent) {
                    const suffixSpan = parent.querySelector('.stat-suffix');
                    if (suffixSpan) {
                        suffixSpan.textContent = suffix;
                    }
                }
            } else {
                element.textContent = this.format(value);
            }
        }
    }
}

// Make available globally
window.NumberFormatter = NumberFormatter;