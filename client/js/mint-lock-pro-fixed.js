/**
 * PROFESSIONAL MINT LOCK SYSTEM - FIXED VERSION
 * 
 * Adds lock message AFTER the RGB Protocol info, doesn't replace existing content
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
            max-width: 800px;
            margin: 60px auto;
            padding: 60px 40px;
            background: linear-gradient(135deg, rgba(255, 255, 0, 0.03) 0%, rgba(255, 255, 0, 0.08) 100%);
            border: 2px solid rgba(255, 255, 0, 0.3);
            border-radius: 20px;
            text-align: center;
        `;
        
        lockContainer.innerHTML = `
            <h2 style="
                color: #FFFFFF;
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 3px;
            ">
                MINT IS LOCKED
            </h2>
            
            <p style="
                color: rgba(255, 255, 255, 0.9);
                font-size: 1.2rem;
                line-height: 1.8;
                margin-bottom: 40px;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            ">
                Token purchasing requires completing the arcade game above.<br>
                Play the game and achieve a minimum score to unlock purchase tiers.
            </p>
            
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 40px auto;
                max-width: 700px;
            ">
                <div style="
                    padding: 25px;
                    background: rgba(205, 127, 50, 0.1);
                    border: 1px solid rgba(205, 127, 50, 0.4);
                    border-radius: 12px;
                ">
                    <div style="color: #CD7F32; font-weight: 700; font-size: 1.3rem; margin-bottom: 10px;">BRONZE TIER</div>
                    <div style="color: rgba(255, 255, 255, 0.9); font-size: 1rem;">Score 11+ points</div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-top: 8px;">Unlock 10 batches</div>
                </div>
                
                <div style="
                    padding: 25px;
                    background: rgba(192, 192, 192, 0.1);
                    border: 1px solid rgba(192, 192, 192, 0.4);
                    border-radius: 12px;
                ">
                    <div style="color: #C0C0C0; font-weight: 700; font-size: 1.3rem; margin-bottom: 10px;">SILVER TIER</div>
                    <div style="color: rgba(255, 255, 255, 0.9); font-size: 1rem;">Score 18+ points</div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-top: 8px;">Unlock 20 batches</div>
                </div>
                
                <div style="
                    padding: 25px;
                    background: rgba(255, 215, 0, 0.1);
                    border: 1px solid rgba(255, 215, 0, 0.4);
                    border-radius: 12px;
                ">
                    <div style="color: #FFD700; font-weight: 700; font-size: 1.3rem; margin-bottom: 10px;">GOLD TIER</div>
                    <div style="color: rgba(255, 255, 255, 0.9); font-size: 1rem;">Score 28+ points</div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-top: 8px;">Unlock 30 batches</div>
                </div>
            </div>
            
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
                padding: 20px 60px;
                font-size: 1.2rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(255, 255, 0, 0.3);
                margin-top: 20px;
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
            
            <p style="
                color: rgba(255, 255, 255, 0.5);
                font-size: 0.9rem;
                margin-top: 30px;
                font-style: italic;
            ">
                This mechanism ensures fair token distribution and prevents automated purchases.
            </p>
        `;
        
        return lockContainer;
    }
    
    // Create unlock message
    function createUnlockMessage(tierInfo) {
        const unlockContainer = document.createElement('div');
        unlockContainer.id = 'mint-unlock-notification';
        unlockContainer.style.cssText = `
            max-width: 800px;
            margin: 40px auto 20px;
            padding: 25px;
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
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            ">
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
        
        // Remove any existing lock/unlock messages
        const existingLock = document.getElementById('mint-lock-message');
        const existingUnlock = document.getElementById('mint-unlock-notification');
        const existingOverlay = document.getElementById('persistent-mint-lock');
        const existingInlineLock = document.querySelector('.inline-lock-message');
        
        if (existingLock) existingLock.remove();
        if (existingUnlock) existingUnlock.remove();
        if (existingOverlay) existingOverlay.remove();
        if (existingInlineLock) existingInlineLock.remove();
        
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
    
    console.log('[MINT-LOCK-PRO-FIXED] Professional mint lock system initialized');
})();