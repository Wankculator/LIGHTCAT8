// Mobile Number Formatting Fix - Standalone Version
// Formats large numbers on mobile devices without dependencies

(function() {
    'use strict';
    
    // Simple number formatter
    function formatNumber(num) {
        const value = typeof num === 'number' ? num : parseFloat(num.replace(/,/g, '')) || 0;
        
        if (value >= 1000000) {
            const millions = value / 1000000;
            if (millions >= 10) {
                return Math.round(millions) + 'M';
            } else {
                const formatted = millions.toFixed(2);
                return formatted.replace(/\.?0+$/, '') + 'M';
            }
        } else if (value >= 1000) {
            const thousands = value / 1000;
            if (thousands >= 100) {
                return Math.round(thousands) + 'k';
            } else {
                const formatted = thousands.toFixed(1);
                return formatted.replace(/\.0$/, '') + 'k';
            }
        }
        return value.toString();
    }
    
    // Function to apply formatting
    function applyMobileFormatting() {
        // Only apply on mobile
        if (window.innerWidth > 768) return;
        
        // Format each stat
        const stats = [
            { id: 'soldBatches', value: '2,100' },
            { id: 'remainingBatches', value: '27,900' },
            { id: 'totalTokens', value: '1,470,000' },
            { id: 'uniqueBuyers', value: '0' }
        ];
        
        stats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element) {
                const formatted = formatNumber(stat.value);
                element.textContent = formatted;
                element.setAttribute('data-original', stat.value);
                element.setAttribute('title', stat.value);
            }
        });
    }
    
    // Restore original numbers on desktop
    function restoreDesktopNumbers() {
        if (window.innerWidth <= 768) return;
        
        const elements = document.querySelectorAll('[data-original]');
        elements.forEach(element => {
            const original = element.getAttribute('data-original');
            if (original) {
                element.textContent = original;
            }
        });
    }
    
    // Apply formatting when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMobileFormatting);
    } else {
        // Small delay to ensure elements are rendered
        setTimeout(applyMobileFormatting, 100);
    }
    
    // Handle resize events
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth <= 768) {
                applyMobileFormatting();
            } else {
                restoreDesktopNumbers();
            }
        }, 250);
    });
})();