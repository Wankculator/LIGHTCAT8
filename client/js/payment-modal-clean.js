// Clean Payment Modal - LIGHTCAT
// Minimal, professional, no emojis

class PaymentModalClean {
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
    }
    
    createModal() {
        const modalHTML = `
            <div id="paymentModalClean" class="payment-modal-clean">
                <div class="payment-modal-box">
                    <div class="payment-header">
                        <button class="payment-close" id="closePaymentModal">X</button>
                        <h3 class="payment-title">Payment</h3>
                    </div>
                    
                    <div class="payment-tabs">
                        <button class="payment-tab active" data-method="lightning">Lightning</button>
                        <button class="payment-tab" data-method="bitcoin">Bitcoin</button>
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
                            <input type="text" id="invoiceText" readonly class="invoice-input" />
                            <button class="copy-btn" onclick="paymentModalClean.copy()">Copy</button>
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
        document.getElementById('closePaymentModal').addEventListener('click', () => this.close());
        
        // Tab switching
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchMethod(e.target.dataset.method));
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }
    
    open(invoiceData) {
        this.invoiceData = invoiceData;
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
    }
    
    showLightning() {
        const invoice = this.invoiceData.lightningInvoice || this.invoiceData.lightning_invoice;
        if (!invoice) {
            this.showError('Lightning invoice not available');
            return;
        }
        
        document.getElementById('invoiceText').value = invoice;
        this.generateQR(invoice);
        this.selectedMethod = 'lightning';
        
        // Update tab active state
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === 'lightning');
        });
    }
    
    showBitcoin() {
        const address = this.invoiceData.bitcoinAddress || this.invoiceData.bitcoin_address;
        if (!address) {
            this.showError('Bitcoin address not available');
            return;
        }
        
        const amount = (this.invoiceData.amount / 100000000).toFixed(8);
        const uri = `bitcoin:${address}?amount=${amount}`;
        
        document.getElementById('invoiceText').value = address;
        this.generateQR(uri);
        this.selectedMethod = 'bitcoin';
        
        // Update tab active state
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === 'bitcoin');
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
        
        // Clear existing QR
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Try to use QRCode library if available
        if (typeof QRCode !== 'undefined') {
            const tempDiv = document.createElement('div');
            new QRCode(tempDiv, {
                text: data,
                width: 200,
                height: 200,
                correctLevel: QRCode.CorrectLevel.L
            });
            
            // Copy to canvas
            setTimeout(() => {
                const tempCanvas = tempDiv.querySelector('canvas');
                if (tempCanvas) {
                    canvas.width = 200;
                    canvas.height = 200;
                    ctx.drawImage(tempCanvas, 0, 0);
                }
            }, 100);
        } else {
            // Fallback - show text
            canvas.width = 200;
            canvas.height = 200;
            ctx.fillStyle = '#000';
            ctx.font = '12px monospace';
            ctx.fillText('QR library not loaded', 10, 100);
        }
    }
    
    copy() {
        const input = document.getElementById('invoiceText');
        input.select();
        document.execCommand('copy');
        
        // Brief feedback
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => btn.textContent = originalText, 1000);
    }
    
    startCountdown() {
        let seconds = 900; // 15 minutes
        
        this.countdownInterval = setInterval(() => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            document.getElementById('countdown').textContent = 
                `${mins}:${secs.toString().padStart(2, '0')}`;
            
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
        
        document.getElementById('statusText').textContent = 'Payment confirmed';
        document.getElementById('countdown').style.display = 'none';
        
        // Generate consignment
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
            a.click();
            
            setTimeout(() => this.close(), 2000);
        } catch (error) {
            this.showError('Failed to generate consignment');
        }
    }
    
    handleExpired() {
        clearInterval(this.pollInterval);
        clearInterval(this.countdownInterval);
        document.getElementById('statusText').textContent = 'Invoice expired';
        document.getElementById('countdown').style.display = 'none';
    }
    
    showError(message) {
        document.getElementById('statusText').textContent = message;
        document.getElementById('statusText').style.color = '#ff4444';
    }
    
    close() {
        clearInterval(this.pollInterval);
        clearInterval(this.countdownInterval);
        this.modal.classList.remove('active');
    }
}

// Initialize
window.paymentModalClean = new PaymentModalClean();