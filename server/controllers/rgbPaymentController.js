// Updated RGB Payment Controller - Handles both API formats
const logger = require('../utils/logger');
const lightningService = require('../services/lightningService');
const rgbService = require('../services/rgbService').default;
const emailService = require('../services/emailService');
const validationService = require('../services/validationService');
const paymentHelper = require('../services/paymentHelperService');
const transactionManager = require('../middleware/transactionManager');
const constants = require('../config/constants');
const { webhookService } = require('../services/webhookService');
const ResponseStandardizer = require('./response-standardizer');

class RGBPaymentController {
  /**
   * Get current sale statistics
   */
  async getStats(req, res) {
    try {
      // Check if database service is available
      if (req.databaseService) {
        // Use database service for real stats
        const stats = await req.databaseService.getSalesStats();
        const totalBatches = 27900; // 93% of 21M tokens (19,530,000 ÷ 700 per batch)
        
        const responseStats = {
          success: true,
          stats: {
            batchesSold: stats.batches_sold || 0,
            batchesRemaining: totalBatches - (stats.batches_sold || 0),
            tokensSold: (stats.batches_sold || 0) * 700,
            uniqueBuyers: stats.unique_wallets || 0,
            currentBatchPrice: 2000,
            lastSaleTime: stats.last_sale_at,
            percentSold: ((stats.batches_sold || 0) / totalBatches * 100).toFixed(2)
          }
        };

        return res.json(responseStats);
      } else {
        // Fallback to legacy format if database service not available
        logger.warn('Database service not available, using legacy stats format');
        
        // Return in the format the production server currently uses
        const legacyStats = {
          totalSupply: 21000000,
          batchesAvailable: 23503,
          batchesSold: 4397,
          pricePerBatch: 2000,
          tokensPerBatch: 700
        };
        
        return res.json(legacyStats);
      }

    } catch (error) {
      logger.error('Error fetching RGB stats:', error);
      
      // Return safe defaults in legacy format
      return res.json({
        totalSupply: 21000000,
        batchesAvailable: 27900,
        batchesSold: 0,
        pricePerBatch: 2000,
        tokensPerBatch: 700
      });
    }
  }

