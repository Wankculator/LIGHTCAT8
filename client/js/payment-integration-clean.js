// Clean Payment Integration - No emojis, minimal UI

window.createLightningInvoice = async function() {
    try {
        // Get form values
        const rgbInvoice = document.getElementById('rgbInvoice')?.value;
        const batchCount = parseInt(document.getElementById('batchCount')?.value) || 1;
        const tier = localStorage.getItem('unlockedTier');
        
        // Validate
        if (!rgbInvoice || !rgbInvoice.startsWith('rgb')) {
            alert('Enter a valid RGB invoice');
            return;
        }
        
        // Show loading
        const btn = event.target;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Creating...';
        
        // Create invoice
        const response = await fetch('/api/rgb/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rgbInvoice, batchCount, tier })
        });
        
        const data = await response.json();
        
        // Reset button
        btn.disabled = false;
        btn.textContent = originalText;
        
        if (data.success) {
            // Open clean modal
            window.paymentModalClean.open({
                invoiceId: data.invoice_id,
                lightningInvoice: data.lightning_invoice,
                bitcoinAddress: data.bitcoin_address,
                amount: data.amount || batchCount * 2000,
                batchCount: batchCount
            });
        } else {
            alert(data.error || 'Failed to create invoice');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating invoice');
    }
};