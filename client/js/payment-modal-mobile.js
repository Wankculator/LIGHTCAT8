// Mobile-Optimized Payment Modal - CLAUDE.md Compliant
// No emojis, fully responsive, all devices supported

class PaymentModalMobile {
    constructor() {
        this.modal = null;
        this.invoiceData = null;
        this.pollInterval = null;
        this.countdownInterval = null;
        this.selectedMethod = 'lightning';
        this.init();
    }
    
    init() {
        this.createModal();
        this.attachEventListeners();
        this.setupViewportHandler();
    }
    
    createModal() {
        const modalHTML = `
            <div id="paymentModalClean" class="payment-modal-clean">
                <div class="payment-modal-box">
                    <div class="payment-header">
                        <h3 class="payment-title">Payment</h3>
                        <button class="payment-close" id="closePaymentModal" aria-label="Close">×</button>
                    </div>
                    
                    <div class="payment-tabs" role="tablist">
                        <button class="payment-tab active" data-method="lightning" role="tab" aria-selected="true">
                            Lightning
                        </button>
                        <button class="payment-tab" data-method="bitcoin" role="tab" aria-selected="false">
                            Bitcoin
                        </button>
                    </div>
                    
                    <div class="payment-content">
                        <div class="payment-amount">
                            <div class="amount-value" id="paymentAmount">2,000 sats</div>
                            <div class="amount-tokens" id="tokenAmount">700 LIGHTCAT tokens</div>
                        </div>
                        
                        <div class="payment-qr" id="paymentQR">
                            <canvas id="qrCanvas"></canvas>
                        </div>
                        
                        <div class="payment-invoice">
                            <input type="text" 
                                   id="invoiceText" 
                                   readonly 
                                   class="invoice-input"
                                   aria-label="Payment invoice" />
                            <button class="copy-btn" id="copyBtn">Copy</button>
                        </div>
                        
                        <div class="payment-status" id="paymentStatus">
                            <span id="statusText">Waiting for payment</span>
                            <span id="countdown" class="countdown">15:00</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existing = document.getElementById('paymentModalClean');
        if (existing) existing.remove();
        
        // Add to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('paymentModalClean');
    }
    
    attachEventListeners() {
        // Close button
        const closeBtn = document.getElementById('closePaymentModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.close();
            });
        }
        
        // Tab switching
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchMethod(e.target.dataset.method);
            });
        });
        
        // Copy button
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copy());
            copyBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.copy();
            });
        }
        
        // Click outside to close (desktop only)
        if (window.innerWidth > 768) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }
        
        // Prevent body scroll when modal is open
        this.modal.addEventListener('touchmove', (e) => {
            if (e.target === this.modal) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    setupViewportHandler() {
        // Handle viewport changes
        let viewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const newHeight = window.innerHeight;
            
            // Keyboard appeared (viewport shrunk)
            if (newHeight < viewportHeight * 0.75) {
                this.handleKeyboardShow();
            } else {
                this.handleKeyboardHide();
            }
            
            viewportHeight = newHeight;
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustModalPosition();
            }, 300);
        });
    }
    
    handleKeyboardShow() {
        const modalBox = document.querySelector('.payment-modal-box');
        if (modalBox && window.innerWidth <= 768) {
            modalBox.style.marginTop = '10px';
            modalBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    handleKeyboardHide() {
        const modalBox = document.querySelector('.payment-modal-box');
        if (modalBox) {
            modalBox.style.marginTop = '';
        }
    }
    
    adjustModalPosition() {
        const modalBox = document.querySelector('.payment-modal-box');
        if (!modalBox) return;
        
        const rect = modalBox.getBoundingClientRect();
        
        // Ensure modal is visible
        if (rect.top < 0) {
            modalBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    open(invoiceData) {
        this.invoiceData = invoiceData;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Show modal
        this.modal.classList.add('active');
        
        // Update amounts
        const sats = invoiceData.amount || invoiceData.batchCount * 2000;
        const tokens = invoiceData.batchCount * 700;
        
        document.getElementById('paymentAmount').textContent = `${sats.toLocaleString()} sats`;
        document.getElementById('tokenAmount').textContent = `${tokens.toLocaleString()} LIGHTCAT tokens`;
        
        // Show Lightning by default
        this.showLightning();
        
        // Start countdown
        this.startCountdown();
        
        // Start polling
        this.startPolling();
        
        // Ensure modal is in viewport
        setTimeout(() => this.adjustModalPosition(), 100);
    }
    
    showLightning() {
        const invoice = this.invoiceData.lightningInvoice || 
                       this.invoiceData.lightning_invoice || 
                       this.invoiceData.payment_request;
                       
        if (!invoice) {
            this.showError('Lightning invoice not available');
            return;
        }
        
        document.getElementById('invoiceText').value = invoice;
        this.generateQR(invoice);
        this.selectedMethod = 'lightning';
        
        // Update tab active state
        document.querySelectorAll('.payment-tab').forEach(tab => {
            const isActive = tab.dataset.method === 'lightning';
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
    }
    
    showBitcoin() {
        const address = this.invoiceData.bitcoinAddress || 
                       this.invoiceData.bitcoin_address ||
                       this.invoiceData.address;
                       
        if (!address) {
            this.showError('Bitcoin address not available');
            return;
        }
        
        const amount = ((this.invoiceData.amount || 2000) / 100000000).toFixed(8);
        const uri = `bitcoin:${address}?amount=${amount}`;
        
        document.getElementById('invoiceText').value = address;
        this.generateQR(uri);
        this.selectedMethod = 'bitcoin';
        
        // Update tab active state
        document.querySelectorAll('.payment-tab').forEach(tab => {
            const isActive = tab.dataset.method === 'bitcoin';
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
    }
    
    switchMethod(method) {
        if (method === 'lightning') {
            this.showLightning();
        } else {
            this.showBitcoin();
        }
    }
    
    generateQR(data) {
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size based on container
        const container = canvas.parentElement;
        const size = Math.min(200, container.clientWidth - 40);
        canvas.width = size;
        canvas.height = size;
        
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Try to use QRCode library
        if (typeof QRCode !== 'undefined') {
            try {
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                document.body.appendChild(tempDiv);
                
                new QRCode(tempDiv, {
                    text: data,
                    width: size,
                    height: size,
                    correctLevel: QRCode.CorrectLevel.L,
                    useSVG: false
                });
                
                // Wait for QR to generate then copy to canvas
                setTimeout(() => {
                    const tempCanvas = tempDiv.querySelector('canvas');
                    if (tempCanvas) {
                        ctx.drawImage(tempCanvas, 0, 0, size, size);
                    }
                    document.body.removeChild(tempDiv);
                }, 100);
            } catch (e) {
                console.error('QR generation error:', e);
                this.showQRFallback(ctx, size);
            }
        } else {
            this.showQRFallback(ctx, size);
        }
    }
    
    showQRFallback(ctx, size) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QR code unavailable', size/2, size/2 - 10);
        ctx.fillText('Use copy button below', size/2, size/2 + 10);
    }
    
    copy() {
        const input = document.getElementById('invoiceText');
        const btn = document.getElementById('copyBtn');
        
        // Select and copy
        input.select();
        input.setSelectionRange(0, 99999); // Mobile compatibility
        
        try {
            document.execCommand('copy');
            
            // Visual feedback
            const originalText = btn.textContent;
            btn.textContent = 'Copied';
            btn.style.background = '#4CAF50';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 1500);
        } catch (err) {
            console.error('Copy failed:', err);
            // Fallback for mobile
            navigator.clipboard.writeText(input.value).then(() => {
                btn.textContent = 'Copied';
                setTimeout(() => btn.textContent = 'Copy', 1500);
            });
        }
    }
    
    startCountdown() {
        let seconds = 900; // 15 minutes
        
        this.countdownInterval = setInterval(() => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const countdown = document.getElementById('countdown');
            if (countdown) {
                countdown.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
            
            if (seconds <= 0) {
                this.handleExpired();
                clearInterval(this.countdownInterval);
            }
            seconds--;
        }, 1000);
    }
    
    startPolling() {
        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/rgb/invoice/${this.invoiceData.invoiceId}/status`);
                const data = await response.json();
                
