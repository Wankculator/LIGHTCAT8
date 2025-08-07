/**
 * WebLN Integration for LIGHTCAT
 * Enables Lightning wallet browser extensions
 */

(function() {
    'use strict';
    
    console.log('[WebLN] Checking for WebLN support...');
    
    // Check if WebLN is available
    async function checkWebLN() {
        if (typeof window.webln !== 'undefined') {
            console.log('[WebLN] WebLN detected!');
            try {
                await window.webln.enable();
                console.log('[WebLN] WebLN enabled successfully');
                return true;
            } catch (error) {
                console.log('[WebLN] User rejected WebLN enable request');
                return false;
            }
        }
        console.log('[WebLN] WebLN not available');
        return false;
    }
    
    // Enhance payment buttons with WebLN
    async function enhancePaymentButtons() {
        const weblnEnabled = await checkWebLN();
        if (!weblnEnabled) return;
        
        // Find copy invoice button
        const copyButton = document.querySelector('.copy-btn');
        if (copyButton) {
            // Add WebLN pay button
            const weblnButton = document.createElement('button');
            weblnButton.className = 'btn btn-primary webln-pay-btn';
            weblnButton.innerHTML = '⚡ Pay with WebLN';
            weblnButton.style.marginLeft = '10px';
            
            weblnButton.addEventListener('click', async () => {
                const invoiceElement = document.getElementById('lightningInvoice');
                if (invoiceElement && invoiceElement.value) {
                    try {
                        weblnButton.disabled = true;
                        weblnButton.innerHTML = '⚡ Processing...';
                        
                        const result = await window.webln.sendPayment(invoiceElement.value);
                        console.log('[WebLN] Payment successful:', result);
                        
                        // Payment successful - invoice status will update via polling
                        weblnButton.innerHTML = '✅ Payment Sent!';
                        
                    } catch (error) {
                        console.error('[WebLN] Payment failed:', error);
                        weblnButton.innerHTML = '❌ Payment Failed';
                        weblnButton.disabled = false;
                        
                        setTimeout(() => {
                            weblnButton.innerHTML = '⚡ Pay with WebLN';
                        }, 3000);
                    }
                }
            });
            
            copyButton.parentElement.appendChild(weblnButton);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhancePaymentButtons);
    } else {
        enhancePaymentButtons();
    }
    
    // Re-check when invoice form appears
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const invoiceForm = document.getElementById('invoiceForm');
                if (invoiceForm && invoiceForm.style.display !== 'none') {
                    enhancePaymentButtons();
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();