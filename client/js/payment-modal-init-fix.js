
// Payment Modal Initialization Fix
// Ensures new professional modal is used everywhere

(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPaymentModal);
    } else {
        initPaymentModal();
    }
    
    function initPaymentModal() {
        console.log('Initializing payment modal fix...');
        
        // Override any function that tries to show old modal
        window.showPaymentModal = function(invoice) {
            if (window.paymentModalPro) {
                console.log('Using new professional modal');
                window.paymentModalPro.open(invoice);
            } else {
                console.error('Payment modal not loaded!');
            }
        };
        
        // Override the create invoice function
        const originalCreate = window.createLightningInvoice;
        window.createLightningInvoice = async function() {
            console.log('Creating invoice with new flow...');
            
            try {
                const rgbInvoice = document.getElementById('rgbInvoice')?.value;
                const batchCount = parseInt(document.getElementById('batchCount')?.value) || 1;
                const tier = localStorage.getItem('unlockedTier');
                
                if (!rgbInvoice || !rgbInvoice.startsWith('rgb')) {
                    alert('Please enter a valid RGB invoice');
                    return;
                }
                
                const response = await fetch('/api/rgb/invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rgbInvoice, batchCount, tier })
                });
                
                const data = await response.json();
                
                if (data.success && window.paymentModalPro) {
                    // Use new modal
                    window.paymentModalPro.open({
                        ...data,
                        invoiceId: data.invoice_id,
                        lightningInvoice: data.lightning_invoice,
                        bitcoinAddress: data.bitcoin_address,
                        amount: data.amount || batchCount * 2000,
                        batchCount: batchCount,
                        checkoutUrl: data.checkout_url
                    });
                } else if (!data.success) {
                    alert(data.error || 'Failed to create invoice');
                }
                
            } catch (error) {
                console.error('Invoice creation error:', error);
                alert('Error creating invoice: ' + error.message);
            }
        };
        
        console.log('Payment modal fix initialized');
    }
})();
