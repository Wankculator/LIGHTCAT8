/**
 * Webhook Controller
 * Handles payment webhooks from BTCPay Server
 * Triggers RGB token distribution on successful payment
 */

const crypto = require('crypto');
const logger = require('../utils/logger');
const rgbDistributionService = require('../services/rgbDistributionService');
const btcpayVoltageService = require('../services/btcpayVoltageService');
const databaseService = require('../services/databaseService');

class WebhookController {
  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Set up BTCPay event handlers
   */
  setupEventHandlers() {
    // Listen for payment events
    btcpayVoltageService.on('webhook:invoice:settled', this.handlePaymentSettled.bind(this));
    btcpayVoltageService.on('webhook:invoice:complete', this.handlePaymentComplete.bind(this));
    
    logger.info('Webhook event handlers initialized');
  }

  /**
   * Main webhook endpoint
   */
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['btcpay-sig'] || req.headers['x-signature'];
      const payload = req.body;

      logger.info('Webhook received', {
        type: payload.type,
        invoiceId: payload.invoiceId
      });

      // Process webhook through BTCPay service
      const result = await btcpayVoltageService.processWebhook(payload, signature);

      // Return success
      res.status(200).json({
        success: true,
        processed: true
      });

    } catch (error) {
      logger.error('Webhook processing failed', error);
      
      // Return error but with 200 status to prevent retries
      res.status(200).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle payment settled event (payment confirmed)
   */
  async handlePaymentSettled(webhookData) {
    const { invoiceId } = webhookData;

    try {
      logger.info('Payment settled, starting token distribution', { invoiceId });

      // Get invoice details from database
      const invoice = await databaseService.getRGBInvoice(invoiceId);
      
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found in database`);
      }

      // Check if already distributed
      if (invoice.status === 'delivered' && invoice.consignment) {
        logger.info('Tokens already distributed for invoice', { invoiceId });
        return;
      }

      // Update invoice status to paid
      await databaseService.updateRGBInvoiceStatus(invoiceId, 'paid');

      // Trigger token distribution
      const distributionResult = await rgbDistributionService.distributeTokens({
        invoiceId: invoice.invoice_id,
        rgbInvoice: invoice.rgb_invoice,
        batchCount: invoice.batch_count,
        paymentHash: invoice.payment_hash,
        buyerEmail: invoice.email
      });

      // Store consignment in database
      if (distributionResult.success && distributionResult.consignment) {
        await databaseService.storeConsignment(invoiceId, distributionResult.consignment);
        await databaseService.updateRGBInvoiceStatus(invoiceId, 'delivered');

        logger.info('Token distribution completed', {
          invoiceId,
          tokenAmount: distributionResult.tokenAmount
        });

        // Send confirmation email if configured
        if (invoice.email) {
          await this.sendDistributionEmail(invoice.email, {
            invoiceId,
            tokenAmount: distributionResult.tokenAmount,
            downloadUrl: `/api/rgb/consignment/${invoiceId}`
          });
        }
      }

    } catch (error) {
      logger.error('Failed to distribute tokens for settled payment', {
        invoiceId,
        error: error.message
      });

      // Update invoice with error status
      await databaseService.updateRGBInvoiceStatus(invoiceId, 'distribution_failed', {
        error: error.message,
        failedAt: new Date().toISOString()
      });

      // Schedule retry
      this.scheduleDistributionRetry(invoiceId);
    }
  }

  /**
   * Handle payment complete event
   */
  async handlePaymentComplete(webhookData) {
    const { invoiceId } = webhookData;

    try {
      logger.info('Payment complete event received', { invoiceId });

      // Check if distribution already happened
      const invoice = await databaseService.getRGBInvoice(invoiceId);
      
      if (!invoice) {
        logger.warn('Invoice not found for complete event', { invoiceId });
        return;
      }

      if (invoice.status !== 'delivered') {
        // Try distribution again if not already delivered
        await this.handlePaymentSettled(webhookData);
      }

      // Update stats
      await this.updateSalesStats(invoice);

    } catch (error) {
      logger.error('Error handling payment complete', {
        invoiceId,
        error: error.message
      });
    }
  }

  /**
   * Schedule distribution retry for failed attempts
   */
  scheduleDistributionRetry(invoiceId, attempt = 1) {
    const maxRetries = 3;
    const retryDelays = [5000, 15000, 60000]; // 5s, 15s, 60s

    if (attempt > maxRetries) {
      logger.error('Max distribution retries reached', { invoiceId });
      return;
    }

    const delay = retryDelays[attempt - 1];
    
    logger.info(`Scheduling distribution retry ${attempt}/${maxRetries}`, {
      invoiceId,
      delayMs: delay
    });

    setTimeout(async () => {
      try {
        const invoice = await databaseService.getRGBInvoice(invoiceId);
        
        if (invoice && invoice.status !== 'delivered') {
          const result = await rgbDistributionService.retryDistribution(invoiceId, {
            invoiceId: invoice.invoice_id,
            rgbInvoice: invoice.rgb_invoice,
            batchCount: invoice.batch_count,
            paymentHash: invoice.payment_hash,
            buyerEmail: invoice.email
          });

          if (result.success) {
            await databaseService.storeConsignment(invoiceId, result.consignment);
            await databaseService.updateRGBInvoiceStatus(invoiceId, 'delivered');
            logger.info('Distribution retry successful', { invoiceId, attempt });
          } else {
            throw new Error('Distribution retry failed');
          }
        }
      } catch (error) {
        logger.error('Distribution retry failed', {
          invoiceId,
          attempt,
          error: error.message
        });
        
        // Schedule next retry
        this.scheduleDistributionRetry(invoiceId, attempt + 1);
      }
    }, delay);
  }

  /**
   * Update sales statistics
   */
  async updateSalesStats(invoice) {
    try {
      await databaseService.updateSalesStats({
        batchesSold: invoice.batch_count,
        amountSats: invoice.amount_sats,
        uniqueWallet: invoice.rgb_invoice
      });
    } catch (error) {
      logger.error('Failed to update sales stats', error);
    }
  }

  /**
   * Send distribution confirmation email
   */
  async sendDistributionEmail(email, details) {
    try {
      // Implementation depends on email service
      logger.info('Distribution email queued', { email, invoiceId: details.invoiceId });
    } catch (error) {
      logger.error('Failed to send distribution email', error);
    }
  }

  /**
   * Manual distribution trigger (admin endpoint)
   */
  async triggerManualDistribution(req, res) {
    try {
      const { invoiceId } = req.params;
      const { adminKey } = req.headers;

      // Verify admin key
      if (adminKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Get invoice
      const invoice = await databaseService.getRGBInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }

      // Check payment status
      if (invoice.status !== 'paid' && invoice.status !== 'distribution_failed') {
        return res.status(400).json({
          success: false,
          error: `Cannot distribute for status: ${invoice.status}`
        });
      }

      // Trigger distribution
      const result = await rgbDistributionService.distributeTokens({
        invoiceId: invoice.invoice_id,
        rgbInvoice: invoice.rgb_invoice,
        batchCount: invoice.batch_count,
        paymentHash: invoice.payment_hash,
        buyerEmail: invoice.email
      });

      if (result.success) {
        await databaseService.storeConsignment(invoiceId, result.consignment);
        await databaseService.updateRGBInvoiceStatus(invoiceId, 'delivered');
      }

      res.json({
        success: result.success,
        tokenAmount: result.tokenAmount,
        message: 'Manual distribution completed'
      });

    } catch (error) {
      logger.error('Manual distribution failed', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get distribution status
   */
  async getDistributionStatus(req, res) {
    try {
      const { invoiceId } = req.params;

      const status = rgbDistributionService.getDistributionStatus(invoiceId);
      const invoice = await databaseService.getRGBInvoice(invoiceId);

      res.json({
        success: true,
        invoiceStatus: invoice ? invoice.status : 'not_found',
        distributionStatus: status,
        hasConsignment: invoice && invoice.consignment ? true : false
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new WebhookController();