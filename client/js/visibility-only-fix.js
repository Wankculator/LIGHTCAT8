/**
 * Visibility Only Fix - NO UI CHANGES
 * Only fixes elements that are invisible without changing design
 */

(function() {
    'use strict';
    
    console.log('[VisibilityOnlyFix] Fixing visibility without changing UI...');
    
    // Only fix opacity and display issues, don't change colors or design
    function fixVisibilityOnly() {
        // Fix elements stuck at opacity 0
        document.querySelectorAll('.section-title, .tier-card, .stat-card, .purchase-form').forEach(el => {
            if (window.getComputedStyle(el).opacity === '0') {
                el.style.opacity = '1';
            }
        });
        
        // Remove transform animations that might be stuck
        document.querySelectorAll('.fade-in').forEach(el => {
            el.style.transform = 'none';
        });
        
        // Fix GSAP ScrollTrigger animations that didn't complete
        if (window.gsap && window.ScrollTrigger) {
            // Force animations to their end state without changing the design
            ScrollTrigger.getAll().forEach(st => st.progress(1));
        }
    }
    
    // Apply fix
    fixVisibilityOnly();
    
    // Reapply after page loads
    window.addEventListener('load', fixVisibilityOnly);
    setTimeout(fixVisibilityOnly, 1000);
    
})();