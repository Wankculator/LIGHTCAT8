// ULTRA FIX: Disable ALL duplicate tier messages
(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUltraFix);
    } else {
        initUltraFix();
    }
    
    function initUltraFix() {
        console.log('[ULTRA FIX] Disabling all duplicate tier messages...');
    
    // Override any function that shows tier messages
    const blockTierMessages = function() {
        // Find and hide any tier unlock messages
        const selectors = [
            '[id*="tier"][id*="unlock"]',
            '[class*="tier"][class*="unlock"]',
            '[id*="allocation-message"]',
            '*:contains("TIER UNLOCKED")'
        ];
        
        selectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    if (el.textContent.includes('TIER UNLOCKED') || 
                        el.textContent.includes('🥇') || 
                        el.textContent.includes('🥈') || 
                        el.textContent.includes('🥉') ||
                        el.textContent.includes('batches')) {
                        el.style.display = 'none';
                        el.remove();
                    }
                });
            } catch(e) {}
        });
    };
    
    // Run immediately and periodically
    blockTierMessages();
    setInterval(blockTierMessages, 100);
    
    // Override showTierUnlockedNotification if it exists
    if (window.showTierUnlockedNotification) {
        window.showTierUnlockedNotification = function() {
            console.log('[ULTRA FIX] Blocked tier notification');
            return;
        };
    }
    
    // Override any tier detector
    if (window.tierDetector) {
        window.tierDetector.notify = function() {
            console.log('[ULTRA FIX] Blocked tier detector notification');
            return;
        };
    }
    
        console.log('[ULTRA FIX] All tier messages disabled');
    }
})();