/**
 * INSTANT MINT LOCK HIDE
 * 
 * This script runs IMMEDIATELY to inject CSS that hides the purchase form
 * BEFORE it can be rendered, preventing the visual flash.
 */

(function() {
    'use strict';
    
    // Inject hiding CSS immediately
    const style = document.createElement('style');
    style.id = 'mint-lock-instant-css';
    style.textContent = `
        /* Hide purchase form by default to prevent flash */
        #purchaseForm {
            display: none !important;
        }
        
        /* Only show when tier is unlocked */
        body.tier-unlocked #purchaseForm {
            display: block !important;
        }
    `;
    
    // Add to head immediately (works even before DOM ready)
    if (document.head) {
        document.head.appendChild(style);
    } else {
        // If head doesn't exist yet, add as soon as possible
        document.addEventListener('DOMContentLoaded', function() {
            document.head.insertBefore(style, document.head.firstChild);
        });
    }
    
    // Check tier status and add body class if unlocked
    function checkTierStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = window.location.hash.includes('?') ? 
            new URLSearchParams(window.location.hash.split('?')[1]) : new URLSearchParams();
        
        const tierFromUrl = urlParams.get('tier') || hashParams.get('tier');
        const tierFromStorage = localStorage.getItem('unlockedTier');
        const gameScore = parseInt(localStorage.getItem('gameScore')) || 0;
        
        let hasValidTier = false;
        
        // Check localStorage tier with score validation
        if (tierFromStorage && gameScore > 0) {
            if ((tierFromStorage === 'bronze' && gameScore >= 11) ||
                (tierFromStorage === 'silver' && gameScore >= 18) ||
                (tierFromStorage === 'gold' && gameScore >= 28)) {
                hasValidTier = true;
            }
        }
        
        // Check URL tier with score validation
        if (!hasValidTier && tierFromUrl && gameScore > 0) {
            if ((tierFromUrl === 'bronze' && gameScore >= 11) ||
                (tierFromUrl === 'silver' && gameScore >= 18) ||
                (tierFromUrl === 'gold' && gameScore >= 28)) {
                hasValidTier = true;
            }
        }
        
        // Add or remove body class
        if (document.body) {
            if (hasValidTier) {
                document.body.classList.add('tier-unlocked');
            } else {
                document.body.classList.remove('tier-unlocked');
            }
        }
        
        return hasValidTier;
    }
    
    // Check immediately
    checkTierStatus();
    
    // Also check when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkTierStatus);
    }
    
    // Monitor for changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'unlockedTier' || e.key === 'gameScore') {
            checkTierStatus();
        }
    });
    
    console.log('[INSTANT-HIDE] Purchase form hidden by default to prevent flash');
})();