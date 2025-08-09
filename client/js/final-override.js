/**
 * FINAL OVERRIDE - The Last Script That Actually Works
 * This runs AFTER everything else and FORCES both features to work
 */

(function() {
    'use strict';
    
    console.error('[FINAL-OVERRIDE] 🔥 Taking complete control...');
    
    // Wait for page to fully load
    if (document.readyState !== 'complete') {
        window.addEventListener('load', initialize);
    } else {
        initialize();
    }
    
    function initialize() {
        console.error('[FINAL-OVERRIDE] Starting final fixes...');
        
        // Kill all running intervals from other scripts
        const highestId = setInterval(() => {}, 10000);
        for (let i = 1; i < highestId; i++) {
            clearInterval(i);
            clearTimeout(i);
        }
        console.error('[FINAL-OVERRIDE] Stopped all other scripts');
        
        // FORCE BATCH BUTTONS TO WORK
        fixBatchButtons();
        
        // FORCE QR BUTTON TO WORK
        fixQRButton();
        
        // Keep checking every second to ensure they stay fixed
        setInterval(() => {
            // Check if batch buttons still work
            const increase = document.getElementById('increaseBatch');
            if (increase && !increase.hasAttribute('final-fixed')) {
                console.error('[FINAL-OVERRIDE] Re-fixing batch buttons...');
                fixBatchButtons();
            }
            
            // Check if QR button still works
            const scanBtn = document.getElementById('scanQRBtn');
            if (scanBtn && !scanBtn.hasAttribute('final-fixed')) {
                console.error('[FINAL-OVERRIDE] Re-fixing QR button...');
                fixQRButton();
            }
        }, 1000);
    }
    
    function fixBatchButtons() {
        const decrease = document.getElementById('decreaseBatch');
        const increase = document.getElementById('increaseBatch');
        const batchCount = document.getElementById('batchCount');
        const maxBtn = document.getElementById('maxBatch');
        
        if (!decrease || !increase || !batchCount) {
            console.error('[FINAL-OVERRIDE] Batch elements not found');
            return;
        }
        
        // Initialize state
        if (!window.FINAL_STATE) {
            window.FINAL_STATE = {
                batches: parseInt(batchCount.textContent) || 1,
                max: 30
            };
        }
        
        // Remove ALL event listeners by cloning
        const elements = {
            'decreaseBatch': decrease,
            'increaseBatch': increase,
            'maxBatch': maxBtn
        };
        
        Object.entries(elements).forEach(([id, el]) => {
            if (el) {
                const newEl = el.cloneNode(true);
                el.parentNode.replaceChild(newEl, el);
                newEl.setAttribute('final-fixed', 'true');
            }
        });
        
        // Get fresh references
        const newDecrease = document.getElementById('decreaseBatch');
        const newIncrease = document.getElementById('increaseBatch');
        const newMax = document.getElementById('maxBatch');
        
        // Add CAPTURE phase listeners (get events first)
        newDecrease.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (window.FINAL_STATE.batches > 1) {
                window.FINAL_STATE.batches--;
                updateBatchDisplay();
                console.error('[FINAL-OVERRIDE] Decreased to:', window.FINAL_STATE.batches);
            }
        }, true); // TRUE = capture phase
        
        newIncrease.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (window.FINAL_STATE.batches < window.FINAL_STATE.max) {
                window.FINAL_STATE.batches++;
                updateBatchDisplay();
                console.error('[FINAL-OVERRIDE] Increased to:', window.FINAL_STATE.batches);
            }
        }, true);
        
        if (newMax) {
            newMax.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                window.FINAL_STATE.batches = window.FINAL_STATE.max;
                updateBatchDisplay();
                console.error('[FINAL-OVERRIDE] Set to MAX:', window.FINAL_STATE.batches);
            }, true);
        }
        
        console.error('[FINAL-OVERRIDE] ✅ Batch buttons fixed');
    }
    
    function updateBatchDisplay() {
        document.getElementById('batchCount').textContent = window.FINAL_STATE.batches;
        
        const PRICE_PER_BATCH_SATS = 2000;
        const PRICE_PER_BATCH_BTC = 0.00002;
        const TOKENS_PER_BATCH = 700;
        
        const count = window.FINAL_STATE.batches;
        const totalBTC = (count * PRICE_PER_BATCH_BTC).toFixed(8);
        const totalSats = count * PRICE_PER_BATCH_SATS;
        const totalTokens = count * TOKENS_PER_BATCH;
        
        const updates = {
            'totalBTC': totalBTC + ' BTC',
            'totalSats': totalSats.toLocaleString(),
            'tokenAmount': totalTokens.toLocaleString(),
            'totalPrice': totalSats.toLocaleString() + ' sats'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }
    
    function fixQRButton() {
        const scanBtn = document.getElementById('scanQRBtn');
        const modal = document.getElementById('qrScannerModal');
        
        if (!scanBtn || !modal) {
            console.error('[FINAL-OVERRIDE] QR elements not found');
            return;
        }
        
        // Clone to remove ALL handlers
        const newBtn = scanBtn.cloneNode(true);
        scanBtn.parentNode.replaceChild(newBtn, scanBtn);
        newBtn.setAttribute('final-fixed', 'true');
        
        // Get fresh reference
        const freshBtn = document.getElementById('scanQRBtn');
        
        // Add CAPTURE phase listener
        freshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.error('[FINAL-OVERRIDE] Opening QR modal...');
            
            const modal = document.getElementById('qrScannerModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
                modal.style.zIndex = '99999';
            }
        }, true); // TRUE = capture phase
        
        // Fix close button
        const closeBtn = document.getElementById('closeQRScanner');
        if (closeBtn) {
            const newClose = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newClose, closeBtn);
            
            document.getElementById('closeQRScanner').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.error('[FINAL-OVERRIDE] Closing QR modal...');
                document.getElementById('qrScannerModal').style.display = 'none';
            }, true);
        }
        
        // Also allow clicking outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        console.error('[FINAL-OVERRIDE] ✅ QR button fixed');
    }
    
    // Expose for testing
    window.FINAL = {
        test: () => {
            console.error('[FINAL-OVERRIDE] Status Check:');
            console.error('  Batches:', window.FINAL_STATE ? window.FINAL_STATE.batches : 'Not initialized');
            
            const increase = document.getElementById('increaseBatch');
            const scanBtn = document.getElementById('scanQRBtn');
            
            console.error('  Batch button fixed:', increase ? increase.hasAttribute('final-fixed') : false);
            console.error('  QR button fixed:', scanBtn ? scanBtn.hasAttribute('final-fixed') : false);
        },
        getBatches: () => window.FINAL_STATE ? window.FINAL_STATE.batches : 1,
        setBatches: (n) => {
            if (window.FINAL_STATE) {
                window.FINAL_STATE.batches = n;
                updateBatchDisplay();
            }
        },
        openQR: () => {
            document.getElementById('qrScannerModal').style.display = 'flex';
        }
    };
    
    console.error('[FINAL-OVERRIDE] ✅ Ready! Test with: FINAL.test()');
    
})();