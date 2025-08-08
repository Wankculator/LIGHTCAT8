/**
 * Purchase Unlock Fix
 * Ensures MINT IS LOCKED is properly hidden when tier is unlocked
 * Following CLAUDE.md atomic fix principles
 */

(function() {
    'use strict';
    
    console.log('[Purchase Unlock Fix] Starting...');
    
    // Function to get unlocked tier
    function getUnlockedTier() {
        // Check URL params first
        const urlParams = new URLSearchParams(window.location.search);
        let tier = urlParams.get('tier');
        
        // Check hash params (e.g., #purchase?tier=gold)
        if (!tier && window.location.hash.includes('?')) {
            const hashParams = window.location.hash.split('?')[1];
            const hashUrlParams = new URLSearchParams(hashParams);
            tier = hashUrlParams.get('tier');
        }
        
        // Check localStorage
        if (!tier) {
            tier = localStorage.getItem('unlockedTier');
        }
        
        console.log('[Purchase Unlock Fix] Detected tier:', tier);
        return tier;
    }
    
    // Function to unlock purchase section
    function unlockPurchaseSection() {
        const tier = getUnlockedTier();
        
        if (!tier) {
            console.log('[Purchase Unlock Fix] No tier found');
            return;
        }
        
        console.log('[Purchase Unlock Fix] Unlocking for tier:', tier);
        
        // Hide ALL mint locked messages
        const hideElements = [
            '.mint-locked',
            '.mint-locked-container',
            '.locked-message',
            '[class*="mint-lock"]',
            'div:contains("MINT IS LOCKED")',
            'p:contains("must play the game")',
            'div:contains("Score 11+ to unlock")'
        ];
        
        hideElements.forEach(selector => {
            try {
                // For complex selectors
                if (selector.includes(':contains')) {
                    const searchText = selector.match(/:contains\("(.+?)"\)/)[1];
                    document.querySelectorAll('div, p, span').forEach(el => {
                        if (el.textContent.includes(searchText)) {
                            el.style.display = 'none';
                            console.log('[Purchase Unlock Fix] Hid element with text:', searchText);
                        }
                    });
                } else {
                    // Normal selectors
                    document.querySelectorAll(selector).forEach(el => {
                        el.style.display = 'none';
                        console.log('[Purchase Unlock Fix] Hid element:', selector);
                    });
                }
            } catch (e) {
                // Ignore selector errors
            }
        });
        
        // Show unlock message
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection) {
            // Check if unlock message already exists
            if (!document.getElementById('tier-unlock-banner')) {
                const banner = document.createElement('div');
                banner.id = 'tier-unlock-banner';
                banner.style.cssText = `
                    background: #fff600;
                    color: #000000;
                    padding: 25px;
                    text-align: center;
                    font-size: 24px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 30px;
                    border: 4px solid #000000;
                    box-shadow: 0 0 20px rgba(255, 246, 0, 0.5);
                `;
                banner.innerHTML = `${tier.toUpperCase()} TIER UNLOCKED`;
                
                // Insert at beginning of purchase section
                purchaseSection.insertBefore(banner, purchaseSection.firstChild);
            }
            
            // Enable all form inputs
            const inputs = purchaseSection.querySelectorAll('input, button, select, textarea');
            inputs.forEach(input => {
                input.disabled = false;
                input.classList.remove('locked', 'disabled');
                input.style.opacity = '1';
                input.style.cursor = 'pointer';
            });
            
            // Update batch limits based on tier - UPDATED VALUES
            const batchLimits = {
                bronze: 10,  // Updated from 5
                silver: 20,  // Updated from 8
                gold: 30     // Updated from 10
            };
            
            const limit = batchLimits[tier.toLowerCase()] || 5;
            
            // Update batch count input
            const batchInput = document.getElementById('batchCount');
            if (batchInput) {
                batchInput.max = limit;
                batchInput.placeholder = `1-${limit} batches`;
            }
            
            // Update max batches display
            const maxBatchesEl = document.getElementById('maxBatches');
            if (maxBatchesEl) {
                maxBatchesEl.textContent = limit;
            }
            
            // Show invoice form
            const invoiceForm = document.querySelector('.invoice-form');
            if (invoiceForm) {
                invoiceForm.style.display = 'block';
                invoiceForm.style.visibility = 'visible';
                invoiceForm.style.opacity = '1';
            }
            
            // Focus RGB invoice input
            const rgbInput = document.getElementById('rgbInvoice');
            if (rgbInput) {
                rgbInput.focus();
            }
        }
    }
    
    // Monitor and apply fixes
    function startMonitoring() {
        // Initial unlock
        unlockPurchaseSection();
        
        // Monitor DOM changes
        const observer = new MutationObserver((mutations) => {
            // Check if mint locked message appears
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.textContent && 
                            node.textContent.includes('MINT IS LOCKED')) {
                            console.log('[Purchase Unlock Fix] Detected lock message, removing...');
                            unlockPurchaseSection();
                        }
                    });
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Also check periodically
        setInterval(() => {
            if (getUnlockedTier()) {
                // Look for any visible lock messages
                const lockElements = document.querySelectorAll('*');
                lockElements.forEach(el => {
                    if (el.textContent && el.textContent.includes('MINT IS LOCKED') && 
                        window.getComputedStyle(el).display !== 'none') {
                        unlockPurchaseSection();
                    }
                });
            }
        }, 1000);
    }
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }
    
    // Also listen for hash changes
    window.addEventListener('hashchange', unlockPurchaseSection);
    
    // Expose for debugging
    window.purchaseUnlockFix = {
        unlock: unlockPurchaseSection,
        getTier: getUnlockedTier
    };
    
    console.log('[Purchase Unlock Fix] Ready');
    
})();