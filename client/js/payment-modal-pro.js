// Professional Payment Modal System - LIGHTCAT
// Embedded BTCPay functionality with Lightning + Bitcoin options

class PaymentModalPro {
    constructor() {
        this.modal = null;
        this.invoiceData = null;
        this.pollInterval = null;
        this.countdownInterval = null;
        this.selectedMethod = 'lightning';
        this.qrCodeInstance = null;
        this.expiryTime = null;
        
        this.init();
    }
    
    init() {
        // Create modal HTML structure
        this.createModal();
        this.attachEventListeners();
    }
    
    createModal() {
        const modalHTML = `
            <div id="paymentModalPro" class="payment-modal-overlay">
                <div class="payment-modal-container">
                    <!-- Header -->
                    <div class="payment-modal-header">
                        <button class="payment-modal-close" id="closePaymentModal">&times;</button>
                        <h2 class="payment-modal-title">Complete Your Purchase</h2>
                        <p class="payment-modal-subtitle">
                            <span id="modalBatchCount">1</span> batch × 700 LIGHTCAT tokens
                        </p>
                    </div>
                    
                    <!-- Payment Method Tabs -->
                    <div class="payment-method-tabs">
                        <div class="payment-method-tab active" data-method="lightning">
                            <div class="payment-method-icon">⚡</div>
                            <div class="payment-method-name">Lightning</div>
                            <div class="payment-method-desc">Instant • Low fees</div>
                        </div>
                        <div class="payment-method-tab" data-method="bitcoin">
                            <div class="payment-method-icon">₿</div>
                            <div class="payment-method-name">Bitcoin</div>
                            <div class="payment-method-desc">On-chain • Secure</div>
                        </div>
                    </div>
                    
                    <!-- Payment Content -->
                    <div class="payment-modal-content">
                        <!-- Amount Display -->
                        <div class="payment-amount-box">
                            <div class="payment-amount-label">Total Amount</div>
                            <div class="payment-amount-value" id="paymentAmountBTC">0.00002000 BTC</div>
                            <div class="payment-amount-sats">
                                <span id="paymentAmountSats">2,000</span> sats
                                <span class="payment-network-badge">Mainnet</span>
                            </div>
                            <div class="payment-tokens-info">
                                <span class="payment-tokens-label">You will receive:</span>
                                <span class="payment-tokens-value" id="paymentTokenAmount">700 LIGHTCAT</span>
                            </div>
                        </div>
                        
                        <!-- QR Code Section -->
                        <div class="payment-qr-section">
                            <div class="payment-qr-tabs" id="qrTabs" style="display: none;">
                                <div class="payment-qr-tab active" data-qr="lightning">Lightning QR</div>
                                <div class="payment-qr-tab" data-qr="bitcoin">Bitcoin QR</div>
                            </div>
                            <div class="payment-qr-container" id="paymentQRCode">
                                <!-- QR code will be generated here -->
                            </div>
                            <div class="payment-qr-help">
                                Scan with your <span id="qrWalletType">Lightning</span> wallet
                            </div>
                        </div>
                        
                        <!-- Invoice/Address Section -->
                        <div class="payment-invoice-section">
                            <div class="payment-invoice-label" id="invoiceLabel">
                                ⚡ Lightning Invoice
                            </div>
                            <div class="payment-invoice-box" id="paymentInvoice" onclick="paymentModal.copyToClipboard('invoice')">
                                <span id="invoiceText">Loading invoice...</span>
                                <div class="payment-invoice-copied" id="invoiceCopied">Copied!</div>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="payment-actions">
                            <button class="payment-btn payment-btn-primary" onclick="paymentModal.copyToClipboard('invoice')">
                                <span class="payment-btn-icon">📋</span>
                                Copy Invoice
                            </button>
                            <button class="payment-btn payment-btn-secondary" onclick="paymentModal.openInWallet()">
                                <span class="payment-btn-icon">📱</span>
                                Open in Wallet
                            </button>
                        </div>
                        
                        <!-- Alternative Payment Option -->
                        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 0, 0.2);">
                            <a href="#" id="btcpayLink" target="_blank" style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; text-decoration: none;">
                                Or pay with BTCPay Server →
                            </a>
                        </div>
                        
                        <!-- Status Section -->
                        <div class="payment-status-section">
                            <div class="payment-status-icon">⏳</div>
                            <div class="payment-status-text" id="paymentStatusText">
                                Waiting for payment...
                            </div>
                            <div class="payment-timer" id="paymentTimer">
                                Expires in: <span id="expiryCountdown">15:00</span>
                            </div>
                        </div>
                        
                        <!-- Success State (hidden by default) -->
                        <div class="payment-success" id="paymentSuccess" style="display: none;">
                            <div class="payment-success-icon">✅</div>
                            <div class="payment-success-title">Payment Confirmed!</div>
                            <div class="payment-success-desc">
                                Your RGB consignment is being prepared...
                            </div>
                            <button class="payment-btn payment-btn-primary" onclick="paymentModal.downloadConsignment()">
                                <span class="payment-btn-icon">📥</span>
                                Download Consignment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('paymentModalPro');
    }
    
    attachEventListeners() {
        // Close button
        document.getElementById('closePaymentModal').addEventListener('click', () => this.close());
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Payment method tabs
        document.querySelectorAll('.payment-method-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPaymentMethod(tab.dataset.method));
        });
        
        // QR tabs (if both methods available)
        document.querySelectorAll('.payment-qr-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchQRCode(tab.dataset.qr));
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    async open(invoiceData) {
        this.invoiceData = invoiceData;
        this.modal.classList.add('active');
        
        // Update modal with invoice data
        this.updateModalContent(invoiceData);
        
        // Generate QR codes
        await this.generateQRCodes();
        
        // Start payment polling
        this.startPaymentPolling();
        
        // Start countdown timer
        this.startCountdown();
    }
    
    updateModalContent(data) {
        // Update batch count and tokens
        document.getElementById('modalBatchCount').textContent = data.batchCount || 1;
        document.getElementById('paymentTokenAmount').textContent = 
            `${(data.batchCount || 1) * 700} LIGHTCAT`;
        
        // Update amounts
        const sats = data.amount || 2000;
        const btc = (sats / 100000000).toFixed(8);
        document.getElementById('paymentAmountBTC').textContent = `${btc} BTC`;
        document.getElementById('paymentAmountSats').textContent = sats.toLocaleString();
        
        // Update invoice/address
        if (data.lightningInvoice) {
            document.getElementById('invoiceText').textContent = data.lightningInvoice;
        }
        
        // Update BTCPay link
        if (data.checkoutUrl) {
            document.getElementById('btcpayLink').href = data.checkoutUrl;
        }
        
        // Store expiry time
        this.expiryTime = data.expiresAt ? new Date(data.expiresAt) : 
                         new Date(Date.now() + 15 * 60 * 1000);
    }
    
    async generateQRCodes() {
        const container = document.getElementById('paymentQRCode');
        container.innerHTML = ''; // Clear existing
        
        if (!this.invoiceData) return;
        
        // Determine which QR to show based on selected method
        const qrData = this.selectedMethod === 'lightning' ? 
                      this.invoiceData.lightningInvoice : 
                      this.invoiceData.bitcoinAddress;
        
        if (!qrData) {
            container.innerHTML = '<div style="color: rgba(255,255,255,0.5);">QR code unavailable</div>';
            return;
        }
        
        // Generate QR code using qrcode.js library
        if (typeof QRCode !== 'undefined') {
            this.qrCodeInstance = new QRCode(container, {
                text: qrData,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#FFFFFF",
                correctLevel: QRCode.CorrectLevel.L
            });
        } else {
            // Fallback if QRCode library not loaded
            container.innerHTML = `
                <div style="padding: 20px; background: #fff; color: #000; border-radius: 10px;">
                    <div style="font-size: 0.8rem; word-break: break-all;">
                        ${qrData.substring(0, 50)}...
                    </div>
                </div>
            `;
        }
    }
    
    switchPaymentMethod(method) {
        this.selectedMethod = method;
        
        // Update active tab
        document.querySelectorAll('.payment-method-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === method);
        });
        
        // Update content based on method
        if (method === 'lightning') {
            document.getElementById('invoiceLabel').innerHTML = '⚡ Lightning Invoice';
            document.getElementById('qrWalletType').textContent = 'Lightning';
            if (this.invoiceData?.lightningInvoice) {
                document.getElementById('invoiceText').textContent = this.invoiceData.lightningInvoice;
            }
        } else {
            document.getElementById('invoiceLabel').innerHTML = '₿ Bitcoin Address';
            document.getElementById('qrWalletType').textContent = 'Bitcoin';
            if (this.invoiceData?.bitcoinAddress) {
                document.getElementById('invoiceText').textContent = this.invoiceData.bitcoinAddress;
            }
        }
        
        // Regenerate QR code
        this.generateQRCodes();
    }
    
    switchQRCode(type) {
        document.querySelectorAll('.payment-qr-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.qr === type);
        });
        
        // Switch to corresponding payment method
        this.switchPaymentMethod(type);
    }
    
    copyToClipboard(type) {
        let textToCopy = '';
        
        if (type === 'invoice') {
            textToCopy = document.getElementById('invoiceText').textContent;
        }
        
        if (!textToCopy || textToCopy === 'Loading invoice...') return;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Show copied indicator
            const copiedEl = document.getElementById('invoiceCopied');
            copiedEl.classList.add('show');
            setTimeout(() => copiedEl.classList.remove('show'), 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy. Please select and copy manually.');
        });
    }
    
    openInWallet() {
        const invoice = this.selectedMethod === 'lightning' ? 
                       this.invoiceData?.lightningInvoice : 
                       `bitcoin:${this.invoiceData?.bitcoinAddress}?amount=${this.invoiceData?.amount / 100000000}`;
        
        if (!invoice) return;
        
        // Try to open in wallet using appropriate protocol
        if (this.selectedMethod === 'lightning') {
            window.location.href = `lightning:${invoice}`;
        } else {
            window.location.href = invoice;
        }
    }
    
    startPaymentPolling() {
        if (!this.invoiceData?.invoiceId) return;
        
        // Poll every 3 seconds as per CLAUDE.md
        this.pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/rgb/invoice/${this.invoiceData.invoiceId}/status`);
                const data = await response.json();
                
