/**
 * CRITICAL FIXES - Addresses all major issues with LIGHTCAT platform
 * 1. Ensures mint is properly locked without game completion
 * 2. Fixes "Creating..." button stuck issue
 * 3. Enforces proper game completion validation
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading critical fixes...');
    
    // Wait for DOM to be ready
    function onReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
    
    onReady(function() {
        console.log('🔧 Applying critical fixes...');
        
        // Fix 1: Proper mint lock enforcement
        function enforceMintLock() {
            // Check for REAL tier unlock (not admin bypass)
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = window.location.hash.includes('?') ? 
                new URLSearchParams(window.location.hash.split('?')[1]) : new URLSearchParams();
            
            const tierFromUrl = urlParams.get('tier') || hashParams.get('tier');
            const tierFromStorage = localStorage.getItem('unlockedTier');
            const gameScore = parseInt(localStorage.getItem('gameScore')) || 0;
            const gameCompleted = localStorage.getItem('gameCompleted') === 'true';
            
            // CRITICAL: Only unlock if legitimate game completion
            let hasValidTier = false;
            let validTier = null;
            
            // Check if tier is legitimate (backed by actual game score)
            if (tierFromStorage && gameScore > 0) {
                if ((tierFromStorage === 'bronze' && gameScore >= 11) ||
                    (tierFromStorage === 'silver' && gameScore >= 15) ||
                    (tierFromStorage === 'gold' && gameScore >= 25)) {
                    hasValidTier = true;
                    validTier = tierFromStorage;
                }
            }
            
            // Also check URL tier if it matches game score
            if (tierFromUrl && gameScore > 0) {
                if ((tierFromUrl === 'bronze' && gameScore >= 11) ||
                    (tierFromUrl === 'silver' && gameScore >= 15) ||
                    (tierFromUrl === 'gold' && gameScore >= 25)) {
                    hasValidTier = true;
                    validTier = tierFromUrl;
                    // Update localStorage to match
                    localStorage.setItem('unlockedTier', tierFromUrl);
                }
            }
            
            console.log('🔒 Tier validation:', {
                tierFromUrl,
                tierFromStorage,
                gameScore,
                gameCompleted,
                hasValidTier,
                validTier
            });
            
            // Apply mint lock UI
            const purchaseForm = document.getElementById('purchaseForm');
            const purchaseSection = document.getElementById('purchase');
            
            if (!hasValidTier) {
                console.log('🔒 MINT IS LOCKED - No valid tier');
                
                // Hide purchase form and show lock message
                if (purchaseForm) {
                    purchaseForm.style.display = 'none';
                }
                
                // Remove any existing lock messages first
                const existingLockMessages = document.querySelectorAll('.mint-locked-message, .mint-locked-container');
                existingLockMessages.forEach(el => el.remove());
                
                // Create and show lock message
                const lockMessage = document.createElement('div');
                lockMessage.className = 'mint-locked-message';
                lockMessage.style.cssText = `
                    background: rgba(255, 0, 0, 0.1);
                    border: 2px solid #ff4444;
                    border-radius: 15px;
                    padding: 40px;
                    text-align: center;
                    margin: 40px auto;
                    max-width: 600px;
                    animation: pulse 2s infinite;
                `;
                
                lockMessage.innerHTML = `
                    <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
                    <h3 style="color: #ff4444; font-size: 2rem; margin-bottom: 20px; font-weight: bold;">
                        MINT IS LOCKED
                    </h3>
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.2rem; margin-bottom: 30px; line-height: 1.5;">
                        You must complete the game to unlock token purchasing!<br>
                        <strong>Score Requirements:</strong><br>
                        🥉 Bronze: 11+ points (10 batches max)<br>
                        🥈 Silver: 15+ points (20 batches max)<br>
                        🥇 Gold: 25+ points (30 batches max)
                    </p>
                    <a href="/game.html" style="
                        display: inline-block;
                        background: var(--yellow, #FFD700);
                        color: #000;
                        font-weight: bold;
                        padding: 15px 30px;
                        border-radius: 10px;
                        text-decoration: none;
                        font-size: 1.1rem;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        🎮 PLAY GAME TO UNLOCK
                    </a>
                `;
                
                // Add pulsing animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4); }
                        70% { box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
                    }
                `;
                document.head.appendChild(style);
                
                if (purchaseSection) {
                    purchaseSection.insertBefore(lockMessage, purchaseForm);
                } else {
                    document.body.appendChild(lockMessage);
                }
                
                // Disable any batch controls
                const batchControls = document.querySelectorAll('.batch-selector button, #submitRgbInvoice');
                batchControls.forEach(btn => {
                    if (btn) btn.disabled = true;
                });
                
                return false; // Mint is locked
                
            } else {
                console.log('✅ MINT UNLOCKED - Valid tier:', validTier);
                
                // Remove lock message if it exists
                const lockMessages = document.querySelectorAll('.mint-locked-message, .mint-locked-container');
                lockMessages.forEach(el => el.remove());
                
                // Show purchase form
                if (purchaseForm) {
                    purchaseForm.style.display = 'block';
                }
                
                // Enable batch controls
                const batchControls = document.querySelectorAll('.batch-selector button, #submitRgbInvoice');
                batchControls.forEach(btn => {
                    if (btn) btn.disabled = false;
                });
                
                // Show tier unlock notification
                showTierUnlockNotification(validTier);
                
                return true; // Mint is unlocked
            }
        }
        
        // Fix 2: Prevent "Creating..." button from getting stuck
        function fixButtonStuckIssue() {
            const submitButton = document.getElementById('submitRgbInvoice');
            if (!submitButton) return;
            
            console.log('🔧 Fixing button stuck issue...');
            
            // Store original text
            const originalText = submitButton.textContent || 'CREATE LIGHTNING INVOICE';
            
            // Override the form submission to ensure button always resets
            const form = submitButton.closest('form');
            if (form) {
                // DISABLED - This breaks the batch button event handlers
                // Don't clone/replace form as it breaks other event listeners
                /*
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                */
                const newForm = form; // Just use existing form
                
                const newSubmitButton = document.getElementById('submitRgbInvoice');
                
                newForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check mint lock first
                    if (!enforceMintLock()) {
                        console.log('🔒 Form submission blocked - mint is locked');
                        return;
                    }
                    
                    console.log('🔧 Form submission starting...');
                    
                    // Set loading state
                    newSubmitButton.disabled = true;
                    newSubmitButton.textContent = 'CREATING INVOICE...';
                    
                    // Ensure button resets after a timeout (fail-safe)
                    const resetTimeout = setTimeout(() => {
                        console.log('🔧 Fail-safe: Resetting button after timeout');
                        newSubmitButton.disabled = false;
                        newSubmitButton.textContent = originalText;
                    }, 10000); // 10 second timeout
                    
                    try {
                        // Get form data
                        const rgbInvoice = document.getElementById('rgbInvoice').value.trim();
                        const email = document.getElementById('emailAddress').value.trim();
                        
                        // Validation
                        if (!rgbInvoice) {
                            throw new Error('Please enter your RGB invoice');
                        }
                        
                        if (!rgbInvoice.startsWith('rgb:')) {
                            throw new Error('Please enter a valid RGB invoice (must start with "rgb:")');
                        }
                        
                        // Get tier and batch count
                        const unlockedTier = localStorage.getItem('unlockedTier') || 'bronze';
                        const batchCountEl = document.getElementById('batchCount');
                        const currentBatches = parseInt(batchCountEl ? batchCountEl.textContent : '1') || 1;
                        
                        console.log('🔧 Submitting invoice request...', {
                            tier: unlockedTier,
                            batches: currentBatches,
                            hasRgb: !!rgbInvoice
                        });
                        
                        // Call API with proper error handling
                        console.log('🔧 Making API call...');
                        const response = await fetch('/api/rgb/invoice', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                rgbInvoice: rgbInvoice,
                                email: email,
                                batchCount: currentBatches,
                                tier: unlockedTier,
                                gameSessionId: localStorage.getItem('gameSessionId') || null
                            })
                        });
                        
                        console.log('🔧 API response status:', response.status);
                        
                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || `Server error: ${response.status}`);
                        }
                        
                        const result = await response.json();
                        console.log('✅ Invoice created successfully:', result);
                        
                        // Show payment modal if function exists
                        if (typeof showPaymentModal === 'function') {
                            showPaymentModal({
                                id: result.invoiceId,
                                lightningInvoice: result.lightningInvoice,
                                amountSats: result.amount || (currentBatches * 2000),
                                expiresAt: result.expiresAt,
                                qrCode: result.qrCode
                            });
                        } else {
                            console.log('💡 Payment modal function not found');
                        }
                        
                        // Clear timeout since we succeeded
                        clearTimeout(resetTimeout);
                        
                    } catch (error) {
                        console.error('❌ Invoice creation failed:', error);
                        
                        // Show user-friendly error
                        let errorMsg = 'Failed to create invoice. ';
                        if (error.message.includes('tier')) {
                            errorMsg = 'Please complete the game first to unlock purchasing.';
                        } else if (error.message.includes('invoice')) {
                            errorMsg = 'Please enter a valid RGB invoice starting with "rgb:".';
                        } else {
                            errorMsg += error.message || 'Please try again.';
                        }
                        
                        // Show notification if function exists
                        if (typeof showNotification === 'function') {
                            showNotification(errorMsg, 'error');
                        } else {
                            alert(errorMsg);
                        }
                        
                        // Clear timeout since we handled the error
                        clearTimeout(resetTimeout);
                        
                    } finally {
                        // Always reset button
                        console.log('🔧 Resetting button state...');
                        newSubmitButton.disabled = false;
                        newSubmitButton.textContent = originalText;
                    }
                });
            }
        }
        
        // Fix 3: Show tier unlock notification
        function showTierUnlockNotification(tier) {
            // Remove existing tier notifications
            const existing = document.querySelectorAll('.tier-unlock-notification');
            existing.forEach(el => el.remove());
            
            const maxBatches = {
                'bronze': 10,
                'silver': 20, 
                'gold': 30
            }[tier.toLowerCase()] || 0;
            
            const notification = document.createElement('div');
            notification.className = 'tier-unlock-notification';
            notification.style.cssText = `
                background: var(--yellow, #FFD700);
                color: #000;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                margin: 20px auto;
                max-width: 600px;
                font-weight: bold;
                animation: slideIn 0.5s ease-out;
                box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
            `;
            
            // DISABLED - Duplicate tier notification already exists in index.html
            return; // Don't create duplicate notification
            /*
            notification.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px;">
                    ${tier.toLowerCase() === 'gold' ? '🥇' : tier.toLowerCase() === 'silver' ? '🥈' : '🥉'}
                </div>
                <div style="font-size: 1.2rem; margin-bottom: 5px;">
                    ${tier.toUpperCase()} TIER UNLOCKED!
                </div>
                <div style="font-size: 1rem;">
                    You can purchase up to ${maxBatches} batches
                </div>
            */
            
            // Add slide-in animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateY(-100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            const purchaseSection = document.getElementById('purchase');
            if (purchaseSection) {
                purchaseSection.insertBefore(notification, purchaseSection.firstChild);
            } else {
                document.body.appendChild(notification);
            }
        }
        
        // Apply all fixes
        console.log('🔧 Applying mint lock enforcement...');
        enforceMintLock();
        
        console.log('🔧 Applying button stuck fix...');
        fixButtonStuckIssue();
        
        // Monitor for URL changes that might affect tier
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('🔧 URL changed, re-checking mint lock...');
                enforceMintLock();
            }
        }, 1000);
        
        // Monitor localStorage changes
        let lastTier = localStorage.getItem('unlockedTier');
        setInterval(() => {
            const currentTier = localStorage.getItem('unlockedTier');
            if (currentTier !== lastTier) {
                lastTier = currentTier;
                console.log('🔧 Tier changed, re-checking mint lock...');
                enforceMintLock();
            }
        }, 1000);
        
        console.log('✅ All critical fixes applied successfully!');
    });
    
})();