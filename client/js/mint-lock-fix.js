/**
 * Mint Lock Fix
 * Ensures "MINT IS LOCKED" is hidden when tier is unlocked
 */

(function() {
    'use strict';
    
    console.log('[Mint Lock Fix] Initializing...');
    
    // Function to check if tier is unlocked
    function isTierUnlocked() {
        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        let tier = urlParams.get('tier');
        
        // Check hash params
        if (!tier && window.location.hash.includes('?')) {
            const hashParams = window.location.hash.split('?')[1];
            const hashUrlParams = new URLSearchParams(hashParams);
            tier = hashUrlParams.get('tier');
        }
        
        // Check localStorage
        if (!tier) {
            tier = localStorage.getItem('unlockedTier');
        }
        
        return tier !== null && tier !== '';
    }
    
    // Function to hide mint locked message
    function hideMintLockedMessage() {
        const tier = localStorage.getItem('unlockedTier');
        
        if (tier) {
            console.log('[Mint Lock Fix] Tier unlocked:', tier, '- hiding lock message');
            
            // Find and hide all mint locked messages
            const lockMessages = document.querySelectorAll('.mint-locked, .locked-message, [class*="locked"]');
            lockMessages.forEach(msg => {
                if (msg.textContent.includes('MINT IS LOCKED') || 
                    msg.textContent.includes('must play the game')) {
                    msg.style.display = 'none';
                    console.log('[Mint Lock Fix] Hid lock message');
                }
            });
            
            // Also check for any element containing the text
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.childNodes.length === 1 && 
                    el.childNodes[0].nodeType === 3 && 
                    el.textContent.includes('MINT IS LOCKED')) {
                    el.style.display = 'none';
                    console.log('[Mint Lock Fix] Hid element with lock text');
                }
            });
            
            // Show unlock message instead
            const purchaseSection = document.getElementById('purchase');
            if (purchaseSection) {
                // Remove any existing lock message
                const existingLock = purchaseSection.querySelector('.mint-locked-container');
                if (existingLock) {
                    existingLock.remove();
                }
                
                // Add unlocked message if not already there
                if (!purchaseSection.querySelector('#tier-unlocked-message')) {
                    const unlockedMsg = document.createElement('div');
                    unlockedMsg.id = 'tier-unlocked-message';
                    unlockedMsg.style.cssText = `
                        background: #fff600;
                        color: #000;
                        padding: 20px;
                        text-align: center;
                        font-weight: bold;
                        font-size: 20px;
                        margin-bottom: 30px;
                        border: 3px solid #000;
                    `;
                    unlockedMsg.innerHTML = `🎉 ${tier.toUpperCase()} TIER UNLOCKED! 🎉`;
                    
                    purchaseSection.insertBefore(unlockedMsg, purchaseSection.firstChild);
                }
                
                // Enable all form elements
                const inputs = purchaseSection.querySelectorAll('input, button, select');
                inputs.forEach(input => {
                    input.disabled = false;
                    input.classList.remove('locked', 'disabled');
                });
            }
        }
    }
    
    // Monitor for changes
    function startMonitoring() {
        // Initial check
        hideMintLockedMessage();
        
        // Monitor DOM changes
        const observer = new MutationObserver(() => {
            if (isTierUnlocked()) {
                hideMintLockedMessage();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // Also check periodically
        setInterval(() => {
            if (isTierUnlocked()) {
                hideMintLockedMessage();
            }
        }, 500);
    }
    
    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }
    
    // Also listen for hash changes
    window.addEventListener('hashchange', hideMintLockedMessage);
    
    console.log('[Mint Lock Fix] Ready');
    
})();