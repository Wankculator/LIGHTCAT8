/**
 * IMMEDIATE MINT LOCK - Shows lock message RIGHT ON THE PURCHASE SECTION
 * This runs INSTANTLY when loaded and puts the lock directly where users see it
 */

// Execute IMMEDIATELY - no waiting!
(function() {
    'use strict';
    
    console.log('🔒 ENFORCING IMMEDIATE MINT LOCK...');
    
    // Check if user has valid tier
    function hasValidTier() {
        const tier = localStorage.getItem('unlockedTier');
        const score = parseInt(localStorage.getItem('gameScore')) || 0;
        
        if (!tier || score === 0) {
            console.log('🔒 No valid tier found - LOCKING MINT');
            return false;
        }
        
        // Validate tier against score
        const validTiers = {
            'bronze': score >= 11,
            'silver': score >= 15,
            'gold': score >= 25
        };
        
        const isValid = validTiers[tier] || false;
        console.log(`🔒 Tier: ${tier}, Score: ${score}, Valid: ${isValid}`);
        return isValid;
    }
    
    // Create and show the lock message
    function showMintLock() {
        console.log('🔒 SHOWING MINT LOCK OVERLAY');
        
        // Remove any existing lock
        const existing = document.getElementById('mint-lock-message');
        if (existing) existing.remove();
        
        // Create the lock message
        const lockDiv = document.createElement('div');
        lockDiv.id = 'mint-lock-message';
        lockDiv.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 999999 !important;
            background: linear-gradient(135deg, rgba(20, 20, 20, 0.98), rgba(40, 40, 40, 0.98)) !important;
            border: 4px solid #ff4444 !important;
            border-radius: 25px !important;
            padding: 60px !important;
            text-align: center !important;
            max-width: 90% !important;
            width: 700px !important;
            box-shadow: 0 0 100px rgba(255, 68, 68, 0.8), 0 0 200px rgba(255, 68, 68, 0.4) !important;
            animation: mintLockPulse 2s infinite !important;
            backdrop-filter: blur(10px) !important;
        `;
        
        lockDiv.innerHTML = `
            <style>
                @keyframes mintLockPulse {
                    0%, 100% { 
                        box-shadow: 0 0 100px rgba(255, 68, 68, 0.8), 0 0 200px rgba(255, 68, 68, 0.4);
                        border-color: #ff4444;
                    }
                    50% { 
                        box-shadow: 0 0 150px rgba(255, 68, 68, 1), 0 0 300px rgba(255, 68, 68, 0.6);
                        border-color: #ff6666;
                    }
                }
                @keyframes lockShake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
                @keyframes glowText {
                    0%, 100% { text-shadow: 0 0 30px rgba(255, 68, 68, 0.8); }
                    50% { text-shadow: 0 0 50px rgba(255, 68, 68, 1), 0 0 70px rgba(255, 68, 68, 0.8); }
                }
            </style>
            
            <div style="font-size: 7rem; margin-bottom: 30px; animation: lockShake 2s infinite;">
                🔒
            </div>
            
            <h1 style="
                color: #ff4444;
                font-size: 3.5rem;
                margin: 0 0 30px 0;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 5px;
                animation: glowText 2s infinite;
                font-family: 'Orbitron', 'Inter', sans-serif;
            ">
                MINT IS LOCKED
            </h1>
            
            <p style="
                color: #ffffff;
                font-size: 1.5rem;
                margin: 0 0 40px 0;
                line-height: 1.8;
                font-weight: 300;
            ">
                Play the LIGHTCAT arcade game to unlock<br>
                exclusive token purchasing privileges!
            </p>
            
            <div style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin: 40px 0;
            ">
                <div style="
                    padding: 25px 15px;
                    background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
                    border: 2px solid #CD7F32;
                    border-radius: 15px;
                    transition: all 0.3s;
                ">
                    <div style="font-size: 3.5rem; margin-bottom: 15px;">🥉</div>
                    <div style="color: #CD7F32; font-weight: bold; font-size: 1.3rem; margin-bottom: 10px;">BRONZE</div>
                    <div style="color: #fff; font-size: 1.1rem; margin-bottom: 5px;">Score 11+ pts</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">10 batches max</div>
                    <div style="color: rgba(255,215,0,0.8); font-size: 0.85rem; margin-top: 5px;">7,000 tokens</div>
                </div>
                
                <div style="
                    padding: 25px 15px;
                    background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
                    border: 2px solid #C0C0C0;
                    border-radius: 15px;
                    transition: all 0.3s;
                ">
                    <div style="font-size: 3.5rem; margin-bottom: 15px;">🥈</div>
                    <div style="color: #C0C0C0; font-weight: bold; font-size: 1.3rem; margin-bottom: 10px;">SILVER</div>
                    <div style="color: #fff; font-size: 1.1rem; margin-bottom: 5px;">Score 15+ pts</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">20 batches max</div>
                    <div style="color: rgba(255,215,0,0.8); font-size: 0.85rem; margin-top: 5px;">14,000 tokens</div>
                </div>
                
                <div style="
                    padding: 25px 15px;
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
                    border: 2px solid #FFD700;
                    border-radius: 15px;
                    transition: all 0.3s;
                ">
                    <div style="font-size: 3.5rem; margin-bottom: 15px;">🥇</div>
                    <div style="color: #FFD700; font-weight: bold; font-size: 1.3rem; margin-bottom: 10px;">GOLD</div>
                    <div style="color: #fff; font-size: 1.1rem; margin-bottom: 5px;">Score 25+ pts</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">30 batches max</div>
                    <div style="color: rgba(255,215,0,0.8); font-size: 0.85rem; margin-top: 5px;">21,000 tokens</div>
                </div>
            </div>
            
            <a href="game.html" style="
                display: inline-block;
                background: linear-gradient(45deg, #f093fb, #f5576c);
                color: white;
                padding: 25px 70px;
                border-radius: 50px;
                text-decoration: none;
                font-size: 1.4rem;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 3px;
                margin-top: 20px;
                box-shadow: 0 10px 40px rgba(245, 87, 108, 0.5);
                transition: all 0.3s;
                border: 3px solid transparent;
                animation: buttonGlow 2s infinite;
            " 
            onmouseover="
                this.style.transform='scale(1.05) translateY(-3px)';
                this.style.boxShadow='0 15px 50px rgba(245, 87, 108, 0.7)';
            " 
            onmouseout="
                this.style.transform='scale(1) translateY(0)';
                this.style.boxShadow='0 10px 40px rgba(245, 87, 108, 0.5)';
            ">
                🎮 PLAY GAME TO UNLOCK 🎮
            </a>
            
            <style>
                @keyframes buttonGlow {
                    0%, 100% { box-shadow: 0 10px 40px rgba(245, 87, 108, 0.5); }
                    50% { box-shadow: 0 10px 60px rgba(245, 87, 108, 0.8); }
                }
            </style>
        `;
        
        // Add to body
        document.body.appendChild(lockDiv);
        
        // Also create a backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'mint-lock-backdrop';
        backdrop.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.9) !important;
            z-index: 999998 !important;
            backdrop-filter: blur(5px) !important;
        `;
        document.body.appendChild(backdrop);
        
        // Hide the purchase section
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection) {
            purchaseSection.style.opacity = '0.1';
            purchaseSection.style.pointerEvents = 'none';
        }
        
        // Hide the purchase form
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            purchaseForm.style.display = 'none';
        }
        
        console.log('🔒 MINT LOCK OVERLAY DISPLAYED');
    }
    
    // Hide the lock message
    function hideMintLock() {
        console.log('✅ HIDING MINT LOCK - Tier unlocked');
        
        const lockDiv = document.getElementById('mint-lock-message');
        if (lockDiv) lockDiv.remove();
        
        const backdrop = document.getElementById('mint-lock-backdrop');
        if (backdrop) backdrop.remove();
        
        // Show the purchase section
        const purchaseSection = document.getElementById('purchase');
        if (purchaseSection) {
            purchaseSection.style.opacity = '';
            purchaseSection.style.pointerEvents = '';
        }
        
        // Show the purchase form
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            purchaseForm.style.display = '';
        }
    }
    
    // Main function to check and enforce lock
    function enforceMintLock() {
        if (hasValidTier()) {
            hideMintLock();
        } else {
            showMintLock();
        }
    }
    
    // Run immediately
    enforceMintLock();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enforceMintLock);
    } else {
        // DOM already loaded, run again
        enforceMintLock();
    }
    
    // Run when page fully loads
    window.addEventListener('load', enforceMintLock);
    
    // Monitor storage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'unlockedTier' || e.key === 'gameScore') {
            console.log('🔄 Storage changed, checking mint lock...');
            enforceMintLock();
        }
    });
    
    // Check periodically (failsafe)
    setInterval(enforceMintLock, 3000);
    
    // Debug functions
    window.mintLockDebug = {
        unlock: function(tier, score) {
            localStorage.setItem('unlockedTier', tier);
            localStorage.setItem('gameScore', score);
            localStorage.setItem('gameCompleted', 'true');
            enforceMintLock();
            console.log(`✅ Unlocked ${tier} with ${score} points`);
        },
        lock: function() {
            localStorage.removeItem('unlockedTier');
            localStorage.removeItem('gameScore');
            localStorage.removeItem('gameCompleted');
            enforceMintLock();
            console.log('🔒 Mint locked');
        },
        check: function() {
            console.log('Current state:', {
                tier: localStorage.getItem('unlockedTier'),
                score: localStorage.getItem('gameScore'),
                hasValidTier: hasValidTier()
            });
        }
    };
    
    console.log('✅ MINT LOCK SYSTEM ACTIVE');
    console.log('Debug: window.mintLockDebug.unlock("bronze", 11) or .lock()');
    
})();