                if (data.status === 'paid' || data.status === 'confirmed') {
                    this.onPaymentSuccess(data);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);
    }
    
    startCountdown() {
        this.countdownInterval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, this.expiryTime - now);
            
            if (remaining === 0) {
                this.onInvoiceExpired();
                return;
            }
            
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            document.getElementById('expiryCountdown').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    onPaymentSuccess(data) {
        // Stop polling
        this.stopPolling();
        
        // Hide status section
        document.querySelector('.payment-status-section').style.display = 'none';
        
        // Show success state
        const successEl = document.getElementById('paymentSuccess');
        successEl.style.display = 'block';
        
        // Store consignment data if available
        if (data.consignmentUrl) {
            this.consignmentUrl = data.consignmentUrl;
        }
        
        // Trigger confetti or celebration effect
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }
    
    onInvoiceExpired() {
        this.stopPolling();
        
        document.getElementById('paymentStatusText').textContent = 'Invoice expired';
        document.getElementById('paymentStatusText').style.color = '#ff6b6b';
        document.querySelector('.payment-status-icon').textContent = '❌';
    }
    
    downloadConsignment() {
        if (this.consignmentUrl) {
            window.location.href = this.consignmentUrl;
        } else {
            alert('Consignment not ready yet. Please wait...');
        }
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    
    close() {
        this.modal.classList.remove('active');
        this.stopPolling();
        
        // Reset state
        this.invoiceData = null;
        this.selectedMethod = 'lightning';
    }
}

// Initialize payment modal
const paymentModal = new PaymentModalPro();

// Export for use in other scripts
window.paymentModalPro = paymentModal;