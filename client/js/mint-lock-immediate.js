/**
 * IMMEDIATE MINT LOCK ENFORCEMENT
 * 
 * This script runs IMMEDIATELY when loaded to ensure users see the mint lock
 * message BEFORE they can interact with the purchase form.
 * 
 * CRITICAL: Must be loaded BEFORE the main script to prevent race conditions.
 */

(function() {
    'use strict';
    
    console.log('🔒 [IMMEDIATE] Enforcing mint lock...');
    
    // Execute immediately when script loads (don't wait for DOM ready)
    function enforceImmediateMintLock() {
        // Check for legitimate tier unlock
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = window.location.hash.includes('?') ? 
            new URLSearchParams(window.location.hash.split('?')[1]) : new URLSearchParams();
        
        const tierFromUrl = urlParams.get('tier') || hashParams.get('tier');
        const tierFromStorage = localStorage.getItem('unlockedTier');
        const gameScore = parseInt(localStorage.getItem('gameScore')) || 0;
        
        console.log('🔒 [IMMEDIATE] Checking tier unlock:', {
            tierFromUrl,
            tierFromStorage,
            gameScore
        });
        
        // Determine if user has legitimate tier
        let hasValidTier = false;
        let validTier = null;
        
        // Check localStorage tier with score validation
        if (tierFromStorage && gameScore > 0) {
            if ((tierFromStorage === 'bronze' && gameScore >= 11) ||
                (tierFromStorage === 'silver' && gameScore >= 15) ||
                (tierFromStorage === 'gold' && gameScore >= 25)) {
                hasValidTier = true;
                validTier = tierFromStorage;
            }
        }
        
        // Check URL tier with score validation
        if (!hasValidTier && tierFromUrl && gameScore > 0) {
            if ((tierFromUrl === 'bronze' && gameScore >= 11) ||
                (tierFromUrl === 'silver' && gameScore >= 15) ||
                (tierFromUrl === 'gold' && gameScore >= 25)) {
                hasValidTier = true;
                validTier = tierFromUrl;
                localStorage.setItem('unlockedTier', tierFromUrl);
            }
        }
        
        // If no valid tier, show immediate lock screen
        if (!hasValidTier) {
            console.log('🔒 [IMMEDIATE] MINT IS LOCKED - Showing lock screen');
            showImmediateLockScreen();
            return false;
        } else {
            console.log('✅ [IMMEDIATE] MINT UNLOCKED - Valid tier:', validTier);
            return true;
        }
    }
    
    function showImmediateLockScreen() {
        // Create lock overlay that covers the entire purchase section
        const lockOverlay = document.createElement('div');
        lockOverlay.id = 'immediate-mint-lock-overlay';
        lockOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(10px);
        `;
        
        lockOverlay.innerHTML = `
            <div style="
                background: rgba(20, 20, 20, 0.95);
                border: 3px solid #ff4444;
                border-radius: 20px;
                padding: 50px;
                text-align: center;
                max-width: 600px;
                margin: 20px;
                animation: lockPulse 2s infinite;
            ">
                <div style="font-size: 5rem; margin-bottom: 30px; animation: bounce 1s infinite;">🔒</div>
                <h1 style="
                    color: #ff4444;
                    font-size: 2.5rem;
                    margin-bottom: 30px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    text-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
                ">
                    MINT IS LOCKED
                </h1>
                <div style="
                    background: rgba(255, 255, 0, 0.1);
                    border: 2px solid var(--yellow, #FFD700);
                    border-radius: 15px;
                    padding: 30px;
                    margin: 30px 0;
                ">
                    <p style="
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 1.3rem;
                        margin-bottom: 25px;
                        line-height: 1.6;
                    ">
                        You must complete the arcade game to unlock token purchasing!
                    </p>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                        margin: 25px 0;
                    ">
                        <div style="padding: 15px; background: rgba(205, 127, 50, 0.2); border: 1px solid #CD7F32; border-radius: 10px;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">🥉</div>
                            <div style="color: #CD7F32; font-weight: bold;">BRONZE</div>
                            <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Score 11+</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.8rem;">10 batches max</div>
                        </div>
                        <div style="padding: 15px; background: rgba(192, 192, 192, 0.2); border: 1px solid #C0C0C0; border-radius: 10px;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">🥈</div>
                            <div style="color: #C0C0C0; font-weight: bold;">SILVER</div>
                            <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Score 15+</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.8rem;">20 batches max</div>
                        </div>
                        <div style="padding: 15px; background: rgba(255, 215, 0, 0.2); border: 1px solid #FFD700; border-radius: 10px;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">🥇</div>
                            <div style="color: #FFD700; font-weight: bold;">GOLD</div>
                            <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Score 25+</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.8rem;">30 batches max</div>
                        </div>
                    </div>
                </div>
                <a href="/game.html" style="
                    display: inline-block;
                    background: linear-gradient(45deg, var(--yellow, #FFD700), #FFA500);
                    color: #000;
                    font-weight: bold;
                    padding: 20px 40px;
                    border-radius: 15px;
                    text-decoration: none;
                    font-size: 1.3rem;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
                    border: 3px solid transparent;
                " 
                onmouseover="
                    this.style.transform='scale(1.05) translateY(-3px)';
                    this.style.boxShadow='0 12px 35px rgba(255, 215, 0, 0.6)';
                    this.style.borderColor='var(--yellow, #FFD700)';
                " 
                onmouseout="
                    this.style.transform='scale(1) translateY(0)';
                    this.style.boxShadow='0 8px 25px rgba(255, 215, 0, 0.4)';
                    this.style.borderColor='transparent';
                ">
                    🎮 PLAY GAME TO UNLOCK 🎮
                </a>
                <div style="
                    margin-top: 30px;
                    padding: 20px;
                    background: rgba(255, 0, 0, 0.1);
                    border: 1px solid #ff4444;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.8);
                ">
                    <strong style="color: #ff4444;">Security Notice:</strong><br>
                    This prevents unauthorized token purchases and ensures fair game completion.
                </div>
            </div>
        `;
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes lockPulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4); }
                70% { box-shadow: 0 0 0 15px rgba(255, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
        
        // Add to page immediately
        document.body.appendChild(lockOverlay);
        
        // Also hide the purchase form if it exists
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            purchaseForm.style.display = 'none';
        }
        
        // Disable any purchase-related buttons
        document.addEventListener('DOMContentLoaded', function() {
            const purchaseButtons = document.querySelectorAll(
                '#submitRgbInvoice, button[type="submit"], .btn[onclick*="submit"]'
            );
            purchaseButtons.forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                }
            });
        });
    }
    
    function removeLockScreen() {
        const overlay = document.getElementById('immediate-mint-lock-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Re-enable purchase form
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            purchaseForm.style.display = 'block';
        }
    }
    
    // Execute immediately
    const mintUnlocked = enforceImmediateMintLock();
    
    // Also check when DOM is ready in case elements weren't loaded yet
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (!mintUnlocked) {
                showImmediateLockScreen();
            }
        });
    }
    
    // Monitor for tier changes
    let currentTier = localStorage.getItem('unlockedTier');
    setInterval(() => {
        const newTier = localStorage.getItem('unlockedTier');
        if (newTier !== currentTier) {
            currentTier = newTier;
            console.log('🔒 [IMMEDIATE] Tier changed, re-checking lock...');
            
            const unlocked = enforceImmediateMintLock();
            if (unlocked) {
                removeLockScreen();
            }
        }
    }, 1000);
    
    // Listen for storage events (tier updates from game)
    window.addEventListener('storage', function(e) {
        if (e.key === 'unlockedTier') {
            console.log('🔒 [IMMEDIATE] Storage event - tier updated');
            const unlocked = enforceImmediateMintLock();
            if (unlocked) {
                removeLockScreen();
            }
        }
    });
    
    console.log('🔒 [IMMEDIATE] Mint lock enforcement ready');
    
})();