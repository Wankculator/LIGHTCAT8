/**
 * Main Page Tier Detector
 * Listens for tier unlocks from game iframe
 * Updates purchase options accordingly
 */

(function() {
    'use strict';
    
    console.log('[Tier Detector] Initializing...');
    
    // Check localStorage for unlocked tiers on page load
    function checkUnlockedTiers() {
        const unlockedTier = localStorage.getItem('unlockedTier');
        const justUnlocked = localStorage.getItem('tierJustUnlocked');
        
        if (unlockedTier && justUnlocked === 'true') {
            console.log('[Tier Detector] Found newly unlocked tier:', unlockedTier);
            
            // Clear the flag
            localStorage.removeItem('tierJustUnlocked');
            
            // Update UI to show tier is unlocked
            updatePurchaseOptions(unlockedTier);
            
            // Show notification
            showTierUnlockedNotification(unlockedTier);
        }
    }
    
    // Listen for messages from game iframe
    function listenForGameMessages() {
        window.addEventListener('message', function(event) {
            // Verify message is from our game
            if (event.data && event.data.type === 'tierUnlocked') {
                console.log('[Tier Detector] Received tier unlock message:', event.data.tier);
                
                // Store in localStorage
                localStorage.setItem('unlockedTier', event.data.tier);
                
                // Update UI
                updatePurchaseOptions(event.data.tier);
                
                // Show notification
                showTierUnlockedNotification(event.data.tier);
            }
        });
    }
    
    // Update purchase options based on unlocked tier
    function updatePurchaseOptions(tier) {
        // Find batch selector or purchase section
        const batchSelector = document.querySelector('.batch-selector');
        const purchaseSection = document.querySelector('#purchase');
        
        if (batchSelector || purchaseSection) {
            console.log('[Tier Detector] Updating purchase options for tier:', tier);
            
            // Update max batches based on tier
            const maxBatches = {
                bronze: 5,
                silver: 8,
                gold: 10
            };
            
            // Update batch selector max value
            const batchInput = document.querySelector('#batchCount');
            if (batchInput) {
                batchInput.max = maxBatches[tier] || 5;
                batchInput.placeholder = `1-${maxBatches[tier] || 5}`;
            }
            
            // Show tier badge
            const tierBadge = document.querySelector('.tier-badge') || createTierBadge();
            if (tierBadge) {
                tierBadge.textContent = `${tier.toUpperCase()} TIER`;
                tierBadge.className = `tier-badge ${tier}`;
                tierBadge.style.display = 'inline-block';
            }
            
            // Enable purchase button if it was disabled
            const purchaseBtn = document.querySelector('.purchase-button');
            if (purchaseBtn && purchaseBtn.disabled) {
                purchaseBtn.disabled = false;
                purchaseBtn.textContent = 'PURCHASE TOKENS';
            }
        }
    }
    
    // Create tier badge element
    function createTierBadge() {
        const badge = document.createElement('div');
        badge.className = 'tier-badge';
        badge.style.cssText = `
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
            background: var(--primary-yellow);
            color: #000;
            text-transform: uppercase;
        `;
        
        // Add to purchase section or header
        const purchaseSection = document.querySelector('#purchase');
        if (purchaseSection) {
            purchaseSection.insertBefore(badge, purchaseSection.firstChild);
        }
        
        return badge;
    }
    
    // Show notification when tier is unlocked
    function showTierUnlockedNotification(tier) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff600;
            color: #000;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 16px;
            z-index: 100000;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            border: 2px solid #000;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            🎉 ${tier.toUpperCase()} TIER UNLOCKED!<br>
            <span style="font-size: 12px;">You can now purchase up to ${
                tier === 'bronze' ? 5 : tier === 'silver' ? 8 : 10
            } batches</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // Add animation styles
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .tier-badge.bronze {
                background: #cd7f32;
                color: white;
            }
            
            .tier-badge.silver {
                background: #c0c0c0;
                color: #000;
            }
            
            .tier-badge.gold {
                background: #ffd700;
                color: #000;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize
    function init() {
        console.log('[Tier Detector] Starting tier detection...');
        
        // Add styles
        addAnimationStyles();
        
        // Check for existing unlocked tiers
        checkUnlockedTiers();
        
        // Listen for new unlocks
        listenForGameMessages();
        
        // Also check periodically (for localStorage changes)
        setInterval(checkUnlockedTiers, 1000);
    }
    
    // Run when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose for debugging
    window.tierDetector = {
        check: checkUnlockedTiers,
        update: updatePurchaseOptions,
        notify: showTierUnlockedNotification
    };
    
    console.log('[Tier Detector] Ready');
    
})();