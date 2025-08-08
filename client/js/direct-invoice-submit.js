// Direct Invoice Submit - Bypass broken form and submit directly
(function() {
    'use strict';
    
    console.log('💉 Direct Invoice Submit: Injecting working submission handler...');
    
    function injectDirectSubmit() {
        const submitBtn = document.getElementById('submitRgbInvoice');
        if (!submitBtn) {
            console.log('Submit button not found, retrying...');
            setTimeout(injectDirectSubmit, 1000);
            return;
        }
        
        console.log('✅ Found submit button, replacing handler');
        
        // Remove ALL existing event listeners by cloning
        const newBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newBtn, submitBtn);
        
        // Add our WORKING click handler
        newBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🚀 DIRECT SUBMIT TRIGGERED');
            
            // Get form data
            const rgbInvoice = document.getElementById('rgbInvoice')?.value?.trim();
            const email = document.getElementById('emailAddress')?.value?.trim() || '';
            const batchCountEl = document.getElementById('batchCount');
            const batchCount = parseInt(batchCountEl?.textContent) || 1;
            const tier = window.unlockedTier || localStorage.getItem('unlockedTier') || 'bronze';
            
            console.log('📦 Form data collected:', {
                rgbInvoice: rgbInvoice ? rgbInvoice.substring(0, 50) + '...' : 'EMPTY',
                batchCount,
                tier,
                email: !!email
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
            this.disabled = true;
            this.textContent = 'CREATING LIGHTNING INVOICE...';
            
            try {
                console.log('📤 Sending invoice request to API...');
                
                const requestBody = {
                    rgbInvoice: rgbInvoice,
                    email: email,
                    batchCount: batchCount,
                    tier: tier,
                    gameSessionId: window.gameSessionId || localStorage.getItem('gameSessionId') || null
                };
                
                console.log('Request body:', requestBody);
                
                const response = await fetch('/api/rgb/invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                console.log('📥 Response received:', {
                    status: response.status,
                    ok: response.ok
                });
                
                const responseText = await response.text();
                console.log('Response text:', responseText);
                
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    console.error('Failed to parse response:', e);
                    throw new Error('Invalid response from server');
                }
                
                if (!response.ok) {
                    throw new Error(result.error || result.message || 'Failed to create invoice');
                }
                
                console.log('✅ Invoice created successfully:', result);
                
                // Show payment modal if available
                if (typeof window.showPaymentModal === 'function') {
                    const invoice = {
                        id: result.invoiceId,
                        lightningInvoice: result.lightningInvoice,
                        amountSats: result.amount,
                        amountBTC: result.amount / 100000000,
                        expiresAt: result.expiresAt,
                        qrCode: result.qrCode
                    };
                    
                    console.log('Showing payment modal with invoice:', invoice);
                    window.showPaymentModal(invoice);
                    
                    // Store for reference
                    localStorage.setItem('currentInvoice', JSON.stringify(invoice));
                    
                    // Start verification if available
                    if (typeof window.startPaymentVerification === 'function') {
                        window.startPaymentVerification(invoice.id);
                    }
                } else {
                    // Fallback: Create our own modal
                    console.log('Payment modal not found, creating fallback');
                    
                    const modalHtml = `
                        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                            <div style="background: #1a1a1a; border: 2px solid #ffd700; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                                <h2 style="color: #ffd700; margin-bottom: 20px;">⚡ Lightning Invoice Created!</h2>
                                <div style="background: #000; padding: 15px; border-radius: 8px; margin-bottom: 20px; word-break: break-all;">
                                    <p style="color: #fff; font-family: monospace; font-size: 12px;">${result.lightningInvoice}</p>
                                </div>
                                <p style="color: #fff; margin-bottom: 10px;">Amount: <strong style="color: #ffd700;">${result.amount} sats</strong></p>
                                <p style="color: #fff; margin-bottom: 20px;">Expires: ${new Date(result.expiresAt).toLocaleString()}</p>
                                <button onclick="navigator.clipboard.writeText('${result.lightningInvoice}'); alert('Copied to clipboard!');" style="background: #ffd700; color: #000; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">Copy Invoice</button>
                                <button onclick="this.closest('div').parentElement.remove();" style="background: transparent; color: #ffd700; border: 1px solid #ffd700; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Close</button>
                            </div>
                        </div>
                    `;
                    
                    const modalDiv = document.createElement('div');
                    modalDiv.innerHTML = modalHtml;
                    document.body.appendChild(modalDiv.firstElementChild);
                }
                
                // Reset button after success
                this.disabled = false;
                this.textContent = 'CREATE LIGHTNING INVOICE';
                
            } catch (error) {
                console.error('❌ Error creating invoice:', error);
                
                // Show error
                alert('Failed to create invoice: ' + error.message);
                
                // Reset button
                this.disabled = false;
                this.textContent = 'CREATE LIGHTNING INVOICE';
            }
        });
        
        console.log('✅ Direct submit handler installed');
    }
    
    // Install immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectDirectSubmit);
    } else {
        injectDirectSubmit();
    }
    
})();