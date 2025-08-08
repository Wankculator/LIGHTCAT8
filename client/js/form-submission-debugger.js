// Form Submission Debugger - Intercept and fix form submission
(function() {
    'use strict';
    
    console.log('🔍 Form Submission Debugger: Loading...');
    
    function interceptFormSubmission() {
        const form = document.getElementById('purchaseForm');
        if (!form) {
            console.log('Form not found, retrying...');
            setTimeout(interceptFormSubmission, 1000);
            return;
        }
        
        console.log('✅ Found purchase form');
        
        // Override the fetch to see what's happening
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            console.log('🌐 FETCH intercepted:', {
                url: args[0],
                method: args[1]?.method || 'GET',
                body: args[1]?.body
            });
            
            // If it's our invoice endpoint, ensure it works
            if (args[0] && args[0].includes('/api/rgb/invoice')) {
                console.log('📝 Invoice API call detected!');
                
                // Parse the body to see what's being sent
                try {
                    const body = JSON.parse(args[1].body);
                    console.log('📦 Invoice request data:', body);
                } catch (e) {
                    console.log('Could not parse body');
                }
            }
            
            // Call original fetch
            return originalFetch.apply(this, args)
                .then(response => {
                    console.log('📥 Response received:', {
                        url: args[0],
                        status: response.status,
                        ok: response.ok
                    });
                    return response;
                })
                .catch(error => {
                    console.error('❌ Fetch error:', error);
                    throw error;
                });
        };
        
        // Also add a direct handler to catch any issues
        const submitBtn = document.getElementById('submitRgbInvoice');
        if (submitBtn) {
            console.log('✅ Found submit button');
            
            // Store original onclick if it exists
            const originalOnclick = submitBtn.onclick;
            
            // Add click logger
            submitBtn.addEventListener('click', function(e) {
                console.log('🖱️ Submit button clicked!');
                console.log('Button state:', {
                    disabled: this.disabled,
                    text: this.textContent,
                    form: this.form
                });
                
                // Check if form will submit
                const form = this.form || document.getElementById('purchaseForm');
                if (form) {
                    console.log('Form found, checking validity:', form.checkValidity());
                    
                    // Get form data
                    const rgbInvoice = document.getElementById('rgbInvoice')?.value;
                    const batchCount = document.getElementById('batchCount')?.textContent;
                    const tier = window.unlockedTier || localStorage.getItem('unlockedTier');
                    
                    console.log('Form data:', {
                        rgbInvoice: rgbInvoice ? rgbInvoice.substring(0, 50) + '...' : 'EMPTY',
                        batchCount,
                        tier
                    });
                    
                    // If button says processing but nothing happens, force submit
                    if (this.textContent.includes('PROCESSING') || this.textContent.includes('CREATING')) {
                        console.log('⚠️ Button stuck in processing state');
                        
                        // Only try to force submit if we have an invoice
                        if (rgbInvoice && rgbInvoice.startsWith('rgb:')) {
                            console.log('🚀 Attempting to force submit...');
                            
                            // Create and send the request directly
                            fetch('/api/rgb/invoice', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    rgbInvoice: rgbInvoice,
                                    batchCount: parseInt(batchCount) || 1,
                                    tier: tier || 'bronze'
                                })
                            })
                            .then(res => res.json())
                            .then(data => {
                                console.log('✅ Invoice created:', data);
                                
                                // Show result
                                if (data.success && data.lightningInvoice) {
                                    // Try to show payment modal
                                    if (typeof window.showPaymentModal === 'function') {
                                        window.showPaymentModal({
                                            id: data.invoiceId,
                                            lightningInvoice: data.lightningInvoice,
                                            amountSats: data.amount,
                                            expiresAt: data.expiresAt,
                                            qrCode: data.qrCode
                                        });
                                    } else {
                                        alert('Lightning Invoice Created!\n\n' + data.lightningInvoice);
                                    }
                                    
                                    // Reset button
                                    this.disabled = false;
                                    this.textContent = 'CREATE LIGHTNING INVOICE';
                                }
                            })
                            .catch(err => {
                                console.error('❌ Direct submission failed:', err);
                                alert('Failed to create invoice. Please try again.');
                                this.disabled = false;
                                this.textContent = 'CREATE LIGHTNING INVOICE';
                            });
                        }
                    }
                }
            }, true); // Use capture phase
        }
        
        console.log('✅ Form submission debugger installed');
    }
    
    // Start monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', interceptFormSubmission);
    } else {
        interceptFormSubmission();
    }
    
})();