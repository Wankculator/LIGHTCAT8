/**
 * PERSISTENT MINT LOCK ENFORCEMENT
 * 
 * This script ensures the mint lock overlay STAYS visible and prevents
 * other scripts from accidentally showing the purchase form when mint is locked.
 * 
 * CRITICAL: This must run after all other scripts to override their behavior.
 */

(function() {
    'use strict';
    
    console.log('🔐 [PERSISTENT] Enforcing persistent mint lock...');
    
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
                return true;
            }
        }
        
        // Check URL tier with score validation
        if (tierFromUrl && gameScore > 0) {
            if ((tierFromUrl === 'bronze' && gameScore >= 11) ||
                (tierFromUrl === 'silver' && gameScore >= 18) ||
                (tierFromUrl === 'gold' && gameScore >= 28)) {
                localStorage.setItem('unlockedTier', tierFromUrl);
                return true;
            }
        }
        
        return false;
    }
    
    // Create or ensure lock overlay exists
    function ensureLockOverlay() {
        // Check if we already have the overlay
        let overlay = document.getElementById('persistent-mint-lock');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'persistent-mint-lock';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.98);
                z-index: 99999;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(20px);
            `;
            
            overlay.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(40, 0, 0, 0.98) 100%);
                    border: 4px solid #ff0000;
                    border-radius: 25px;
                    padding: 60px 40px;
                    text-align: center;
                    max-width: 700px;
                    margin: 20px;
                    box-shadow: 0 0 60px rgba(255, 0, 0, 0.5), inset 0 0 30px rgba(255, 0, 0, 0.1);
                    animation: lockGlow 3s ease-in-out infinite;
                ">
                    <div style="font-size: 6rem; margin-bottom: 30px; animation: lockBounce 2s ease-in-out infinite;">🔒</div>
                    <h1 style="
                        color: #ff0000;
                        font-size: 3rem;
                        margin-bottom: 30px;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 4px;
                        text-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
                        animation: textPulse 2s ease-in-out infinite;
                    ">
                        MINT IS LOCKED
                    </h1>
                    
                    <div style="
                        background: rgba(255, 255, 0, 0.15);
                        border: 3px solid var(--yellow, #FFFF00);
                        border-radius: 20px;
                        padding: 35px;
                        margin: 35px 0;
                    ">
                        <p style="
                            color: #FFFFFF;
                            font-size: 1.4rem;
                            margin-bottom: 30px;
                            line-height: 1.7;
                            font-weight: 500;
                        ">
                            Complete the arcade game to unlock token purchasing!
                        </p>
                        
                        <div style="
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                            gap: 20px;
                            margin: 30px 0;
                        ">
                            <div style="padding: 20px; background: rgba(205, 127, 50, 0.25); border: 2px solid #CD7F32; border-radius: 15px;">
                                <div style="font-size: 2.5rem; margin-bottom: 10px;">🥉</div>
                                <div style="color: #CD7F32; font-weight: bold; font-size: 1.1rem;">BRONZE</div>
                                <div style="color: #FFFFFF; font-size: 1rem; margin-top: 8px;">Score 11+</div>
                                <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-top: 5px;">10 batches max</div>
                            </div>
                            <div style="padding: 20px; background: rgba(192, 192, 192, 0.25); border: 2px solid #C0C0C0; border-radius: 15px;">
                                <div style="font-size: 2.5rem; margin-bottom: 10px;">🥈</div>
                                <div style="color: #C0C0C0; font-weight: bold; font-size: 1.1rem;">SILVER</div>
                                <div style="color: #FFFFFF; font-size: 1rem; margin-top: 8px;">Score 18+</div>
                                <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-top: 5px;">20 batches max</div>
                            </div>
                            <div style="padding: 20px; background: rgba(255, 215, 0, 0.25); border: 2px solid #FFD700; border-radius: 15px;">
                                <div style="font-size: 2.5rem; margin-bottom: 10px;">🥇</div>
                                <div style="color: #FFD700; font-weight: bold; font-size: 1.1rem;">GOLD</div>
                                <div style="color: #FFFFFF; font-size: 1rem; margin-top: 8px;">Score 28+</div>
                                <div style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-top: 5px;">30 batches max</div>
                            </div>
                        </div>
                    </div>
                    
                    <a href="#game" onclick="document.getElementById('persistent-mint-lock').style.display='none'; setTimeout(() => { if(!window.gameStarted) document.getElementById('startGameBtn')?.click(); }, 500);" style="
                        display: inline-block;
                        background: linear-gradient(135deg, #FFFF00 0%, #FFD700 100%);
                        color: #000;
                        font-weight: 900;
                        padding: 25px 50px;
                        border-radius: 20px;
                        text-decoration: none;
                        font-size: 1.5rem;
                        text-transform: uppercase;
                        letter-spacing: 3px;
                        transition: all 0.3s ease;
                        box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5);
                        border: 3px solid transparent;
                        animation: buttonGlow 2s ease-in-out infinite;
                    " 
                    onmouseover="
                        this.style.transform='scale(1.08) translateY(-5px)';
                        this.style.boxShadow='0 15px 50px rgba(255, 215, 0, 0.7)';
                    " 
                    onmouseout="
                        this.style.transform='scale(1) translateY(0)';
                        this.style.boxShadow='0 10px 40px rgba(255, 215, 0, 0.5)';
                    ">
                        🎮 PLAY GAME NOW 🎮
                    </a>
                    
                    <div style="
                        margin-top: 35px;
                        padding: 25px;
                        background: rgba(255, 0, 0, 0.15);
                        border: 2px solid #ff4444;
                        border-radius: 15px;
                        font-size: 1rem;
                        color: rgba(255, 255, 255, 0.9);
                    ">
                        <strong style="color: #ff4444; font-size: 1.1rem;">⚠️ Security Notice:</strong><br>
                        Token purchasing is locked until you complete the game. This ensures fair distribution and prevents automated purchases.
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
        }
        
        // Ensure it's visible
        overlay.style.display = 'flex';
        
        // Add animations
        if (!document.getElementById('persistent-lock-animations')) {
            const style = document.createElement('style');
            style.id = 'persistent-lock-animations';
            style.textContent = `
                @keyframes lockGlow {
                    0%, 100% { box-shadow: 0 0 60px rgba(255, 0, 0, 0.5), inset 0 0 30px rgba(255, 0, 0, 0.1); }
                    50% { box-shadow: 0 0 80px rgba(255, 0, 0, 0.8), inset 0 0 40px rgba(255, 0, 0, 0.2); }
                }
                
                @keyframes lockBounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-10px) rotate(-5deg); }
                    75% { transform: translateY(-10px) rotate(5deg); }
                }
                
                @keyframes textPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.02); }
                }
                
                @keyframes buttonGlow {
                    0%, 100% { box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5); }
                    50% { box-shadow: 0 10px 50px rgba(255, 215, 0, 0.8); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Hide purchase form elements
    function hidePurchaseElements() {
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            purchaseForm.style.display = 'none !important';
            purchaseForm.style.visibility = 'hidden !important';
        }
        
        // Hide invoice input section specifically
        const invoiceSection = document.querySelector('.form-group:has(#rgbInvoice)');
        if (invoiceSection) {
            invoiceSection.style.display = 'none !important';
        }
        
        // Replace purchase section content with lock message
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection && !purchaseSection.querySelector('.inline-lock-message')) {
            const container = purchaseSection.querySelector('.container');
            if (container) {
                // Hide all children except the title
                const children = container.children;
                for (let child of children) {
                    if (!child.classList.contains('section-title')) {
                        child.style.display = 'none';
                    }
                }
                
                // Add inline lock message
                const inlineLock = document.createElement('div');
                inlineLock.className = 'inline-lock-message';
                inlineLock.style.cssText = `
                    background: rgba(255, 0, 0, 0.1);
                    border: 3px solid #ff4444;
                    border-radius: 20px;
                    padding: 50px;
                    text-align: center;
                    margin: 40px auto;
                    max-width: 700px;
                `;
                inlineLock.innerHTML = `
                    <div style="font-size: 5rem; margin-bottom: 25px;">🔒</div>
                    <h3 style="color: #ff4444; font-size: 2.5rem; margin-bottom: 25px; font-weight: bold;">
                        PURCHASE LOCKED
                    </h3>
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.3rem; line-height: 1.6;">
                        Complete the arcade game above to unlock token purchasing!
                    </p>
                `;
                container.appendChild(inlineLock);
            }
        }
    }
    
    // Main enforcement function
    function enforceMintLock() {
        if (!hasValidTier()) {
            console.log('🔐 [PERSISTENT] No valid tier - enforcing lock');
            ensureLockOverlay();
            hidePurchaseElements();
            return false;
        } else {
            console.log('✅ [PERSISTENT] Valid tier found - mint unlocked');
            // Remove overlay if it exists
            const overlay = document.getElementById('persistent-mint-lock');
            if (overlay) {
                overlay.style.display = 'none';
            }
            // Remove inline lock message
            const inlineLock = document.querySelector('.inline-lock-message');
            if (inlineLock) {
                inlineLock.remove();
            }
            return true;
        }
    }
    
    // Initial enforcement
    enforceMintLock();
    
    // Re-enforce periodically to override other scripts
    setInterval(() => {
        if (!hasValidTier()) {
            enforceMintLock();
        }
    }, 500);
    
    // Monitor for DOM changes that might show the form
    const observer = new MutationObserver((mutations) => {
        if (!hasValidTier()) {
            const purchaseForm = document.getElementById('purchaseForm');
            if (purchaseForm && purchaseForm.style.display !== 'none') {
                console.log('🔐 [PERSISTENT] Purchase form was shown - re-locking');
                enforceMintLock();
            }
        }
    });
    
    // Start observing when DOM is ready
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    // Listen for tier unlock events
    window.addEventListener('storage', (e) => {
        if (e.key === 'unlockedTier' || e.key === 'gameScore') {
            console.log('🔐 [PERSISTENT] Tier/score changed - rechecking');
            enforceMintLock();
        }
    });
    
    // Listen for hash changes (in case user navigates back from game)
    window.addEventListener('hashchange', () => {
        setTimeout(enforceMintLock, 100);
    });
    
    console.log('🔐 [PERSISTENT] Mint lock persistence active');
})();