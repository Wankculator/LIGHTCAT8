const crypto = require('crypto');
const logger = require('../utils/logger');
const lightningService = require('../services/lightningService');
const rgbService = require('../services/rgbService').default;
const emailService = require('../services/emailService');
const validationService = require('../services/validationService');
const paymentHelper = require('../services/paymentHelperService');
const paymentSecurityService = require('../services/paymentSecurityService');
const gameValidationService = require('../services/gameValidationService');
const constants = require('../config/constants');

class EnhancedRGBPaymentController {
  /**
   * Create Lightning invoice with enhanced security
   */
  async createInvoice(req, res) {
    try {
      const { rgbInvoice, batchCount, email, tier, gameSessionId } = req.body;
      const userIdentifier = req.ip || req.connection.remoteAddress;

      // Generate idempotency key
      const idempotencyKey = paymentSecurityService.generateIdempotencyKey({
        rgbInvoice,
        batchCount,
        amount: batchCount * constants.SATS_PER_BATCH
      });

      // Check for duplicate request
      const cachedResult = paymentSecurityService.checkIdempotency(idempotencyKey);
      if (cachedResult) {
        logger.info('Returning cached result for duplicate request', { idempotencyKey });
        return res.json(cachedResult);
      }

      // Validate RGB invoice
      const validation = validationService.validateRGBInvoice(rgbInvoice);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Verify game session if tier is provided
      if (tier) {
        const gameVerification = gameValidationService.verifyGameForPurchase(
          gameSessionId,
          userIdentifier
        );
        
        if (!gameVerification.isValid) {
          logger.warn('Invalid game session for purchase', {
            sessionId: gameSessionId,
            tier,
            error: gameVerification.error
          });
          return res.status(400).json({
            success: false,
            error: gameVerification.error
          });
        }

        // Verify tier matches game score
        if (gameVerification.tier !== tier) {
          logger.warn('Tier mismatch with game score', {
            claimedTier: tier,
            actualTier: gameVerification.tier,
            score: gameVerification.score
          });
          return res.status(400).json({
            success: false,
            error: `Your score of ${gameVerification.score} qualifies for ${gameVerification.tier} tier, not ${tier}`
          });
        }
      } else {
        // No tier means mint is locked
        logger.warn('Purchase attempt without game tier', {
          rgbInvoice: paymentSecurityService.hashForLogging(rgbInvoice),
          batchCount
        });
        return res.status(400).json({
          success: false,
          error: 'Mint is locked! You must play the game to unlock purchasing. Score 11+ for Bronze tier.'
        });
      }

      // Validate batch count for tier
      const batchValidation = paymentSecurityService.validateBatchCountForTier(batchCount, tier);
      if (!batchValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: batchValidation.error
        });
      }

      // Check mint status
      const mintStatus = await this._checkMintStatus(req);
      if (mintStatus.isClosed) {
        return res.status(400).json({
          success: false,
          error: 'Token sale has ended',
          remainingBatches: 0
        });
      }

      // Calculate amount and validate
      const expectedAmount = paymentSecurityService.calculateExpectedAmount(batchCount);
      const description = paymentHelper.generateDescription(batchCount);

