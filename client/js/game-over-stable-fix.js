/**
 * Game Over Stable Fix - Minimal, non-crashing version
 * Only essential fixes, no aggressive loops
 */

(function() {
    'use strict';
    
    console.log('[Stable Fix] Loading...');
    
    // Simple background fix
    function addBackgroundFix() {
        const style = document.createElement('style');
        style.textContent = `
            #game-over {
                background-color: #000000 !important;
            }
            .game-over-gallery {
                background-color: #000000 !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fix claim button - simple version
    function fixClaimButton() {
        const btn = document.getElementById('unlock-tier');
        if (!btn) return;
        
        // Just ensure it's clickable
        btn.style.pointerEvents = 'auto';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '10000';
        
        // Remove any bad onclick
        btn.removeAttribute('onclick');
        
        // Add simple handler
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get tier
            let tier = null;
            const tierEl = document.getElementById('tier-unlocked');
            if (tierEl) {
                const text = tierEl.textContent;
                if (text.includes('GOLD')) tier = 'gold';
                else if (text.includes('SILVER')) tier = 'silver';
                else if (text.includes('BRONZE')) tier = 'bronze';
            }
            
            if (tier) {
                localStorage.setItem('unlockedTier', tier);
                window.location.href = '/#purchase?tier=' + tier;
            }
        });
        
        // Also add touch support
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            btn.click();
        });
    }
    
    // Hide verification message if shown incorrectly
    function hideVerification() {
        const verifySuccess = document.querySelectorAll('#verify-success');
        verifySuccess.forEach(el => {
            if (el.textContent.includes('Ready to claim')) {
                el.style.display = 'none';
            }
        });
    }
    
    // Simple init
    function init() {
        addBackgroundFix();
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                fixClaimButton();
                hideVerification();
            });
        } else {
            setTimeout(function() {
                fixClaimButton();
                hideVerification();
            }, 100);
        }
    }
    
    // Run once
    init();
    
    console.log('[Stable Fix] Ready');
    
})();