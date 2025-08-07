/**
 * FINAL MINT LOCK SYSTEM
 * 
 * Simple red lock message without duplicate tier info
 */

(function() {
    'use strict';
    
    // Check if user has valid tier
    function hasValidTier() {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = window.location.hash.includes('?') ? 
            new URLSearchParams(window.location.hash.split('?')[1]) : new URLSearchParams();
        
        const tierFromUrl = urlParams.get('tier') || hashParams.get('tier');
        const tierFromStorage = localStorage.getItem('unlockedTier');
        const gameScore = parseInt(localStorage.getItem('gameScore')) || 0;
        
        // Check localStorage tier with score validation
        if (tierFromStorage && gameScore > 0) {
            if ((tierFromStorage === 'bronze' && gameScore >= 11) ||
                (tierFromStorage === 'silver' && gameScore >= 18) ||
                (tierFromStorage === 'gold' && gameScore >= 28)) {
                return { valid: true, tier: tierFromStorage, score: gameScore };
            }
        }
        
        // Check URL tier with score validation
        if (tierFromUrl && gameScore > 0) {
            if ((tierFromUrl === 'bronze' && gameScore >= 11) ||
                (tierFromUrl === 'silver' && gameScore >= 18) ||
                (tierFromUrl === 'gold' && gameScore >= 28)) {
                localStorage.setItem('unlockedTier', tierFromUrl);
                return { valid: true, tier: tierFromUrl, score: gameScore };
            }
        }
        
        return { valid: false, tier: null, score: gameScore };
    }
    
    // Create clean lock message
    function createLockMessage() {
        const lockContainer = document.createElement('div');
        lockContainer.id = 'mint-lock-message';
        lockContainer.style.cssText = `
            max-width: 700px;
            margin: 50px auto;
            padding: 50px 40px;
            background: linear-gradient(135deg, rgba(255, 0, 0, 0.05) 0%, rgba(255, 0, 0, 0.1) 100%);
            border: 2px solid rgba(255, 0, 0, 0.5);
            border-radius: 20px;
            text-align: center;
        `;
        
        lockContainer.innerHTML = `
            <h2 style="
                color: #ff4444;
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 25px;
                text-transform: uppercase;
                letter-spacing: 3px;
            ">
                MINT IS LOCKED
            </h2>
            
            <p style="
                color: rgba(255, 255, 255, 0.9);
                font-size: 1.15rem;
                line-height: 1.7;
                margin-bottom: 35px;
                max-width: 500px;
                margin-left: auto;
                margin-right: auto;
            ">
                Complete the arcade game above to unlock token purchasing.<br>
                Score requirements are shown in the game section.
            </p>
            
            <button onclick="
                document.getElementById('game').scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    const startBtn = document.getElementById('startGameBtn');
                    if (startBtn && !window.gameStarted) startBtn.click();
                }, 800);
            " style="
                background: var(--yellow, #FFFF00);
                color: #000000;
                border: none;
                padding: 18px 50px;
                font-size: 1.1rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(255, 255, 0, 0.3);
            "
            onmouseover="
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 30px rgba(255, 255, 0, 0.5)';
            "
            onmouseout="
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 20px rgba(255, 255, 0, 0.3)';
            ">
                PLAY GAME NOW
            </button>
        `;
        
        return lockContainer;
    }
    
    // Create unlock message
    function createUnlockMessage(tierInfo) {
        const unlockContainer = document.createElement('div');
        unlockContainer.id = 'mint-unlock-notification';
        unlockContainer.style.cssText = `
            max-width: 700px;
            margin: 30px auto 20px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(255, 255, 0, 0.1) 0%, rgba(255, 255, 0, 0.05) 100%);
            border: 2px solid var(--yellow, #FFFF00);
            border-radius: 15px;
            text-align: center;
        `;
        
        const tierColors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700'
        };
        
        const maxBatches = {
            bronze: 10,
            silver: 20,
            gold: 30
        };
        
        unlockContainer.innerHTML = `
            <div style="
                font-size: 1.1rem;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
            ">
                <span style="color: ${tierColors[tierInfo.tier]}; font-weight: 700; text-transform: uppercase;">
                    ${tierInfo.tier} TIER UNLOCKED
                </span>
                <span style="margin: 0 10px;">•</span>
                <span>Score: ${tierInfo.score} points</span>
                <span style="margin: 0 10px;">•</span>
                <span>Maximum ${maxBatches[tierInfo.tier]} batches available</span>
            </div>
        `;
        
        return unlockContainer;
    }
    
    // Main enforcement function
    function updatePurchaseSection() {
        const purchaseSection = document.getElementById('purchase');
        if (!purchaseSection) return;
        
        const container = purchaseSection.querySelector('.container');
        if (!container) return;
        
        // Remove any existing lock/unlock messages and overlays
        const elementsToRemove = [
            'mint-lock-message',
            'mint-unlock-notification',
            'persistent-mint-lock',
            'mint-lock-container',
            'immediate-mint-lock-overlay'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        // Also remove class-based elements
        document.querySelectorAll('.inline-lock-message, .mint-locked-message').forEach(el => el.remove());
        
        const tierInfo = hasValidTier();
        const purchaseForm = document.getElementById('purchaseForm');
        
        // Find the position to insert our message (after the purchase flow info, before the form)
        let insertPosition = purchaseForm;
        
        // Try to find the feature boxes or purchase flow section
        const featureBoxes = container.querySelector('.feature-boxes');
        const purchaseFlowSection = Array.from(container.children).find(child => {
            return child.textContent && child.textContent.includes('Purchase Flow:');
        });
        
        if (featureBoxes) {
            insertPosition = featureBoxes.nextElementSibling || purchaseForm;
        } else if (purchaseFlowSection) {
            // Find the last element of the purchase flow section
            let nextSibling = purchaseFlowSection.nextElementSibling;
            while (nextSibling && !nextSibling.id && nextSibling !== purchaseForm) {
                if (nextSibling.classList && nextSibling.classList.contains('feature-boxes')) {
                    insertPosition = nextSibling.nextElementSibling || purchaseForm;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
            if (!insertPosition || insertPosition === purchaseFlowSection) {
                insertPosition = purchaseForm;
            }
        }
        
        if (!tierInfo.valid) {
            // Remove tier-unlocked class from body
            document.body.classList.remove('tier-unlocked');
            
            // Hide ONLY the purchase form, not the info sections
            if (purchaseForm) {
                purchaseForm.style.display = 'none';
            }
            
            // Add lock message before the form position
            if (insertPosition && insertPosition.parentNode === container) {
                container.insertBefore(createLockMessage(), insertPosition);
            } else {
                // Fallback: add at the end
                container.appendChild(createLockMessage());
            }
            
        } else {
            // Add tier-unlocked class to body
            document.body.classList.add('tier-unlocked');
            
            // Show purchase form
            if (purchaseForm) {
                purchaseForm.style.display = 'block';
            }
            
            // Add unlock notification after the purchase flow info
            if (!document.getElementById('mint-unlock-notification')) {
                if (insertPosition && insertPosition.parentNode === container) {
                    container.insertBefore(createUnlockMessage(tierInfo), insertPosition);
                }
            }
            
            // Update batch selector max value
            const batchInput = document.getElementById('batchCount');
            if (batchInput) {
                const maxBatches = {
                    bronze: 10,
                    silver: 20,
                    gold: 30
                };
                
                batchInput.max = maxBatches[tierInfo.tier];
                if (parseInt(batchInput.value) > maxBatches[tierInfo.tier]) {
                    batchInput.value = maxBatches[tierInfo.tier];
                }
            }
        }
    }
    
    // Initial update
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updatePurchaseSection);
    } else {
        updatePurchaseSection();
    }
    
    // Monitor for changes
    setInterval(updatePurchaseSection, 1000);
    
    // Listen for storage events
    window.addEventListener('storage', (e) => {
        if (e.key === 'unlockedTier' || e.key === 'gameScore') {
            updatePurchaseSection();
        }
    });
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        setTimeout(updatePurchaseSection, 100);
    });
    
    console.log('[MINT-LOCK-FINAL] Mint lock system initialized');
})();