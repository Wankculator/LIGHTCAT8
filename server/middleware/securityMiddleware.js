const logger = require('../utils/logger');
const paymentSecurityService = require('../services/paymentSecurityService');
const gameValidationService = require('../services/gameValidationService');

/**
 * Middleware to attach security services to request
 */
function attachSecurityServices(req, res, next) {
  req.paymentSecurity = paymentSecurityService;
  req.gameValidation = gameValidationService;
  next();
}

/**
 * Middleware to validate game session for payment requests
 */
async function validateGameSession(req, res, next) {
  const { gameSessionId, tier } = req.body;
  
  // Skip validation if no tier (will be caught by payment controller)
  if (!tier) {
    return next();
  }
  
  if (!gameSessionId) {
    return res.status(400).json({
      success: false,
      error: 'Game session ID required for tier-based purchases'
    });
  }
  
  const userIdentifier = req.ip || req.connection.remoteAddress;
  const validation = gameValidationService.verifyGameForPurchase(
    gameSessionId,
    userIdentifier
  );
  
  if (!validation.isValid) {
    logger.warn('Invalid game session for payment', {
      sessionId: gameSessionId,
      error: validation.error
    });
    return res.status(400).json({
      success: false,
      error: validation.error
    });
  }
  
  // Attach validation result to request
  req.gameValidation = validation;
  next();
}

/**
 * Middleware to check idempotency for payment requests
 */
function checkIdempotency(req, res, next) {
  const { rgbInvoice, batchCount } = req.body;
  
  if (!rgbInvoice || !batchCount) {
    return next();
  }
  
  // Generate idempotency key
  const idempotencyKey = paymentSecurityService.generateIdempotencyKey({
    rgbInvoice,
    batchCount,
    amount: batchCount * 2000 // Constants.SATS_PER_BATCH
  });
  
  // Check if already processed
  const cachedResult = paymentSecurityService.checkIdempotency(idempotencyKey);
  if (cachedResult) {
    logger.info('Returning cached result for idempotent request', {
      idempotencyKey
    });
    return res.json(cachedResult);
  }
  
  // Attach key to request for later use
  req.idempotencyKey = idempotencyKey;
  next();
}

/**
 * Middleware to log payment security events
 */
function logSecurityEvent(eventType) {
  return (req, res, next) => {
    const logData = {
      eventType,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      body: {
        // Log only non-sensitive fields
        batchCount: req.body.batchCount,
        tier: req.body.tier,
        gameSessionId: req.body.gameSessionId
      }
    };
    
    if (req.params.invoiceId) {
      logData.invoiceId = req.params.invoiceId;
    }
    
    logger.info('Security event', logData);
    next();
  };
}

/**
 * Middleware to validate payment amount in webhook
 */
async function validateWebhookPayment(req, res, next) {
  const { invoiceId, amountPaid } = req.body;
  
  if (!invoiceId || !amountPaid) {
    return next();
  }
  
  try {
    // Get expected amount from database
    const invoice = await req.databaseService.getPurchase(invoiceId);
    if (!invoice) {
      logger.warn('Webhook for unknown invoice', { invoiceId });
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    // Validate amount
    const validation = paymentSecurityService.validatePaymentAmount(
      invoice.expected_amount || invoice.amount_sats,
      amountPaid,
      10 // Allow 10 sat tolerance
    );
    
    if (!validation.isValid) {
      logger.error('Webhook payment amount mismatch', {
        invoiceId,
        expected: validation.expectedAmount,
        actual: validation.actualAmount
      });
      
      // Update invoice with error
      await req.databaseService.updatePurchase(invoiceId, {
        status: 'amount_mismatch',
        error_message: validation.error,
        actual_amount_paid: amountPaid
      });
      
      return res.status(400).json({
        success: false,
        error: 'Payment amount mismatch'
      });
    }
    
    // Attach validation to request
    req.paymentValidation = validation;
    next();
    
  } catch (error) {
    logger.error('Error validating webhook payment', error);
    next(error);
  }
}

module.exports = {
  attachSecurityServices,
  validateGameSession,
  checkIdempotency,
  logSecurityEvent,
  validateWebhookPayment
};