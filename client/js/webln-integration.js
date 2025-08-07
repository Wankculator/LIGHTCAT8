// This file requires memory-safe-events.js to be loaded first
/**
 * WebLN Integration for LIGHTCAT
 * Enables instant Lightning payments through browser extensions
 * Based on awesome-lightning-network recommendations
 */

class WebLNIntegration {
    constructor() {
        this.enabled = false;
        this.provider = null;
        this.checkAvailability();
    
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}

    async checkAvailability() {
        // Check if WebLN is available (Alby, Joule, etc.)
        if (typeof window.webln !== 'undefined') {
            console.log('⚡ WebLN detected! Enabling instant payments...');
            
            try {
                // Request permission to use WebLN
                await window.webln.enable();
                this.provider = window.webln;
                this.enabled = true;
                
                // Update UI to show WebLN is available
                this.updateUI();
                
                console.log('✅ WebLN enabled successfully!');
                return true;
            } catch (error) {
                console.log('❌ WebLN permission denied:', error);
                return false;
            }
        } else {
            console.log('WebLN not available - using standard flow');
            return false;
        }
    }

    updateUI() {
        // Add WebLN indicator to payment buttons
        const paymentButtons = document.querySelectorAll('.btn-purchase');
        paymentButtons.forEach(btn => {
            if (!btn.querySelector('.webln-badge')) {
                const badge = document.createElement('span');
                badge.className = 'webln-badge';
                badge.innerHTML = '⚡ Instant';
                badge.style.cssText = `
                    background: #FFD700;
                    color: #000;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    margin-left: 8px;
                    font-weight: bold;
                    animation: pulse 2s infinite;
                `;
                btn.appendChild(badge);
            }
        });

        // Add animation
        if (!document.getElementById('webln-styles')) {
            const style = document.createElement('style');
            style.id = 'webln-styles';
            style.textContent = `
                @keyframes pulse {
                    0% { opacity: 0.8; }
                    50% { opacity: 1; }
                    100% { opacity: 0.8; }
                }
                
                .webln-payment-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.95);
                    border: 2px solid #FFD700;
                    border-radius: 10px;
                    padding: 30px;
                    z-index: 10000;
                    text-align: center;
                    max-width: 400px;
                }
                
                .webln-payment-modal h3 {
                    color: #FFD700;
                    margin-bottom: 20px;
                }
                
                .webln-loading {
                    display: inline-block;
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(255, 215, 0, 0.3);
                    border-radius: 50%;
                    border-top-color: #FFD700;
                    animation: spin 1s ease-in-out infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async makePayment(invoice, amount) {
        if (!this.enabled || !this.provider) {
            // Fallback to standard payment flow
            return this.fallbackPayment(invoice);
        }

        // Show payment modal
        const modal = this.showPaymentModal();

        try {
            // Request payment through WebLN
            console.log('⚡ Requesting WebLN payment...');
            const result = await this.provider.sendPayment(invoice);
            
            // Payment successful!
            modal.innerHTML = `
                <h3>✅ Payment Successful!</h3>
                <p>Your LIGHTCAT tokens are being processed...</p>
                <div class="success-animation">🎉</div>
            `;

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }

            // Return success with preimage as proof
            setTimeout(() => modal.remove(), 3000);
            
            return {
                success: true,
                preimage: result.preimage,
                instant: true
            };

        } catch (error) {
            console.error('WebLN payment failed:', error);
            modal.remove();
            
            // User cancelled or error occurred
            if (error.message && error.message.includes('User cancelled')) {
                return { success: false, cancelled: true };
            }
            
            // Fallback to QR code
            return this.fallbackPayment(invoice);
        }
    }

    showPaymentModal() {
        const modal = document.createElement('div');
        modal.className = 'webln-payment-modal';
        modal.innerHTML = `
            <h3>⚡ Processing Lightning Payment</h3>
            <div class="webln-loading"></div>
            <p style="margin-top: 20px; color: #ccc;">
                Confirm payment in your Lightning wallet...
            </p>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    fallbackPayment(invoice) {
        // Standard QR code payment flow
        console.log('Falling back to QR code payment');
        return { success: false, fallback: true };
    }

    // Get node info (optional)
    async getNodeInfo() {
        if (!this.enabled || !this.provider) return null;
        
        try {
            const info = await this.provider.getInfo();
            return {
                node: info.node,
                alias: info.alias,
                color: info.color
            };
        } catch (error) {
            console.error('Failed to get node info:', error);
            return null;
        }
    }

    // Make an invoice (for receiving payments)
    async makeInvoice(amount, description = 'LIGHTCAT Token Purchase') {
        if (!this.enabled || !this.provider) return null;
        
        try {
            const result = await this.provider.makeInvoice({
                amount: amount, // in satoshis
                defaultMemo: description
            });
            
            return result.paymentRequest;
        } catch (error) {
            console.error('Failed to create invoice:', error);
            return null;
        }
    }
}

// Initialize WebLN when DOM is ready
window.SafeEvents.on(document, 'DOMContentLoaded', () => {
    window.lightcatWebLN = new WebLNIntegration();
    
    // Integrate with existing payment flow
    const originalPayment = window.processLightningPayment;
    window.processLightningPayment = async function(invoice, amount) {
        // Try WebLN first
        const weblnResult = await window.lightcatWebLN.makePayment(invoice, amount);
        
        if (weblnResult.success) {
            // WebLN payment successful
            console.log('✅ Instant payment completed!');
            return weblnResult;
        }
        
        // Fallback to original payment method
        if (originalPayment) {
            return originalPayment(invoice, amount);
        }
    };
});

// Make available globally
window.WebLNIntegration = WebLNIntegration;