// RGB Integration Controller
// Main controller for automated token distribution

const { logger } = require('../utils/logger');
const rgbIntegrationService = require('../services/rgbIntegrationService');
const btcpayVoltageService = require('../services/btcpayVoltageService');
const blockchainMonitor = require('../services/blockchainMonitorService');
const supabaseService = require('../services/supabaseService');
const validationService = require('../services/validationService');
const constants = require('../config/constants');

class RGBIntegrationController {
  constructor() {
    // Initialize event listeners
    this.setupEventListeners();
    
    // Track active invoices
    this.activeInvoices = new Map();
  }

  setupEventListeners() {
    // BTCPay events
    btcpayVoltageService.on('invoice:paid', async (data) => {
      await this.handlePaymentReceived(data);
    });
    
    btcpayVoltageService.on('webhook:invoice:settled', async (data) => {
      await this.handlePaymentSettled(data);
    });
    
    // Blockchain monitor events
    blockchainMonitor.on('payment:confirmed', async (data) => {
      await this.handleBlockchainPayment(data);
    });
    
    // RGB integration events
    rgbIntegrationService.on('distribution:complete', async (data) => {
      await this.handleDistributionComplete(data);
    });
  }

  /**
   * Create payment invoice with RGB integration
   */
  async createInvoice(req, res) {
    try {
      const { rgbInvoice, batchCount, email, tier } = req.body;
      
      // Validate RGB invoice
      const validation = rgbIntegrationService.validateRGBInvoice(rgbInvoice);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
      
      // Check tier requirements
      if (!tier) {
        return res.status(400).json({
          success: false,
          error: 'Mint is locked! Play the game to unlock purchasing.'
        });
      }
      
      // Validate batch count
      const tierLimits = constants.TIER_LIMITS;
      if (batchCount > tierLimits[tier]) {
        return res.status(400).json({
          success: false,
          error: `Maximum ${tierLimits[tier]} batches allowed for ${tier} tier`
        });
      }
      
      // Check availability
      const stats = await rgbIntegrationService.getDistributionStats();
      if (stats.availableTokens < batchCount * 700) {
        return res.status(400).json({
          success: false,
          error: 'Not enough tokens available'
        });
      }
      
      // Calculate amount
      const amountSats = batchCount * 2000; // 2000 sats per batch
      const description = `LIGHTCAT Token Purchase - ${batchCount} batch${batchCount > 1 ? 'es' : ''} (${batchCount * 700} tokens)`;
      
      // Create BTCPay invoice
      const paymentInvoice = await btcpayVoltageService.createInvoice({
        amount: amountSats,
        orderId: `rgb-${Date.now()}`,
        buyerEmail: email,
        description,
        metadata: {
          rgbInvoice,
          batchCount,
          tier,
          tokenAmount: batchCount * 700,
          redirectUrl: `${process.env.CLIENT_URL}/success`
        }
      });
      
      // Extract wallet address from RGB invoice
      const walletAddress = validationService.extractWalletAddress(rgbInvoice);
      
      // Save to database
      const purchaseRecord = await supabaseService.insert('purchases', {
        invoice_id: paymentInvoice.invoiceId,
        rgb_invoice: rgbInvoice,
        batch_count: batchCount,
        amount_sats: amountSats,
        payment_request: paymentInvoice.lightningInvoice,
        bitcoin_address: paymentInvoice.bitcoinAddress,
        status: 'pending',
        expires_at: paymentInvoice.expiresAt,
        wallet_address: walletAddress,
        email: email || null,
        token_amount: batchCount * 700,
        tier,
        created_at: new Date()
      });
      
      // Track active invoice
      this.activeInvoices.set(paymentInvoice.invoiceId, {
        ...purchaseRecord,
        btcpayData: paymentInvoice
      });
      
      // Start monitoring if Bitcoin address provided
      if (paymentInvoice.bitcoinAddress) {
        blockchainMonitor.watchAddress(paymentInvoice.bitcoinAddress, {
          invoiceId: paymentInvoice.invoiceId,
          expectedAmount: amountSats,
          type: 'payment'
        });
      }
      
      logger.info('Invoice created', {
        invoiceId: paymentInvoice.invoiceId,
        batchCount,
        amount: amountSats,
        tier
      });
      
      // Return response
      return res.json({
        success: true,
        invoiceId: paymentInvoice.invoiceId,
        checkoutUrl: paymentInvoice.checkoutUrl,
        lightningInvoice: paymentInvoice.lightningInvoice,
        bitcoinAddress: paymentInvoice.bitcoinAddress,
        amount: amountSats,
        expiresAt: paymentInvoice.expiresAt,
        qrCode: `lightning:${paymentInvoice.lightningInvoice}`,
        remainingBatches: Math.floor(stats.availableTokens / 700)
      });
      
    } catch (error) {
      logger.error('Failed to create invoice:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create invoice. Please try again.'
      });
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { invoiceId } = req.params;
      
      // Get from database
      const purchase = await supabaseService.query('purchases', {
        filter: { invoice_id: invoiceId },
        single: true
      });
      
      if (!purchase) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      // Check BTCPay status if pending
      if (purchase.status === 'pending') {
        const btcpayStatus = await btcpayVoltageService.checkInvoiceStatus(invoiceId);
        
        if (btcpayStatus.isPaid && purchase.status === 'pending') {
          // Process payment
          await this.processPayment(purchase, btcpayStatus);
          
          // Get updated record
          const updated = await supabaseService.query('purchases', {
            filter: { invoice_id: invoiceId },
            single: true
          });
          
          return res.json({
            success: true,
            status: 'paid',
            consignment: updated.consignment_file,
            message: 'Payment received! Your tokens are ready.'
          });
        }
      }
      
      // Return current status
      return res.json({
        success: true,
        status: purchase.status,
        consignment: purchase.consignment_file,
        paid: purchase.status !== 'pending',
        message: this.getStatusMessage(purchase.status)
      });
      
    } catch (error) {
      logger.error('Failed to check payment status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check payment status'
      });
    }
  }

  /**
   * Process payment and trigger distribution
   */
  async processPayment(purchase, paymentData) {
    try {
      // Update payment status
      await supabaseService.update('purchases', purchase.invoice_id, {
        status: 'paid',
        paid_at: new Date(),
        payment_txid: paymentData.payments?.[0]?.txId || null
      });
      
      // Trigger token distribution
      await rgbIntegrationService.distributeTokens({
        invoiceId: purchase.invoice_id,
        rgbInvoice: purchase.rgb_invoice,
        batchCount: purchase.batch_count,
        walletAddress: purchase.wallet_address,
        email: purchase.email
      });
      
      // Stop monitoring
      if (purchase.bitcoin_address) {
        blockchainMonitor.unwatchAddress(purchase.bitcoin_address);
      }
      
      logger.info('Payment processed', {
        invoiceId: purchase.invoice_id,
        amount: purchase.amount_sats
      });
      
    } catch (error) {
      logger.error('Failed to process payment:', error);
      throw error;
    }
  }

  /**
   * Handle payment received event
   */
  async handlePaymentReceived(data) {
    const { invoiceId } = data;
    
    try {
      // Get purchase record
      const purchase = await supabaseService.query('purchases', {
        filter: { invoice_id: invoiceId },
        single: true
      });
      
      if (!purchase || purchase.status !== 'pending') {
        return;
      }
      
      // Process payment
      await this.processPayment(purchase, data);
      
    } catch (error) {
      logger.error('Failed to handle payment received:', error);
    }
  }

  /**
   * Handle payment settled webhook
   */
  async handlePaymentSettled(webhookData) {
    const { invoiceId, metadata } = webhookData;
    
    try {
      logger.info('Payment settled webhook received', { invoiceId });
      
      // Get full invoice status
      const btcpayStatus = await btcpayVoltageService.checkInvoiceStatus(invoiceId);
      
      if (btcpayStatus.isPaid) {
        await this.handlePaymentReceived(btcpayStatus);
      }
      
    } catch (error) {
      logger.error('Failed to handle payment settled:', error);
    }
  }

  /**
   * Handle blockchain payment detection
   */
  async handleBlockchainPayment(data) {
    const { invoiceId, txId, amount, confirmations } = data;
    
    try {
      logger.info('Blockchain payment detected', {
        invoiceId,
        txId,
        amount,
        confirmations
      });
      
      // Update purchase record
      await supabaseService.update('purchases', invoiceId, {
        payment_txid: txId,
        confirmations
      });
      
      // Check BTCPay status
      const btcpayStatus = await btcpayVoltageService.checkInvoiceStatus(invoiceId);
      
      if (btcpayStatus.isPaid) {
        await this.handlePaymentReceived(btcpayStatus);
      }
      
    } catch (error) {
      logger.error('Failed to handle blockchain payment:', error);
    }
  }

  /**
   * Handle distribution complete
   */
  async handleDistributionComplete(data) {
    const { invoiceId, consignment, tokens } = data;
    
    logger.info('Distribution complete', {
      invoiceId,
      tokens
    });
    
    // Remove from active invoices
    this.activeInvoices.delete(invoiceId);
  }

  /**
   * Get system statistics
   */
  async getStats(req, res) {
    try {
      // Get distribution stats
      const distributionStats = await rgbIntegrationService.getDistributionStats();
      
      // Get blockchain monitor stats
      const monitorStats = blockchainMonitor.getStats();
      
      // Get sales stats from database
      const salesStats = await supabaseService.query('sales_stats', {
        single: true
      });
      
      // Calculate progress
      const totalBatches = 27900; // 93% of 21M tokens
      const soldBatches = salesStats?.batches_sold || 0;
      
      const stats = {
        success: true,
        rgb: distributionStats,
        monitor: monitorStats,
        sales: {
          batchesSold: soldBatches,
          batchesRemaining: totalBatches - soldBatches,
          tokensSold: soldBatches * 700,
          tokensRemaining: (totalBatches - soldBatches) * 700,
          percentSold: ((soldBatches / totalBatches) * 100).toFixed(2),
          uniqueBuyers: salesStats?.unique_buyers || 0,
          totalRevenue: salesStats?.total_revenue_sats || 0,
          currentPrice: 2000,
          lastSale: salesStats?.last_sale_time
        },
        system: {
          activeInvoices: this.activeInvoices.size,
          btcpayConnected: btcpayVoltageService.isConfigured,
          rgbNodeStatus: distributionStats.nodeStatus,
          blockchainMonitoring: monitorStats.isMonitoring
        }
      };
      
      return res.json(stats);
      
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  }

  /**
   * Download consignment file
   */
  async downloadConsignment(req, res) {
    try {
      const { invoiceId } = req.params;
      
      // Get purchase record
      const purchase = await supabaseService.query('purchases', {
        filter: { invoice_id: invoiceId },
        single: true
      });
      
      if (!purchase) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
      
      if (!purchase.consignment_file) {
        return res.status(400).json({
          success: false,
          error: 'Consignment not ready'
        });
      }
      
      // Prepare file download
      const consignmentBuffer = Buffer.from(purchase.consignment_file, 'base64');
      const filename = `lightcat_${invoiceId}_${purchase.batch_count}batches.rgb`;
      
      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', consignmentBuffer.length);
      
      // Send file
      return res.send(consignmentBuffer);
      
    } catch (error) {
      logger.error('Failed to download consignment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to download consignment'
      });
    }
  }

  /**
   * Get status message
   */
  getStatusMessage(status) {
    const messages = {
      'pending': 'Waiting for payment...',
      'paid': 'Payment received! Generating tokens...',
      'delivered': 'Tokens delivered! Download your consignment.',
      'expired': 'Invoice expired. Please create a new one.',
      'failed': 'Distribution failed. Please contact support.'
    };
    
    return messages[status] || 'Unknown status';
  }

  /**
   * Process BTCPay webhook
   */
  async processWebhook(req, res) {
    try {
      const signature = req.headers['btcpay-sig'];
      const payload = req.body;
      
      // Process webhook
      const result = await btcpayVoltageService.processWebhook(payload, signature);
      
      logger.info('Webhook processed', result);
      
      return res.json({ received: true });
      
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      
      if (error.message === 'Invalid webhook signature') {
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}

module.exports = new RGBIntegrationController();