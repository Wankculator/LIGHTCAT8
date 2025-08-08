// Invoice creation fix
document.addEventListener('DOMContentLoaded', function() {
    // Override the invoice creation handler
    const originalShowPaymentModal = window.showPaymentModal;
    
    // Fix for invoice response structure
    window.showPaymentModal = function(invoiceData) {
        console.log('📱 Invoice data received:', invoiceData);
        
        // Ensure we have the correct structure
        if (!invoiceData.payment_request && invoiceData.lightningInvoice) {
            invoiceData.payment_request = invoiceData.lightningInvoice;
        }
        
        if (!invoiceData.id && invoiceData.invoiceId) {
            invoiceData.id = invoiceData.invoiceId;
        }
        
        if (!invoiceData.expires_at && invoiceData.expiresAt) {
            invoiceData.expires_at = invoiceData.expiresAt;
        }
        
        // Call original function if it exists
        if (originalShowPaymentModal) {
            return originalShowPaymentModal(invoiceData);
        }
    };
});