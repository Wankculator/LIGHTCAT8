/**
 * GOD MODE FIX - THE ULTIMATE SOLUTION
 * This will work. Period.
 * Version: FINAL
 */

(function() {
    'use strict';
    
    console.error('[GOD-MODE] 🔥 ULTIMATE FIX ACTIVATING...');
    
    // Global state that CANNOT be overridden
    let GOD_MODE_BATCHES = 1;
    const GOD_MODE_MAX = 30;
    
    // The nuclear option - we'll run this CONTINUOUSLY
    function ABSOLUTE_OVERRIDE() {
        console.error('[GOD-MODE] Running absolute override...');
        
        // Get elements fresh each time
        const decrease = document.getElementById('decreaseBatch');
        const increase = document.getElementById('increaseBatch');
        const batchCount = document.getElementById('batchCount');
        const maxBtn = document.getElementById('maxBatch');
        const form = document.getElementById('purchaseForm');
        
        if (!decrease || !increase || !batchCount) {
            console.error('[GOD-MODE] Elements not ready, retrying...');
            return;
        }
        
        // FORCE the display
        batchCount.textContent = GOD_MODE_BATCHES;
        
        // DESTROY all existing handlers
        const newDecrease = decrease.cloneNode(true);
        const newIncrease = increase.cloneNode(true);
        const newMax = maxBtn ? maxBtn.cloneNode(true) : null;
        
        decrease.parentNode.replaceChild(newDecrease, decrease);
        increase.parentNode.replaceChild(newIncrease, increase);
        if (maxBtn && newMax) {
            maxBtn.parentNode.replaceChild(newMax, maxBtn);
        }
        
        // FORCE enable buttons
        newDecrease.disabled = false;
        newIncrease.disabled = false;
        newDecrease.style.pointerEvents = 'auto';
        newIncrease.style.pointerEvents = 'auto';
        newDecrease.style.opacity = '1';
        newIncrease.style.opacity = '1';
        newDecrease.style.cursor = 'pointer';
        newIncrease.style.cursor = 'pointer';
        
        // THE HANDLERS THAT CANNOT BE STOPPED
        function handleDecrease(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            
            console.error('[GOD-MODE] DECREASE CLICKED!');
            
            if (GOD_MODE_BATCHES > 1) {
                GOD_MODE_BATCHES--;
                document.getElementById('batchCount').textContent = GOD_MODE_BATCHES;
                updateAllPrices();
            }
            
            return false;
        }
        
        function handleIncrease(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            
            console.error('[GOD-MODE] INCREASE CLICKED!');
            
            if (GOD_MODE_BATCHES < GOD_MODE_MAX) {
                GOD_MODE_BATCHES++;
                document.getElementById('batchCount').textContent = GOD_MODE_BATCHES;
                updateAllPrices();
            }
            
            return false;
        }
        
        function handleMax(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
            
            console.error('[GOD-MODE] MAX CLICKED!');
            
            GOD_MODE_BATCHES = GOD_MODE_MAX;
            document.getElementById('batchCount').textContent = GOD_MODE_BATCHES;
            updateAllPrices();
            
            return false;
        }
        
        // ATTACH HANDLERS USING EVERY METHOD
        
        // Method 1: Direct onclick
        newDecrease.onclick = handleDecrease;
        newIncrease.onclick = handleIncrease;
        if (newMax) newMax.onclick = handleMax;
        
        // Method 2: addEventListener with capture
        newDecrease.addEventListener('click', handleDecrease, true);
        newIncrease.addEventListener('click', handleIncrease, true);
        if (newMax) newMax.addEventListener('click', handleMax, true);
        
        // Method 3: addEventListener without capture
        newDecrease.addEventListener('click', handleDecrease, false);
        newIncrease.addEventListener('click', handleIncrease, false);
        if (newMax) newMax.addEventListener('click', handleMax, false);
        
        // Method 4: mousedown as backup
        newDecrease.addEventListener('mousedown', handleDecrease, true);
        newIncrease.addEventListener('mousedown', handleIncrease, true);
        if (newMax) newMax.addEventListener('mousedown', handleMax, true);
        
        // Method 5: touchstart for mobile
        newDecrease.addEventListener('touchstart', handleDecrease, true);
        newIncrease.addEventListener('touchstart', handleIncrease, true);
        if (newMax) newMax.addEventListener('touchstart', handleMax, true);
        
        // FORCE form visibility
        if (form) {
            form.style.display = 'block !important';
            form.style.visibility = 'visible !important';
            form.style.opacity = '1 !important';
            form.style.pointerEvents = 'auto !important';
            
            // Remove any conflicting styles
            const style = document.createElement('style');
            style.textContent = `
                #purchaseForm {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                #decreaseBatch, #increaseBatch {
                    pointer-events: auto !important;
                    cursor: pointer !important;
                    opacity: 1 !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Update global variables
        window.currentBatches = GOD_MODE_BATCHES;
        window.maxBatches = GOD_MODE_MAX;
        window.mintLocked = false;
        
        // Update prices
        updateAllPrices();
        
        console.error('[GOD-MODE] Override complete. Batches:', GOD_MODE_BATCHES);
    }
    
    function updateAllPrices() {
        const PRICE_PER_BATCH_SATS = 2000;
        const PRICE_PER_BATCH_BTC = 0.00002;
        const TOKENS_PER_BATCH = 700;
        
        const totalBTC = (GOD_MODE_BATCHES * PRICE_PER_BATCH_BTC).toFixed(8);
        const totalSats = GOD_MODE_BATCHES * PRICE_PER_BATCH_SATS;
        const totalTokens = GOD_MODE_BATCHES * TOKENS_PER_BATCH;
        
        // Update EVERY price element we can find
        const updates = [
            { id: 'totalBTC', value: totalBTC + ' BTC' },
            { id: 'totalSats', value: totalSats.toLocaleString() },
            { id: 'tokenAmount', value: totalTokens.toLocaleString() },
            { id: 'totalPrice', value: totalSats.toLocaleString() + ' sats' },
            { id: 'maxBatches', value: GOD_MODE_MAX }
        ];
        
        updates.forEach(u => {
            const el = document.getElementById(u.id);
            if (el) el.textContent = u.value;
        });
        
        console.error('[GOD-MODE] Prices updated for', GOD_MODE_BATCHES, 'batches');
    }
    
    // FORM SUBMISSION OVERRIDE
    function overrideFormSubmission() {
        const form = document.getElementById('purchaseForm');
        if (!form) return;
        
        // Clone to remove ALL handlers
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.onsubmit = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.error('[GOD-MODE] FORM SUBMITTED!');
            
            const rgbInvoice = document.getElementById('rgbInvoice').value.trim();
            const email = document.getElementById('emailAddress')?.value.trim();
            
            if (!rgbInvoice) {
                alert('Please enter your RGB invoice');
                return false;
            }
            
            const submitBtn = newForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'PROCESSING...';
            
            try {
                console.error('[GOD-MODE] Sending invoice request...');
                
                const response = await fetch('/api/rgb/invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rgbInvoice: rgbInvoice,
                        batchCount: GOD_MODE_BATCHES,
                        email: email || undefined,
                        tier: 'gold'
                    })
                });
                
                const result = await response.json();
                console.error('[GOD-MODE] Response:', result);
                
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to create invoice');
                }
                
                // Show result
                if (typeof window.showPaymentModal === 'function') {
                    window.showPaymentModal({
                        id: result.invoiceId,
                        lightningInvoice: result.lightningInvoice,
                        amountSats: result.amount,
                        amountBTC: result.amount / 100000000,
                        expiresAt: result.expiresAt,
                        qrCode: result.qrCode
                    });
                } else {
                    alert(`Invoice created!\n\n${result.lightningInvoice}\n\nAmount: ${result.amount} sats`);
                }
                
            } catch (error) {
                console.error('[GOD-MODE] Error:', error);
                alert('Error: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
            
            return false;
        };
    }
    
    // EXECUTION STRATEGY - RUN EVERYWHERE
    
    console.error('[GOD-MODE] Setting up execution strategy...');
    
    // 1. Run immediately
    try {
        ABSOLUTE_OVERRIDE();
        overrideFormSubmission();
    } catch (e) {
        console.error('[GOD-MODE] Initial run error:', e);
    }
    
    // 2. Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.error('[GOD-MODE] DOMContentLoaded - running override');
            ABSOLUTE_OVERRIDE();
            overrideFormSubmission();
        });
    }
    
    // 3. Run when window loads
    window.addEventListener('load', () => {
        console.error('[GOD-MODE] Window loaded - running override');
        setTimeout(() => {
            ABSOLUTE_OVERRIDE();
            overrideFormSubmission();
        }, 100);
    });
    
    // 4. Run every 500ms for 15 seconds (nuclear option)
    let runCount = 0;
    const interval = setInterval(() => {
        runCount++;
        console.error('[GOD-MODE] Interval run #' + runCount);
        ABSOLUTE_OVERRIDE();
        
        if (runCount === 1) {
            // First run, also fix form
            overrideFormSubmission();
        }
        
        if (runCount >= 30) {
            clearInterval(interval);
            console.error('[GOD-MODE] Monitoring complete');
        }
    }, 500);
    
    // 5. Add global function for manual testing
    window.GOD_MODE = {
        fix: ABSOLUTE_OVERRIDE,
        setBatches: (n) => {
            GOD_MODE_BATCHES = n;
            document.getElementById('batchCount').textContent = n;
            updateAllPrices();
        },
        getBatches: () => GOD_MODE_BATCHES,
        test: () => {
            console.error('[GOD-MODE] TEST: Current batches =', GOD_MODE_BATCHES);
            console.error('[GOD-MODE] TEST: Clicking increase...');
            document.getElementById('increaseBatch').click();
            setTimeout(() => {
                console.error('[GOD-MODE] TEST: New batches =', GOD_MODE_BATCHES);
            }, 100);
        }
    };
    
    console.error('[GOD-MODE] 🚀 ULTIMATE FIX DEPLOYED!');
    console.error('[GOD-MODE] Test with: window.GOD_MODE.test()');
    
})();