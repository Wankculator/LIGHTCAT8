// Button Processing Fix - Simple fix for stuck buttons
(function() {
    'use strict';
    
    console.log('🔧 Button Processing Fix: Loading...');
    
    // Monitor and fix stuck buttons
    function monitorButtons() {
        // Check submit button every second
        setInterval(() => {
            const submitBtn = document.querySelector('#submitRgbInvoice');
            if (submitBtn) {
                const text = submitBtn.textContent.toUpperCase();
                
                // If button says PROCESSING or CREATING, check if it's stuck
                if (text.includes('PROCESSING') || text.includes('CREATING')) {
                    // Track when it started processing
                    if (!submitBtn.dataset.processingStartTime) {
                        submitBtn.dataset.processingStartTime = Date.now().toString();
                        console.log('⏱️ Button started processing');
                    } else {
                        // Check how long it's been processing
                        const startTime = parseInt(submitBtn.dataset.processingStartTime);
                        const elapsed = Date.now() - startTime;
                        
                        // If more than 15 seconds, reset it
                        if (elapsed > 15000) {
                            console.log('⚠️ Button stuck for', Math.round(elapsed/1000), 'seconds. Resetting...');
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'CREATE LIGHTNING INVOICE';
                            delete submitBtn.dataset.processingStartTime;
                        }
                    }
                } else {
                    // Button is not processing, clear the timer
                    if (submitBtn.dataset.processingStartTime) {
                        delete submitBtn.dataset.processingStartTime;
                    }
                }
            }
            
            // Also check other buttons
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                const text = btn.textContent.toUpperCase();
                if (text === 'PROCESSING' || text === 'PROCESSING...') {
                    // Check if it has a timer
                    if (!btn.dataset.processingCheck) {
                        btn.dataset.processingCheck = Date.now().toString();
                    } else {
                        const checkTime = parseInt(btn.dataset.processingCheck);
                        if (Date.now() - checkTime > 10000) {
                            console.log('⚠️ Found stuck button, fixing:', btn);
                            btn.disabled = false;
                            // Try to restore original text from data attribute or use generic
                            btn.textContent = btn.dataset.originalText || 'Click Here';
                            delete btn.dataset.processingCheck;
                        }
                    }
                } else if (btn.dataset.processingCheck) {
                    delete btn.dataset.processingCheck;
                }
            });
        }, 1000);
    }
    
    // Store original button texts
    function storeButtonTexts() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (!btn.dataset.originalText && btn.textContent.trim()) {
                btn.dataset.originalText = btn.textContent.trim();
            }
        });
    }
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            storeButtonTexts();
            monitorButtons();
            console.log('✅ Button processing fix initialized');
        });
    } else {
        storeButtonTexts();
        monitorButtons();
        console.log('✅ Button processing fix initialized');
    }
    
})();