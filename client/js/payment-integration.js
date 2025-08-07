// Payment Integration - Connects invoice creation with professional modal
// Following CLAUDE.md payment flow rules

document.addEventListener('DOMContentLoaded', function() {
    // Override the existing payment flow to use new modal
    const originalCreateInvoice = window.createLightningInvoice;
    
    // Also override showPaymentModal if it exists
    if (window.showPaymentModal || window.paymentApp?.showPaymentModal) {
        const originalShow = window.showPaymentModal || window.paymentApp?.showPaymentModal;
        const showNewModal = function(invoice) {
            if (window.paymentModalPro) {
                const enhancedData = {
                    ...invoice,
                    invoiceId: invoice.invoice_id || invoice.id,
                    lightningInvoice: invoice.lightning_invoice || invoice.payment_request || invoice.paymentAddress,
                    bitcoinAddress: invoice.bitcoin_address || invoice.bitcoinAddress,
                    amount: invoice.amount || 2000,
                    batchCount: invoice.batchCount || 1,
                    checkoutUrl: invoice.checkout_url || invoice.checkoutUrl,
                    expiresAt: invoice.expires_at || invoice.expiresAt
                };
                window.paymentModalPro.open(enhancedData);
            } else {
                originalShow.call(this, invoice);
            }
        };
        
        window.showPaymentModal = showNewModal;
        if (window.paymentApp) {
            window.paymentApp.showPaymentModal = showNewModal;
        }
    }
    
    window.createLightningInvoice = async function() {
        try {
            // Get batch count and tier
            const batchCount = parseInt(document.getElementById('batchCount')?.value) || 1;
            const tier = localStorage.getItem('unlockedTier');
            const rgbInvoice = document.getElementById('rgbInvoice')?.value;
            
            // Validate RGB invoice format (per CLAUDE.md)
            if (!rgbInvoice || !rgbInvoice.startsWith('rgb:')) {
                alert('Please enter a valid RGB invoice starting with "rgb:"');
                return;
            }
            
            // Show loading state
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating invoice...';
            }
            
            // Call backend to create invoice
            const response = await fetch('/api/rgb/invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rgbInvoice,
                    batchCount,
                    tier,
                    email: document.getElementById('email')?.value
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create invoice');
            }
            
            // Open professional payment modal with invoice data
            if (window.paymentModalPro) {
                // Enhance data with both payment methods
                const enhancedData = {
                    ...data,
                    invoiceId: data.invoice_id || data.id,
                    lightningInvoice: data.lightning_invoice || data.payment_request,
                    bitcoinAddress: data.bitcoin_address,
                    amount: batchCount * 2000, // 2000 sats per batch
                    batchCount: batchCount,
                    checkoutUrl: data.checkout_url || `https://btcpay0.voltageapp.io/i/${data.invoice_id}`,
                    expiresAt: data.expires_at || new Date(Date.now() + 15 * 60 * 1000)
                };
                
                window.paymentModalPro.open(enhancedData);
            } else {
                // Fallback to old modal if new one not loaded
                console.warn('Professional modal not loaded, using fallback');
                if (originalCreateInvoice) {
                    originalCreateInvoice();
                }
            }
            
        } catch (error) {
            console.error('Invoice creation error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // Reset button state
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Lightning Invoice';
            }
        }
    };
    
    // Also hook into any existing payment buttons
    const paymentButtons = document.querySelectorAll('[onclick*="createLightningInvoice"], .create-invoice-btn, #createInvoiceBtn');
    paymentButtons.forEach(btn => {
        // Remove old onclick
        btn.removeAttribute('onclick');
        // Add new event listener
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.createLightningInvoice();
        });
    });
});

// Enhanced payment status checking with WebSocket support
class PaymentStatusChecker {
    constructor() {
        this.ws = null;
        this.invoiceId = null;
    }
    
    connect(invoiceId) {
        this.invoiceId = invoiceId;
        
        // WebSocket connection for real-time updates
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected for payment updates');
                // Subscribe to invoice updates
                this.ws.send(JSON.stringify({
                    type: 'subscribe',
                    invoiceId: this.invoiceId
                }));
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'payment_received' && data.invoiceId === this.invoiceId) {
                    // Payment confirmed via WebSocket
                    if (window.paymentModalPro) {
                        window.paymentModalPro.onPaymentSuccess(data);
                    }
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Fall back to polling
                this.startPolling();
            };
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            // Fall back to polling
            this.startPolling();
        }
    }
    
    startPolling() {
        // Fallback polling mechanism (3 second intervals per CLAUDE.md)
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/rgb/invoice/${this.invoiceId}/status`);
                const data = await response.json();
                
                if (data.status === 'paid' || data.status === 'confirmed') {
                    clearInterval(pollInterval);
                    if (window.paymentModalPro) {
                        window.paymentModalPro.onPaymentSuccess(data);
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);
        
        // Stop polling after 15 minutes (invoice expiry)
        setTimeout(() => clearInterval(pollInterval), 15 * 60 * 1000);
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Export for use
window.PaymentStatusChecker = PaymentStatusChecker;