                if (data.status === 'completed' || data.paid) {
                    this.handlePaymentSuccess();
                } else if (data.status === 'expired') {
                    this.handleExpired();
                }
            } catch (error) {
                console.error('Poll error:', error);
            }
        };
        
        // Check immediately then every 3 seconds
        checkStatus();
        this.pollInterval = setInterval(checkStatus, 3000);
    }
    
    handlePaymentSuccess() {
        clearInterval(this.pollInterval);
        clearInterval(this.countdownInterval);
        
        const statusText = document.getElementById('statusText');
        const countdown = document.getElementById('countdown');
        
        if (statusText) statusText.textContent = 'Payment confirmed';
        if (countdown) countdown.style.display = 'none';
        
        // Generate consignment after short delay
        setTimeout(() => {
            this.generateConsignment();
        }, 1000);
    }
    
    async generateConsignment() {
        try {
            const response = await fetch(`/api/rgb/consignment/${this.invoiceData.invoiceId}`);
            const blob = await response.blob();
            
            // Download file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lightcat_${this.invoiceData.invoiceId}.rgb`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Close modal after download
            setTimeout(() => this.close(), 2000);
        } catch (error) {
            this.showError('Failed to generate consignment');
        }
    }
    
    handleExpired() {
        clearInterval(this.pollInterval);
        clearInterval(this.countdownInterval);
        
        const statusText = document.getElementById('statusText');
        const countdown = document.getElementById('countdown');
        
        if (statusText) {
            statusText.textContent = 'Invoice expired';
            statusText.style.color = '#ff4444';
        }
        if (countdown) countdown.style.display = 'none';
    }
    
    showError(message) {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = message;
            statusText.style.color = '#ff4444';
        }
    }
    
    close() {
        clearInterval(this.pollInterval);
        clearInterval(this.countdownInterval);
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Hide modal
        this.modal.classList.remove('active');
    }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.paymentModalMobile = new PaymentModalMobile();
    });
} else {
    window.paymentModalMobile = new PaymentModalMobile();
}