      // Create Lightning invoice with exact amount
      const lightningInvoice = await lightningService.createInvoice({
        amount: expectedAmount,
        description,
        expiryMinutes: 15,
        orderId: `rgb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        buyerEmail: email,
        metadata: {
          rgbInvoice,
          batchCount,
          tier,
          gameSessionId,
          expectedAmount,
          idempotencyKey,
          timestamp: Date.now()
        }
      });

      // Prepare invoice data with security fields
      const invoiceData = {
        invoice_id: lightningInvoice.id,
        rgb_invoice: rgbInvoice,
        batch_count: batchCount,
        amount_sats: expectedAmount,
        payment_hash: lightningInvoice.payment_hash,
        payment_request: lightningInvoice.payment_request,
        status: 'pending',
        expires_at: lightningInvoice.expires_at,
        wallet_address: validationService.extractWalletAddress(rgbInvoice),
        email: email || null,
        token_amount: batchCount * 700,
        tier,
        game_session_id: gameSessionId,
        idempotency_key: idempotencyKey,
        expected_amount: expectedAmount
      };

      // Save to database
      const invoice = await req.databaseService.createPurchase(invoiceData);

      if (!invoice) {
        throw new Error('Failed to save invoice');
      }

      // Commit transaction
      if (req.commitTransaction) {
        await req.commitTransaction();
      }

      logger.info('Secure RGB invoice created', {
        invoiceId: invoice.invoice_id,
        batchCount,
        amount: expectedAmount,
        tier,
        idempotencyKey
      });

      // Prepare response in format expected by frontend
      const response = {
        success: true,
        invoice: {
          id: invoice.invoice_id,
          payment_request: invoice.payment_request,
          amount: expectedAmount,
          expires_at: invoice.expires_at,
          qrCode: `lightning:${invoice.payment_request}`
        },
        invoiceId: invoice.invoice_id,
        lightningInvoice: invoice.payment_request,
        amount: expectedAmount,
        expiresAt: invoice.expires_at,
        qrCode: `lightning:${invoice.payment_request}`,
        remainingBatches: mintStatus.remainingBatches - batchCount,
        tier,
        idempotencyKey
      };

      // Cache response for idempotency
      paymentSecurityService.checkIdempotency(idempotencyKey, response);

      // Send email if provided
      if (email) {
        await emailService.sendInvoiceCreated(email, {
          invoiceId: invoice.invoice_id,
          amount: expectedAmount,
          expiresAt: invoice.expires_at,
          tier
        }).catch(err => {
          logger.error('Failed to send invoice email:', err);
        });
      }

      return res.json(response);

    } catch (error) {
      logger.error('Failed to create secure RGB invoice:', error);
      
      if (req.rollbackTransaction) {
        await req.rollbackTransaction();
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create invoice. Please try again.'
      });
    }
  }

  /**
   * Check payment status with amount verification
   */
  async checkPaymentStatus(req, res) {
    try {
      const { invoiceId } = req.params;

      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          error: 'Invoice ID is required'
        });
      }

      // Get invoice from database
      const invoice = await req.databaseService.getPurchase(invoiceId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }

      // Check if expired
      if (paymentHelper.isInvoiceExpired(invoice.expires_at)) {
        return res.json({
          success: true,
          status: 'expired',
          message: 'Invoice has expired'
        });
      }

      // Check Lightning payment status
      if (invoice.payment_hash && invoice.status === 'pending') {
        const paymentStatus = await lightningService.checkInvoiceStatus(
          invoice.payment_hash
        );

        if (paymentStatus.isPaid) {
          // CRITICAL: Verify payment amount
          const amountValidation = paymentSecurityService.validatePaymentAmount(
            invoice.expected_amount || invoice.amount_sats,
            paymentStatus.amountPaid,
            10 // Allow 10 sat tolerance for Lightning fees
          );

          if (!amountValidation.isValid) {
            logger.error('Payment amount mismatch detected!', {
              invoiceId,
              expected: amountValidation.expectedAmount,
              actual: amountValidation.actualAmount,
              difference: amountValidation.difference
            });

            // Mark invoice as failed
            await req.databaseService.updatePurchase(invoiceId, {
              status: 'amount_mismatch',
              error_message: amountValidation.error,
              actual_amount_paid: paymentStatus.amountPaid
            });

            return res.json({
              success: false,
              status: 'amount_mismatch',
              error: 'Payment amount does not match invoice. Please contact support.',
              invoiceId
            });
          }

          // Process the payment
          await this._handlePaymentReceived(req, invoice, paymentStatus);
          
          // Get updated invoice
          const updatedInvoice = await req.databaseService.getPurchase(invoiceId);
          
          return res.json({
            success: true,
            status: 'paid',
            consignment: updatedInvoice.consignment_file,
            message: 'Payment received! Your RGB tokens are ready.',
            verifiedAmount: paymentStatus.amountPaid
          });
        }
      }

      // Return current status
      return res.json({
        success: true,
        status: invoice.status,
        consignment: invoice.status === 'delivered' ? invoice.consignment_file : null,
        message: paymentHelper.getStatusMessage(invoice.status)
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
   * Handle payment with enhanced validation
   */
  async _handlePaymentReceived(req, purchase, paymentStatus) {
    try {
      // Double-check idempotency
      if (purchase.idempotency_key) {
        const processed = paymentSecurityService.checkIdempotency(
          `processed_${purchase.idempotency_key}`
        );
        if (processed) {
          logger.info('Payment already processed via idempotency check', {
            invoiceId: purchase.invoice_id
          });
          return;
        }
      }

      // Update status to paid with verification details
      await req.databaseService.updatePurchase(purchase.invoice_id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        actual_amount_paid: paymentStatus.amountPaid,
        payment_verified: true,
        verification_timestamp: new Date().toISOString()
      });

      // Generate RGB consignment
      const consignment = await rgbService.generateConsignment({
        rgbInvoice: purchase.rgb_invoice,
        amount: purchase.token_amount,
        invoiceId: purchase.invoice_id
      });

      // Update with consignment
      await req.databaseService.updatePurchase(purchase.invoice_id, {
        status: 'delivered',
        consignment_file: consignment,
        delivered_at: new Date().toISOString()
      });

      // Mark as processed for idempotency
      if (purchase.idempotency_key) {
        paymentSecurityService.checkIdempotency(
          `processed_${purchase.idempotency_key}`,
          { processed: true }
        );
      }

      // Update sales statistics
      await this._updateSalesStats(req, purchase);

      // Send confirmation email
      if (purchase.email) {
        await emailService.sendPaymentConfirmed(purchase.email, {
          invoiceId: purchase.invoice_id,
          amount: purchase.token_amount,
          tier: purchase.tier,
          downloadUrl: `/api/rgb/download/${purchase.invoice_id}`,
          consignment: consignment
        });
      }

      logger.info('Payment processed successfully with verification', {
        invoiceId: purchase.invoice_id,
        amount: purchase.amount_sats,
        actualPaid: paymentStatus.amountPaid,
        tier: purchase.tier
      });

    } catch (error) {
      logger.error('Failed to handle verified payment:', error);
      throw error;
    }
  }

  // ... (include other methods from original controller)

  async _checkMintStatus(req) {
    const stats = await req.databaseService.getSalesStats();
    const totalBatches = 27900;
    const soldBatches = stats.batches_sold || 0;
    
    return {
      isClosed: soldBatches >= totalBatches,
      remainingBatches: totalBatches - soldBatches,
      totalSold: soldBatches
    };
  }

  async _updateSalesStats(req, purchase) {
    const current = await req.databaseService.getSalesStats();
    
    const updates = {
      batches_sold: (current.batches_sold || 0) + purchase.batch_count,
      unique_buyers: current.unique_buyers || 0,
      total_revenue_sats: (current.total_revenue_sats || 0) + purchase.amount_sats,
      last_sale_time: new Date().toISOString()
    };

    await req.databaseService.updateSalesStats(updates);
  }
}

module.exports = new EnhancedRGBPaymentController();