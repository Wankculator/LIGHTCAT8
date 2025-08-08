/**
 * UNIFIED MINT LOCK SYSTEM
 * 
 * Single source of truth for mint locking with correct tier requirements
 * Replaces all conflicting mint lock scripts
 */

(function() {
    'use strict';
    
    // CANONICAL TIER REQUIREMENTS - Single source of truth
    const TIER_REQUIREMENTS = {
        bronze: { min: 11, max: 14, batches: 10 },
        silver: { min: 15, max: 24, batches: 20 },
        gold: { min: 25, max: Infinity, batches: 30 }
    };
    
    // Determine tier from score
    function getTierFromScore(score) {
        if (score >= TIER_REQUIREMENTS.gold.min) return 'gold';
        if (score >= TIER_REQUIREMENTS.silver.min) return 'silver';
        if (score >= TIER_REQUIREMENTS.bronze.min) return 'bronze';
        return null;
    }
    
    // Check if user has valid tier
    function checkUserTier() {
        const gameScore = parseInt(localStorage.getItem('gameScore')) || 0;
        const storedTier = localStorage.getItem('unlockedTier');
        
        // Get the correct tier based on score
        const correctTier = getTierFromScore(gameScore);
        
        // If stored tier doesn't match score, fix it
        if (correctTier && storedTier !== correctTier) {
            console.log(`[MINT-UNIFIED] Fixing tier mismatch: ${storedTier} -> ${correctTier}`);
            localStorage.setItem('unlockedTier', correctTier);
        }
        
        // Check URL params as fallback
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = window.location.hash.includes('?') ? 
            new URLSearchParams(window.location.hash.split('?')[1]) : new URLSearchParams();
        
        const tierFromUrl = urlParams.get('tier') || hashParams.get('tier');
        
        // Validate URL tier against score
        if (tierFromUrl && !correctTier) {
            const urlTierValid = getTierFromScore(gameScore) === tierFromUrl;
            if (urlTierValid) {
                localStorage.setItem('unlockedTier', tierFromUrl);
                return { valid: true, tier: tierFromUrl, score: gameScore };
            }
        }
        
        return {
            valid: !!correctTier,
            tier: correctTier,
            score: gameScore
        };
    }
    
    // Create clean lock message
    function createLockMessage() {
        // Remove any existing lock messages first
        const existing = document.getElementById('mint-lock-message');
        if (existing) existing.remove();
        
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
            
            <button id="playGameButton" style="
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
            ">
                PLAY GAME NOW
            </button>
        `;
        
        // Add event listener after element is in DOM
        setTimeout(() => {
            const playBtn = document.getElementById('playGameButton');
            if (playBtn) {
                playBtn.addEventListener('click', function() {
                    document.getElementById('game').scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        const startBtn = document.getElementById('startGameBtn');
                        if (startBtn && !window.gameStarted) startBtn.click();
                    }, 800);
                });
                
                // Add hover effects
                playBtn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 30px rgba(255, 255, 0, 0.5)';
                });
                
                playBtn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 20px rgba(255, 255, 0, 0.3)';
                });
            }
        }, 100);
        
        return lockContainer;
    }
    
    // Create unlock message
    function createUnlockMessage(tierInfo) {
        // Remove any existing unlock messages first
        const existing = document.getElementById('mint-unlock-notification');
        if (existing) existing.remove();
        
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
                <span>Maximum ${TIER_REQUIREMENTS[tierInfo.tier].batches} batches available</span>
            </div>
        `;
        
        return unlockContainer;
    }
    
    // Remove all conflicting overlays and messages
    function cleanupOldElements() {
        const elementsToRemove = [
            'persistent-mint-lock',
            'immediate-mint-lock-overlay',
            'mint-lock-container'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        // Remove class-based elements
        document.querySelectorAll('.inline-lock-message, .mint-locked-message, .mint-locked-container').forEach(el => el.remove());
    }
    
    // Main update function
    function updatePurchaseSection() {
        const purchaseSection = document.getElementById('purchase');
        if (!purchaseSection) return;
        
        const container = purchaseSection.querySelector('.container');
        if (!container) return;
        
        // Clean up old elements
        cleanupOldElements();
        
        const tierInfo = checkUserTier();
        const purchaseForm = document.getElementById('purchaseForm');
        
        // Find insertion point (after feature boxes, before form)
        let insertPosition = purchaseForm;
        const featureBoxes = container.querySelector('.feature-boxes');
        if (featureBoxes) {
            insertPosition = featureBoxes.nextElementSibling || purchaseForm;
        }
        
        if (!tierInfo.valid) {
            // Set global mint lock variable if it exists
            if (typeof window.mintLocked !== 'undefined') {
                window.mintLocked = true;
            }
            
            // Hide purchase form
            if (purchaseForm) {
                purchaseForm.style.display = 'none';
                // Make sure buttons are NOT disabled (they should work when form is shown)
                purchaseForm.querySelectorAll('button, input[type="submit"]').forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                });
            }
            
            // Remove body class
            document.body.classList.remove('tier-unlocked');
            
            // Add lock message
            const lockMessage = createLockMessage();
            if (insertPosition && insertPosition.parentNode === container) {
                container.insertBefore(lockMessage, insertPosition);
            } else {
                container.appendChild(lockMessage);
            }
            
        } else {
            // Set global variables if they exist
            if (typeof window.mintLocked !== 'undefined') {
                window.mintLocked = false;
            }
            if (typeof window.unlockedTier !== 'undefined') {
                window.unlockedTier = tierInfo.tier;
            }
            if (typeof window.maxBatches !== 'undefined') {
                window.maxBatches = TIER_REQUIREMENTS[tierInfo.tier].batches;
            }
            
            // Add body class
            document.body.classList.add('tier-unlocked');
            
            // Show purchase form
            if (purchaseForm) {
                purchaseForm.style.display = 'block';
                
                // Ensure all buttons are enabled
                purchaseForm.querySelectorAll('button, input[type="submit"]').forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                });
            }
            
            // Update batch selector limits
            const batchInput = document.getElementById('batchCount');
            if (batchInput) {
                const maxBatches = TIER_REQUIREMENTS[tierInfo.tier].batches;
                batchInput.max = maxBatches;
                batchInput.setAttribute('max', maxBatches);
                
                // Fix value if it exceeds new max
                if (parseInt(batchInput.value) > maxBatches) {
                    batchInput.value = maxBatches;
                    // Trigger change event to update total
                    batchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            
            // Update batch selector buttons
            const decreaseBtn = document.querySelector('.batch-selector button[onclick*="decrease"]');
            const increaseBtn = document.querySelector('.batch-selector button[onclick*="increase"]');
            
            if (decreaseBtn) {
                decreaseBtn.disabled = false;
                decreaseBtn.style.opacity = '1';
                decreaseBtn.style.cursor = 'pointer';
            }
            
            if (increaseBtn) {
                increaseBtn.disabled = false;
                increaseBtn.style.opacity = '1';
                increaseBtn.style.cursor = 'pointer';
            }
            
            // Add unlock notification
            const unlockMessage = createUnlockMessage(tierInfo);
            if (insertPosition && insertPosition.parentNode === container) {
                container.insertBefore(unlockMessage, insertPosition);
            }
            
            // Remove any lock messages
            const lockMsg = document.getElementById('mint-lock-message');
            if (lockMsg) lockMsg.remove();
        }
    }
    
    // CSS to prevent flash
    function injectPreventFlashCSS() {
        if (document.getElementById('mint-unified-css')) return;
        
        const style = document.createElement('style');
        style.id = 'mint-unified-css';
        style.textContent = `
            /* Hide purchase form by default */
            #purchaseForm {
                display: none !important;
            }
            
            /* Show when tier is unlocked */
            body.tier-unlocked #purchaseForm {
                display: block !important;
            }
            
            /* Ensure buttons are not disabled by CSS */
            body.tier-unlocked #purchaseForm button,
            body.tier-unlocked #purchaseForm input[type="submit"] {
                opacity: 1 !important;
                cursor: pointer !important;
            }
        `;
        
        if (document.head) {
            document.head.insertBefore(style, document.head.firstChild);
        }
    }
    
    // Initialize
    function initialize() {
        console.log('[MINT-UNIFIED] Initializing unified mint system');
        
        // Inject CSS immediately
        injectPreventFlashCSS();
        
        // Initial update
        updatePurchaseSection();
        
        // Set up monitoring
        setInterval(updatePurchaseSection, 1000);
        
        // Listen for storage changes
        window.addEventListener('storage', function(e) {
            if (e.key === 'unlockedTier' || e.key === 'gameScore') {
                console.log('[MINT-UNIFIED] Storage changed, updating');
                updatePurchaseSection();
            }
        });
        
        // Listen for hash changes
        window.addEventListener('hashchange', function() {
            setTimeout(updatePurchaseSection, 100);
        });
    }
    
    // Start immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Export for testing
    window.mintSystemUnified = {
        TIER_REQUIREMENTS,
        getTierFromScore,
        checkUserTier,
        updatePurchaseSection
    };
    
})();