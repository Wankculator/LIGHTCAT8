// BTCPay Server on Voltage.cloud Integration
// Professional payment processing with full control

const axios = require('axios');
const crypto = require('crypto');
const EventEmitter = require('events');
const { logger } = require('../utils/logger');

class BTCPayVoltageService extends EventEmitter {
  constructor() {
    super();
    
    // BTCPay configuration from environment
    this.baseUrl = process.env.BTCPAY_URL || 'https://btcpay0.voltageapp.io';
    this.apiKey = process.env.BTCPAY_API_KEY;
    this.storeId = process.env.BTCPAY_STORE_ID;
    this.webhookSecret = process.env.BTCPAY_WEBHOOK_SECRET;
    
    // Payment configuration
    this.network = process.env.BTCPAY_NETWORK || 'mainnet';
    this.defaultExpiry = 15; // minutes
    this.paymentTolerance = 0; // exact amount required
    
    // Check configuration
    this.isConfigured = this.validateConfiguration();
    
    if (this.isConfigured) {
      logger.info('BTCPay Voltage service initialized', {
        url: this.baseUrl,
        storeId: this.storeId,
        network: this.network
      });
    } else {
      logger.warn('BTCPay Voltage service not fully configured');
    }
  }

  validateConfiguration() {
    if (!this.apiKey || !this.storeId) {
      logger.warn('BTCPay missing configuration');
      return false;
    }
    
    // Validate URL format
    try {
      new URL(this.baseUrl);
      return true;
    } catch (error) {
      logger.error('Invalid BTCPay URL:', this.baseUrl);
      return false;
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(params) {
    const {
      amount, // in sats
      orderId,
      buyerEmail,
      description,
      metadata = {}
    } = params;
    
    if (!this.isConfigured) {
      throw new Error('BTCPay service not configured');
    }
    
    try {
      const invoiceData = {
        amount: amount.toString(),
        currency: 'SATS',
        metadata: {
          orderId,
          ...metadata,
          source: 'lightcat-rgb'
        },
        checkout: {
          speedPolicy: 'MediumSpeed', // 1 confirmation
          paymentMethods: ['BTC-LightningNetwork', 'BTC'],
          defaultPaymentMethod: 'BTC-LightningNetwork',
          expirationMinutes: this.defaultExpiry,
          monitoringMinutes: 60,
          paymentTolerance: this.paymentTolerance,
          redirectURL: metadata.redirectUrl,
          redirectAutomatically: true,
          requiresRefundEmail: !!buyerEmail,
          defaultLanguage: 'en'
        },
        receipt: {
          enabled: true,
          showQR: true,
          showPayments: true
        }
      };
      
      // Add buyer info if provided
      if (buyerEmail) {
        invoiceData.buyer = {
          email: buyerEmail,
          notify: true
        };
      }
      
      // Add description if provided
      if (description) {
        invoiceData.itemDesc = description;
        invoiceData.itemCode = 'LIGHTCAT';
      }
      
      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/api/v1/stores/${this.storeId}/invoices`,
        invoiceData,
        {
          headers: {
            'Authorization': `token ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      const invoice = response.data;
      
      // After creating invoice, fetch payment methods to get Lightning invoice
      let lightningInvoice = null;
      let bitcoinAddress = null;
      
      try {
        const paymentMethodsResponse = await axios.get(
          `${this.baseUrl}/api/v1/stores/${this.storeId}/invoices/${invoice.id}/payment-methods`,
          {
            headers: {
              'Authorization': `token ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        const paymentMethods = paymentMethodsResponse.data;
        
        // Find Lightning payment method
        const lightningMethod = paymentMethods.find(
          method => method.paymentMethodId === 'BTC-LN' || method.paymentMethodId === 'BTC-LightningNetwork'
        );
        
        // Find Bitcoin on-chain payment method  
        const bitcoinMethod = paymentMethods.find(
          method => method.paymentMethodId === 'BTC-CHAIN' || method.paymentMethodId === 'BTC'
        );
        
        lightningInvoice = lightningMethod?.destination || null;
        bitcoinAddress = bitcoinMethod?.destination || null;
        
        logger.info('Payment methods retrieved:', {
          hasLightning: !!lightningInvoice,
          hasBitcoin: !!bitcoinAddress,
          lightningInvoiceLength: lightningInvoice?.length
        });
        
      } catch (methodError) {
        logger.error('Failed to fetch payment methods:', methodError.message);
      }
      
      const result = {
        success: true,
        invoiceId: invoice.id,
        checkoutUrl: invoice.checkoutLink,
        status: invoice.status.toLowerCase(),
        amount: amount,
        expiresAt: new Date(invoice.expirationTime * 1000),
        createdAt: new Date(invoice.createdTime * 1000),
        
        // Lightning details - actual BOLT11 invoice from payment methods
        lightningInvoice: lightningInvoice,
        
        // Bitcoin details
        bitcoinAddress: bitcoinAddress,
        bitcoinAmount: amount / 100000000, // Convert sats to BTC
        
        // Additional info
        paymentMethods: [{
          type: 'Lightning',
          currency: 'BTC',
          available: !!lightningInvoice
        }, {
          type: 'OnChain', 
          currency: 'BTC',
          available: !!bitcoinAddress
        }]
      };
      
      logger.info('BTCPay invoice created', {
        invoiceId: result.invoiceId,
        amount: amount,
        orderId: orderId
      });
      
      // Emit event for monitoring
      this.emit('invoice:created', result);
      
      return result;
      
    } catch (error) {
      logger.error('BTCPay invoice creation failed:', {
        error: error.message,
        response: error.response?.data
      });
      
      // Handle specific errors
      if (error.response?.status === 401) {
        throw new Error('BTCPay authentication failed - check API key');
      }
      
      if (error.response?.status === 404) {
        throw new Error('BTCPay store not found - check store ID');
      }
      
      throw new Error(`BTCPay invoice creation failed: ${error.message}`);
    }
  }

  /**
   * Check invoice status
   */
  async checkInvoiceStatus(invoiceId) {
    if (!this.isConfigured) {
      throw new Error('BTCPay service not configured');
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/stores/${this.storeId}/invoices/${invoiceId}`,
        {
          headers: {
            'Authorization': `token ${this.apiKey}`
          },
          timeout: 5000
        }
      );
      
      const invoice = response.data;
      
      // Map BTCPay status to our status
      const statusMap = {
        'New': 'pending',
        'Processing': 'processing',
        'Expired': 'expired',
        'Invalid': 'failed',
        'Settled': 'paid',
        'Complete': 'confirmed'
      };
      
      const result = {
        invoiceId: invoice.id,
        status: statusMap[invoice.status] || 'unknown',
        btcpayStatus: invoice.status,
        isPaid: ['Settled', 'Complete'].includes(invoice.status),
        isExpired: invoice.status === 'Expired',
        amount: parseFloat(invoice.amount),
        
        // Payment details
        payments: invoice.payments?.map(payment => ({
          txId: payment.id,
          receivedAmount: payment.value,
          receivedDate: new Date(payment.receivedTime * 1000),
          status: payment.status,
          cryptoCode: payment.cryptoCode,
          destination: payment.destination
        })) || [],
        
        // Additional info
        exceptionStatus: invoice.exceptionStatus,
        refundable: invoice.refundable || false
      };
      
      // Emit status change events
      if (result.isPaid) {
        this.emit('invoice:paid', result);
      }
      
      return result;
      
    } catch (error) {
      logger.error('BTCPay status check failed:', {
        invoiceId,
        error: error.message
      });
      
      if (error.response?.status === 404) {
        throw new Error('Invoice not found');
      }
      
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      logger.warn('Webhook secret not configured');
      return false;
    }
    
    try {
      // BTCPay uses HMAC-SHA256 for webhook signatures
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(JSON.stringify(payload));
      const expectedSignature = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhook(payload, signature) {
    // Verify signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }
    
    const { type, invoiceId, storeId } = payload;
    
    // Verify store ID matches
    if (storeId !== this.storeId) {
      throw new Error('Webhook store ID mismatch');
    }
    
    logger.info('Processing BTCPay webhook', { type, invoiceId });
    
    // Handle different event types
    switch (type) {
      case 'InvoiceCreated':
        this.emit('webhook:invoice:created', payload);
        break;
        
      case 'InvoiceReceivedPayment':
        this.emit('webhook:invoice:payment', payload);
        break;
        
      case 'InvoiceProcessing':
        this.emit('webhook:invoice:processing', payload);
        break;
        
      case 'InvoiceSettled':
        this.emit('webhook:invoice:settled', payload);
        break;
        
      case 'InvoiceComplete':
        this.emit('webhook:invoice:complete', payload);
        break;
        
      case 'InvoiceExpired':
        this.emit('webhook:invoice:expired', payload);
        break;
        
      case 'InvoiceInvalid':
        this.emit('webhook:invoice:invalid', payload);
        break;
        
      default:
        logger.warn('Unknown webhook type:', type);
    }
    
    return {
      processed: true,
      type,
      invoiceId
    };
  }

  /**
   * Get payment methods for store
   */
  async getPaymentMethods() {
    if (!this.isConfigured) {
      throw new Error('BTCPay service not configured');
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/stores/${this.storeId}/payment-methods`,
        {
          headers: {
            'Authorization': `token ${this.apiKey}`
          }
        }
      );
      
      return response.data.map(method => ({
        enabled: method.enabled,
        cryptoCode: method.cryptoCode,
        paymentMethod: method.paymentMethod,
        rate: method.rate
      }));
      
    } catch (error) {
      logger.error('Failed to get payment methods:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async checkHealth() {
    try {
      // Test API connection
      const response = await axios.get(
        `${this.baseUrl}/api/v1/stores/${this.storeId}`,
        {
          headers: {
            'Authorization': `token ${this.apiKey}`
          },
          timeout: 5000
        }
      );
      
      return {
        healthy: true,
        store: {
          id: response.data.id,
          name: response.data.name,
          website: response.data.website
        },
        paymentMethods: response.data.paymentMethodCriteria?.length || 0
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Generate payment button HTML
   */
  generatePaymentButton(invoiceId, options = {}) {
    const {
      style = 'custom',
      showQr = true,
      size = 'medium'
    } = options;
    
    const checkoutUrl = `${this.baseUrl}/i/${invoiceId}`;
    
    if (style === 'link') {
      return checkoutUrl;
    }
    
    // Generate embeddable button
    return `
      <form method="GET" action="${checkoutUrl}">
        <button 
          type="submit" 
          class="btcpay-button btcpay-${size}"
          style="min-width: 160px; min-height: 48px; cursor: pointer;"
        >
          Pay with Bitcoin ⚡
        </button>
      </form>
    `;
  }

  /**
   * Get store info
   */
  async getStoreInfo() {
    if (!this.isConfigured) {
      throw new Error('BTCPay service not configured');
    }
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/stores/${this.storeId}`,
        {
          headers: {
            'Authorization': `token ${this.apiKey}`
          }
        }
      );
      
      return response.data;
      
    } catch (error) {
      logger.error('Failed to get store info:', error);
      throw error;
    }
  }
}

// Export singleton
module.exports = new BTCPayVoltageService();