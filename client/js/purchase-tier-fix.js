/**
 * Purchase Tier Fix - Ensures tier parameter is properly handled from game redirect
 */
(function() {
    'use strict';
    
    console.log('[Purchase Tier Fix] Initializing...');
    
    // Function to extract tier from URL
    function getTierFromURL() {
        // Check regular URL params
        let urlParams = new URLSearchParams(window.location.search);
        let tier = urlParams.get('tier');
        
        // Check hash params (e.g., #purchase?tier=gold)
        if (!tier && window.location.hash.includes('?')) {
            const hashParams = window.location.hash.split('?')[1];
            const hashUrlParams = new URLSearchParams(hashParams);
            tier = hashUrlParams.get('tier');
        }
        
        // Also check localStorage for recently unlocked tier
        if (!tier) {
            tier = localStorage.getItem('unlockedTier');
        }
        
        console.log('[Purchase Tier Fix] Detected tier:', tier);
        return tier;
    }
    
    // Function to show purchase section with tier
    function showPurchaseWithTier() {
        const tier = getTierFromURL();
        
        if (tier) {
            console.log('[Purchase Tier Fix] Showing purchase section with tier:', tier);
            
            // Hide other sections
            document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show purchase section
            const purchaseSection = document.getElementById('purchase');
            if (purchaseSection) {
                purchaseSection.style.display = 'block';
                
                // Scroll to purchase section
                setTimeout(() => {
                    purchaseSection.scrollIntoView({ behavior: 'smooth' });
                }, 100);
                
                // Update UI to show unlocked tier
                const maxBatchesEl = document.getElementById('maxBatches');
                const mintButton = document.getElementById('submitRgbInvoice');
                const tierDisplay = document.getElementById('unlocked-tier-display');
                
                let maxBatches = 0;
                switch(tier.toLowerCase()) {
                    case 'bronze':
                        maxBatches = 10;
                        break;
                    case 'silver':
                        maxBatches = 20;
                        break;
                    case 'gold':
                        maxBatches = 30;
                        break;
                }
                
                if (maxBatchesEl) {
                    maxBatchesEl.textContent = maxBatches;
                }
                
                if (mintButton) {
                    mintButton.disabled = false;
                    mintButton.classList.remove('locked');
                    mintButton.innerHTML = 'Generate Lightning Invoice';
                }
                
                // Show tier achievement message
                if (tierDisplay) {
                    tierDisplay.innerHTML = `
                        <div style="background: rgba(255,255,0,0.1); border: 2px solid var(--yellow); border-radius: 10px; padding: 15px; margin-bottom: 20px; text-align: center;">
                            <h3 style="color: var(--yellow); margin: 0 0 10px 0;">🎉 ${tier.toUpperCase()} TIER UNLOCKED! 🎉</h3>
                            <p style="color: #fff; margin: 0;">You can now purchase up to ${maxBatches} batches!</p>
                        </div>
                    `;
                } else {
                    // Create tier display if it doesn't exist
                    const invoiceForm = document.querySelector('.invoice-form');
                    if (invoiceForm) {
                        const tierDiv = document.createElement('div');
                        tierDiv.id = 'unlocked-tier-display';
                        tierDiv.innerHTML = `
                            <div style="background: rgba(255,255,0,0.1); border: 2px solid var(--yellow); border-radius: 10px; padding: 15px; margin-bottom: 20px; text-align: center;">
                                <h3 style="color: var(--yellow); margin: 0 0 10px 0;">🎉 ${tier.toUpperCase()} TIER UNLOCKED! 🎉</h3>
                                <p style="color: #fff; margin: 0;">You can now purchase up to ${maxBatches} batches!</p>
                            </div>
                        `;
                        invoiceForm.parentNode.insertBefore(tierDiv, invoiceForm);
                    }
                }
                
                // Ensure invoice form is visible and ready
                const invoiceForm = document.querySelector('.invoice-form');
                if (invoiceForm) {
                    invoiceForm.style.display = 'block';
                    invoiceForm.style.visibility = 'visible';
                    invoiceForm.style.opacity = '1';
                    
                    // Make sure all form elements are visible
                    const formElements = invoiceForm.querySelectorAll('input, button, label');
                    formElements.forEach(el => {
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                    });
                }
                
                // Focus on RGB invoice input
                const rgbInput = document.getElementById('rgbInvoice');
                if (rgbInput) {
                    rgbInput.focus();
                    rgbInput.placeholder = 'Enter your RGB invoice (e.g., rgb:utxob:...)';
                }
                
                // Clear the tier from localStorage after showing
                setTimeout(() => {
                    localStorage.removeItem('tierJustUnlocked');
                }, 5000);
            }
        }
    }
    
    // Apply fix when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showPurchaseWithTier);
    } else {
        showPurchaseWithTier();
    }
    
    // Also listen for hash changes
    window.addEventListener('hashchange', showPurchaseWithTier);
    
    console.log('[Purchase Tier Fix] Monitoring for tier parameters');
})();