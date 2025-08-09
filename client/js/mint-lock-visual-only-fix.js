/**
 * MINT LOCK VISUAL ONLY FIX
 * This ONLY hides the visual mint lock message
 * Does NOT modify any JavaScript variables to prevent breaking the site
 */

(function() {
    'use strict';
    
    console.log('[VISUAL-FIX] Starting mint lock visual fix...');
    
    // Function to hide mint lock visually
    function hideMintLockVisual() {
        // Check if user has a tier
        const tier = localStorage.getItem('unlockedTier') || 
                    sessionStorage.getItem('unlockedTier') ||
                    new URLSearchParams(window.location.search).get('tier');
        
        if (!tier || tier === 'null' || tier === 'undefined') {
            console.log('[VISUAL-FIX] No tier found, not hiding mint lock');
            return;
        }
        
        console.log('[VISUAL-FIX] Tier found:', tier, '- hiding mint lock message');
        
        // Find all elements that might contain the mint lock message
        const allDivs = document.querySelectorAll('div');
        
        allDivs.forEach(div => {
            // Check for the specific mint lock container
            if (div.style.cssText && 
                div.style.cssText.includes('border: 2px solid rgb(255, 68, 68)') || 
                div.style.cssText.includes('background: rgba(255, 0, 0, 0.1)')) {
                
                // Check if it contains the mint lock text
                if (div.innerHTML && div.innerHTML.includes('MINT IS LOCKED')) {
                    console.log('[VISUAL-FIX] Found mint lock container, hiding it');
                    div.style.display = 'none';
                    div.style.visibility = 'hidden';
                    div.remove();
                }
            }
        });
        
        // Also hide any h3 with mint lock text
        const headings = document.querySelectorAll('h3');
        headings.forEach(h3 => {
            if (h3.textContent.includes('MINT IS LOCKED')) {
                console.log('[VISUAL-FIX] Found mint lock heading, hiding it');
                const container = h3.parentElement;
                if (container) {
                    container.style.display = 'none';
                    container.remove();
                } else {
                    h3.style.display = 'none';
                    h3.remove();
                }
            }
        });
        
        // Ensure purchase form is visible
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm && purchaseForm.style.display === 'none') {
            console.log('[VISUAL-FIX] Making purchase form visible');
            purchaseForm.style.display = 'block';
            purchaseForm.style.visibility = 'visible';
            purchaseForm.style.opacity = '1';
        }
    }
    
    // Add CSS to help hide mint lock
    function addHideCSS() {
        const style = document.createElement('style');
        style.id = 'mint-lock-visual-fix-css';
        style.textContent = `
            /* Hide mint lock when tier is present */
            body[data-has-tier="true"] div[style*="border: 2px solid rgb(255, 68, 68)"],
            body[data-has-tier="true"] div[style*="background: rgba(255, 0, 0, 0.1)"] {
                display: none !important;
                visibility: hidden !important;
            }
            
            /* Ensure form is visible when tier is present */
            body[data-has-tier="true"] #purchaseForm {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set body attribute if tier exists
    function setTierAttribute() {
        const tier = localStorage.getItem('unlockedTier') || 
                    sessionStorage.getItem('unlockedTier') ||
                    new URLSearchParams(window.location.search).get('tier');
        
        if (tier && tier !== 'null' && tier !== 'undefined') {
            document.body.setAttribute('data-has-tier', 'true');
            document.body.setAttribute('data-tier-type', tier);
            return true;
        }
        return false;
    }
    
    // Run the fix
    function runFix() {
        if (setTierAttribute()) {
            hideMintLockVisual();
        }
    }
    
    // Execute immediately
    addHideCSS();
    runFix();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runFix);
    }
    
    // Run when window loads
    window.addEventListener('load', () => {
        setTimeout(runFix, 100);
    });
    
    // Run periodically for first 3 seconds
    let runCount = 0;
    const interval = setInterval(() => {
        runCount++;
        runFix();
        
        if (runCount >= 10) { // 10 * 300ms = 3 seconds
            clearInterval(interval);
            console.log('[VISUAL-FIX] Monitoring complete');
        }
    }, 300);
    
    // Expose for testing
    window.VISUAL_FIX = {
        hide: hideMintLockVisual,
        check: () => {
            const tier = localStorage.getItem('unlockedTier');
            const form = document.getElementById('purchaseForm');
            console.log('Tier:', tier);
            console.log('Form visible:', form?.style.display !== 'none');
        }
    };
    
    console.log('[VISUAL-FIX] Ready. Test with: VISUAL_FIX.hide()');
    
})();