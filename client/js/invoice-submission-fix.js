// Invoice Submission Fix - Ensure form submission works properly
(function() {
    'use strict';
    
    console.log('🔧 Invoice Submission Fix: Initializing...');
    
    // Fix the form submission issue
    function fixFormSubmission() {
        const purchaseForm = document.getElementById('purchaseForm');
        if (!purchaseForm) {
            console.log('Purchase form not found, retrying...');
            setTimeout(fixFormSubmission, 1000);
            return;
        }
        
        console.log('✅ Found purchase form, fixing submission handler');
        
        // Remove any existing submit handlers that might be blocking
        const newForm = purchaseForm.cloneNode(true);
        purchaseForm.parentNode.replaceChild(newForm, purchaseForm);
        
        // Add our fixed submit handler
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Form submission triggered');
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const rgbInvoice = document.getElementById('rgbInvoice').value.trim();
            const email = document.getElementById('emailAddress')?.value?.trim() || '';
            
            // Get batch count
            let batchCount = 1;
            const batchDisplay = document.getElementById('batchCount');
            if (batchDisplay) {
                batchCount = parseInt(batchDisplay.textContent) || 1;
            }
            
            // Get tier
            const tier = window.unlockedTier || localStorage.getItem('unlockedTier') || 'bronze';
            
            console.log('📦 Submission data:', {
                rgbInvoice: rgbInvoice.substring(0, 50) + '...',
                batchCount,
                tier,
                hasEmail: !!email
            });
            
            // Validation
            if (!rgbInvoice) {
                alert('Please enter your RGB invoice');
                return;
            }
            
            if (!rgbInvoice.startsWith('rgb:')) {
                alert('Invalid RGB invoice format. Must start with "rgb:"');
                return;
            }
            
            if (!rgbInvoice.includes(':utxob:')) {
                alert('Invalid RGB invoice. Must contain ":utxob:" section');
                return;
            }
            
            // Update button state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'CREATING LIGHTNING INVOICE...';
            }
            
            try {
                console.log('🚀 Sending invoice request to API...');
                
                const response = await fetch('/api/rgb/invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        rgbInvoice: rgbInvoice,
                        email: email,
                        batchCount: batchCount,
                        tier: tier,
                        gameSessionId: window.gameSessionId || localStorage.getItem('gameSessionId') || null
                    })
                });
                
                console.log('📥 Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ API Error:', errorText);
                    
                    // Try to parse as JSON
                    try {
                        const errorJson = JSON.parse(errorText);
                        throw new Error(errorJson.error || errorJson.message || 'Failed to create invoice');
                    } catch {
                        throw new Error(`Server error: ${response.status}`);
                    }
                }
                
                const result = await response.json();
                console.log('✅ Invoice created successfully:', result);
                
                // Show payment modal if function exists
                if (typeof window.showPaymentModal === 'function') {
                    const invoice = {
                        id: result.invoiceId,
                        lightningInvoice: result.lightningInvoice,
                        amountSats: result.amount,
                        amountBTC: result.amount / 100000000,
                        expiresAt: result.expiresAt,
                        qrCode: result.qrCode
                    };
                    
                    window.showPaymentModal(invoice);
                    
                    // Store for reference
                    localStorage.setItem('currentInvoice', JSON.stringify(invoice));
                    
                    // Start payment verification if function exists
                    if (typeof window.startPaymentVerification === 'function') {
                        window.startPaymentVerification(invoice.id);
                    }
                } else {
                    // Fallback: show invoice details
                    alert(`Lightning Invoice Created!\n\nInvoice: ${result.lightningInvoice}\nAmount: ${result.amount} sats\n\nCopy this invoice to your Lightning wallet to pay.`);
                }
                
            } catch (error) {
                console.error('❌ Error creating invoice:', error);
                
                // User-friendly error messages
                let message = 'Failed to create invoice. ';
                if (error.message.includes('fetch')) {
                    message = 'Network error. Please check your connection and try again.';
                } else if (error.message.includes('tier')) {
                    message = 'Please play the game first to unlock a tier.';
                } else if (error.message.includes('batch')) {
                    message = 'Invalid batch count. Please select between 1-10 batches.';
                } else {
                    message += error.message;
                }
                
                alert(message);
            } finally {
                // Reset button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'CREATE LIGHTNING INVOICE';
                }
            }
        });
        
        console.log('✅ Form submission handler fixed');
    }
    
    // Also monitor for button getting stuck
    function monitorButton() {
        setInterval(() => {
            const submitBtn = document.querySelector('#submitRgbInvoice');
            if (submitBtn && submitBtn.textContent.includes('PROCESSING')) {
                // Button is stuck, check how long
                if (!submitBtn.dataset.processingStart) {
                    submitBtn.dataset.processingStart = Date.now();
                } else {
                    const elapsed = Date.now() - parseInt(submitBtn.dataset.processingStart);
                    if (elapsed > 10000) { // 10 seconds timeout
                        console.log('⚠️ Button stuck in processing, resetting...');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'CREATE LIGHTNING INVOICE';
                        delete submitBtn.dataset.processingStart;
                    }
                }
            } else if (submitBtn) {
                delete submitBtn.dataset.processingStart;
            }
        }, 1000);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fixFormSubmission();
            monitorButton();
        });
    } else {
        fixFormSubmission();
        monitorButton();
    }
    
    console.log('✅ Invoice submission fix loaded');
    
})();