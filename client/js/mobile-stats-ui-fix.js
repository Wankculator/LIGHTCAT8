/**
 * Mobile Stats UI Fix
 * - CSS handles yellow color and animation removal
 * - This script ONLY handles number abbreviation on mobile
 * - Works with existing NumberFormatter system
 */

(function() {
    'use strict';
    
    console.log('[Mobile Stats UI Fix] Initializing (abbreviation only)...');
    
    // Override NumberFormatter to add mobile abbreviation
    if (window.NumberFormatter && window.NumberFormatter.applyToElement) {
        const originalApply = window.NumberFormatter.applyToElement;
        
        window.NumberFormatter.applyToElement = function(elementId, value, label) {
            // Call original formatter first
            originalApply.call(this, elementId, value, label);
            
            // Then apply mobile abbreviation if needed
            if (window.innerWidth <= 768) {
                const element = document.getElementById(elementId);
                if (element && element.classList.contains('stat-number')) {
                    // Store raw value
                    element.dataset.rawValue = value;
                    
                    // Apply abbreviation
                    if (value >= 1000000) {
                        element.textContent = (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
                    } else if (value >= 1000) {
                        element.textContent = (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
                    }
                    // Values under 1000 stay as-is from NumberFormatter
                }
            }
        };
        
        console.log('[Mobile Stats UI Fix] NumberFormatter override applied');
    } else {
        console.warn('[Mobile Stats UI Fix] NumberFormatter not found - waiting...');
        
        // Wait for NumberFormatter to be available
        const checkInterval = setInterval(() => {
            if (window.NumberFormatter && window.NumberFormatter.applyToElement) {
                clearInterval(checkInterval);
                // Re-run this script
                location.reload();
            }
        }, 100);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // If we switch between mobile/desktop, refresh stats
        const isMobile = window.innerWidth <= 768;
        const wasMobile = document.body.dataset.wasMobile === 'true';
        
        if (isMobile !== wasMobile) {
            document.body.dataset.wasMobile = isMobile;
            // Trigger stats update
            if (window.updateMintStats) {
                window.updateMintStats();
            }
        }
    });
    
    // Set initial state
    document.body.dataset.wasMobile = window.innerWidth <= 768;
    
    console.log('[Mobile Stats UI Fix] Ready');
    
})();