  /**
   * Create Lightning invoice for RGB token purchase
   */
  async createInvoice(req, res) {
    try {
      const { rgbInvoice, batchCount, email, tier } = req.body;

      // Validate inputs
      const validation = validationService.validateRGBInvoice(rgbInvoice);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Validate tier-based batch count - CRITICAL: Mint is LOCKED
      const tierLimits = constants.TIER_LIMITS;

      // CRITICAL: Check if tier is provided - mint is LOCKED without game play
      if (!tier) {
        logger.warn(`Rejecting purchase: ${batchCount} batches requested without tier - mint is LOCKED`);
        return res.status(400).json({
          success: false,
          error: 'Mint is locked! You must play the game to unlock purchasing. Score 11+ for Bronze tier.'
        });
      }

      // Validate batch count against tier limit
      if (tier && tierLimits[tier]) {
        if (batchCount > tierLimits[tier]) {
          return res.status(400).json({
            success: false,
            error: `Maximum ${tierLimits[tier]} batches allowed for ${tier} tier`
          });
        }
      }

      // Basic batch count validation
      if (!paymentHelper.validateBatchCount(batchCount)) {
        return res.status(400).json({
          success: false,
          error: `Invalid batch count. Must be between 1 and ${constants.MAX_BATCH_PURCHASE}.`
        });
      }

      // Check if mint is still open
      const mintStatus = await this._checkMintStatus(req);
      if (mintStatus.isClosed) {
        return res.status(400).json({
          success: false,
          error: 'Token sale has ended',
          remainingBatches: 0
        });
      }

      // Calculate amount
      const amountSats = paymentHelper.calculateAmount(batchCount);
      const description = paymentHelper.generateDescription(batchCount);

      // Check if testnet mode
      const isTestnet = req.headers['x-network'] === 'testnet' || 
                       process.env.USE_TESTNET === 'true';
      
      // Create Lightning invoice
      const lightningInvoice = await lightningService.createInvoice({
        amount: amountSats,
        description,
        expiryMinutes: 15,
        orderId: `rgb-${Date.now()}`,
        buyerEmail: email,
        metadata: {
          rgbInvoice,
          batchCount,
          network: isTestnet ? 'testnet' : 'mainnet',
          ...req.body.metadata
        }
      });

      // Prepare invoice data
      const invoiceData = {
        invoice_id: lightningInvoice.id,
        rgb_invoice: rgbInvoice,
        batch_count: batchCount,
        amount_sats: amountSats,
        payment_hash: lightningInvoice.payment_hash,
        payment_request: lightningInvoice.payment_request,
        expires_at: lightningInvoice.expires_at,
        status: 'pending',
        email: email,
        metadata: lightningInvoice.metadata
      };

      // Store invoice using database service if available
      if (req.databaseService && req.databaseService.createRGBInvoice) {
        await req.databaseService.createRGBInvoice(invoiceData);
      }

      // Prepare standardized response
      const response = ResponseStandardizer.formatInvoiceResponse({
        invoiceId: lightningInvoice.id,
        lightningInvoice: lightningInvoice.payment_request,
        amount: amountSats,
        expiresAt: lightningInvoice.expires_at,
        description: description,
        qrCode: lightningInvoice.qr_code,
        tier: tier,
        remainingBatches: Math.floor(stats.availableTokens / 700)
      });

      logger.info(`Created RGB invoice: ${lightningInvoice.id} for ${batchCount} batches`);
      return res.json(response);

    } catch (error) {
      logger.error('Error creating RGB invoice:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create invoice. Please try again.'
      });
    }
  }

  /**
   * Check payment status and consignment availability
   */
  async checkPaymentStatus(req, res) {
    try {
      const { invoiceId } = req.params;

      // Check database if available
      if (req.databaseService && req.databaseService.getRGBInvoice) {
        const invoice = await req.databaseService.getRGBInvoice(invoiceId);
        
        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        // Check payment status with Lightning service
        const paymentStatus = await lightningService.checkInvoiceStatus(invoice.payment_hash);

        // Update status if changed
        if (paymentStatus.isPaid && invoice.status !== 'paid') {
          // Payment confirmed!
          logger.info(`Payment confirmed for invoice ${invoiceId}`);
          
          // Update invoice status
          if (req.databaseService.updateRGBInvoiceStatus) {
            await req.databaseService.updateRGBInvoiceStatus(invoiceId, 'paid');
          }

          // Trigger consignment generation
          try {
            const consignment = await rgbService.generateConsignment({
              rgbInvoice: invoice.rgb_invoice,
              batchCount: invoice.batch_count,
              paymentHash: invoice.payment_hash
            });

            // Store consignment
            if (req.databaseService.storeConsignment) {
              await req.databaseService.storeConsignment(invoiceId, consignment);
            }

            // Update status to delivered
            if (req.databaseService.updateRGBInvoiceStatus) {
              await req.databaseService.updateRGBInvoiceStatus(invoiceId, 'delivered');
            }

            return res.json({
              success: true,
              status: 'delivered',
              consignment: consignment,
              message: 'Payment confirmed! Your RGB tokens are ready.'
            });

          } catch (consignmentError) {
            logger.error('Failed to generate consignment:', consignmentError);
            return res.json({
              success: true,
              status: 'paid',
              message: 'Payment confirmed! Generating your RGB tokens...'
            });
          }
        }

        // Return current status
        return res.json({
          success: true,
          status: invoice.status,
          consignment: invoice.consignment,
          expiresAt: invoice.expires_at
        });

      } else {
        // Fallback without database
        logger.warn('Database service not available for payment status check');
        return res.json({
          success: true,
          status: 'pending',
          message: 'Payment verification in progress'
        });
      }

    } catch (error) {
      logger.error('Error checking payment status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check payment status'
      });
    }
  }

  /**
   * Download RGB consignment file
   */
  async downloadConsignment(req, res) {
    try {
      const { invoiceId } = req.params;

      if (req.databaseService && req.databaseService.getRGBInvoice) {
        const invoice = await req.databaseService.getRGBInvoice(invoiceId);
        
        if (!invoice) {
          return res.status(404).json({
            success: false,
            error: 'Invoice not found'
          });
        }

        if (invoice.status !== 'delivered' || !invoice.consignment) {
          return res.status(400).json({
            success: false,
            error: 'Consignment not yet available'
          });
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="rgb_consignment_${invoiceId}.rgb"`);
        
        // Send the consignment file
        const consignmentBuffer = Buffer.from(invoice.consignment, 'base64');
        return res.send(consignmentBuffer);

      } else {
        return res.status(503).json({
          success: false,
          error: 'Consignment download temporarily unavailable'
        });
      }

    } catch (error) {
      logger.error('Error downloading consignment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to download consignment'
      });
    }
  }

  /**
   * Check if mint is still open
   * @private
   */
  async _checkMintStatus(req) {
    try {
      if (req.databaseService && req.databaseService.getSalesStats) {
        const stats = await req.databaseService.getSalesStats();
        const totalBatches = 27900;
        const remaining = totalBatches - (stats.batches_sold || 0);
        
        return {
          isClosed: remaining <= 0,
          remaining: remaining
        };
      }
      
      // Default to open if can't check
      return {
        isClosed: false,
        remaining: 27900
      };
      
    } catch (error) {
      logger.error('Error checking mint status:', error);
      return {
        isClosed: false,
        remaining: 27900
      };
    }
  }
}

module.exports = new RGBPaymentController();