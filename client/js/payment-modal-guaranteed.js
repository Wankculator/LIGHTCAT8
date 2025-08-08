// Payment Modal Guaranteed Loader - Ensures modal is always available
(function() {
    'use strict';
    
    console.log('💳 Payment Modal Guaranteed: Loading...');
    
    let modalReady = false;
    let pendingInvoices = [];
    
    // Create fallback modal HTML
    function createFallbackModal() {
        if (document.getElementById('paymentModalRoot')) return;
        
        const root = document.createElement('div');
        root.id = 'paymentModalRoot';
        root.style.cssText = 'position: fixed; z-index: 10000; display: none;';
        document.body.appendChild(root);
        
        // Add modal styles if not present
        if (!document.getElementById('paymentModalStyles')) {
            const style = document.createElement('style');
            style.id = 'paymentModalStyles';
            style.textContent = `
                #paymentModalRoot {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                #paymentModalRoot.active {
                    display: flex !important;
                }
                .payment-modal-content {
                    background: #1a1a1a;
                    border: 2px solid #ffd700;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 500px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                }
                .payment-modal-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: transparent;
                    border: none;
                    color: #ffd700;
                    font-size: 28px;
                    cursor: pointer;
                    line-height: 1;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                }
                .payment-modal-title {
                    color: #ffd700;
                    margin: 0 0 20px 0;
                    font-size: 24px;
                }
                .payment-modal-invoice {
                    background: #000;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 12px;
                    color: #fff;
                }
                .payment-modal-qr {
                    text-align: center;
                    margin: 20px 0;
                }
                .payment-modal-qr img {
                    max-width: 250px;
                    height: auto;
                    border: 2px solid #ffd700;
                    border-radius: 8px;
                    padding: 10px;
                    background: white;
                }
                .payment-modal-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                .payment-modal-button {
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                }
                .payment-modal-button.primary {
                    background: #ffd700;
                    color: #000;
                }
                .payment-modal-button.secondary {
                    background: transparent;
                    color: #ffd700;
                    border: 1px solid #ffd700;
                }
                .payment-modal-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                }
                .payment-modal-info {
                    color: #ccc;
                    margin: 10px 0;
                    font-size: 14px;
                }
                .payment-modal-info strong {
                    color: #ffd700;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Fallback modal implementation
    function showFallbackModal(invoice) {
        const root = document.getElementById('paymentModalRoot');
        if (!root) {
            createFallbackModal();
            return setTimeout(() => showFallbackModal(invoice), 100);
        }
        
        const lightningInvoice = invoice.lightningInvoice || invoice.payment_request || '';
        const amount = invoice.amount || invoice.amountSats || 0;
        const qrCode = invoice.qrCode || `lightning:${lightningInvoice}`;
        const expiresAt = invoice.expiresAt || invoice.expires_at || new Date(Date.now() + 15*60*1000).toISOString();
        
        root.innerHTML = `
            <div class="payment-modal-content">
                <button class="payment-modal-close" aria-label="Close" onclick="document.getElementById('paymentModalRoot').classList.remove('active')">×</button>
                <h2 class="payment-modal-title">⚡ Lightning Invoice Created!</h2>
                
                <div class="payment-modal-info">
                    <strong>Amount:</strong> ${amount} sats
                </div>
                <div class="payment-modal-info">
                    <strong>Expires:</strong> ${new Date(expiresAt).toLocaleString()}
                </div>
                
                <div class="payment-modal-invoice" id="paymentInvoiceText">
                    ${lightningInvoice}
                </div>
                
                <div class="payment-modal-qr">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}" 
                         alt="QR Code for Lightning Invoice" />
                </div>
                
                <div class="payment-modal-buttons">
                    <button class="payment-modal-button primary" onclick="
                        navigator.clipboard.writeText('${lightningInvoice}').then(() => {
                            this.textContent = 'Copied!';
                            setTimeout(() => { this.textContent = 'Copy Invoice'; }, 2000);
                        }).catch(() => alert('Failed to copy'));
                    ">Copy Invoice</button>
                    
                    ${lightningInvoice.startsWith('http') ? `
                        <button class="payment-modal-button primary" onclick="window.open('${lightningInvoice}', '_blank')">
                            Open in BTCPay
                        </button>
                    ` : ''}
                    
                    <button class="payment-modal-button secondary" onclick="
                        document.getElementById('paymentModalRoot').classList.remove('active');
                    ">Close</button>
                </div>
            </div>
        `;
        
        root.classList.add('active');
        console.log('✅ Fallback payment modal shown');
    }
    
    // Ensure showPaymentModal exists
    function ensurePaymentModal() {
        if (modalReady) return;
        
        createFallbackModal();
        
        // Override or create the global function
        const originalShow = window.showPaymentModal;
        
        window.showPaymentModal = function(invoice) {
            console.log('💳 showPaymentModal called with:', invoice);
            
            if (!invoice) {
                console.error('[Modal] No invoice provided');
                return;
            }
            
            // Try original implementation first if it exists
            if (originalShow && typeof originalShow === 'function') {
                try {
                    originalShow(invoice);
                    console.log('✅ Original payment modal shown');
                    return;
                } catch (error) {
                    console.warn('[Modal] Original modal failed, using fallback:', error);
                }
            }
            
            // Use fallback
            showFallbackModal(invoice);
        };
        
        modalReady = true;
        console.log('✅ Payment modal guaranteed ready');
        
        // Process any pending invoices
        if (pendingInvoices.length > 0) {
            console.log(`Processing ${pendingInvoices.length} pending invoices`);
            pendingInvoices.forEach(invoice => window.showPaymentModal(invoice));
            pendingInvoices = [];
        }
    }
    
    // Intercept early calls
    if (!window.showPaymentModal) {
        window.showPaymentModal = function(invoice) {
            console.log('[Modal] Early call, queueing invoice');
            pendingInvoices.push(invoice);
            ensurePaymentModal();
        };
    }
    
    // Ensure modal on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensurePaymentModal);
    } else {
        ensurePaymentModal();
    }
    
    // Also ensure on window load as backup
    window.addEventListener('load', ensurePaymentModal);
    
    console.log('✅ Payment modal guaranteed loader initialized');
})();