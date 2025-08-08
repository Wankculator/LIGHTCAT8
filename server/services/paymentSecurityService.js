const crypto = require('crypto');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class PaymentSecurityService {
  constructor() {
    // Store processed idempotency keys with expiration
    this.processedKeys = new Map();
    // Clean up old keys every hour
    setInterval(() => this.cleanupExpiredKeys(), 3600000);
  }

  /**
   * Validate payment amount matches expected value
   * @param {number} expectedAmount - Expected amount in satoshis
   * @param {number} actualAmount - Actual paid amount in satoshis
   * @param {number} tolerance - Acceptable tolerance in satoshis (default: 0)
   * @returns {Object} Validation result
   */
  validatePaymentAmount(expectedAmount, actualAmount, tolerance = 0) {
    const difference = Math.abs(expectedAmount - actualAmount);
    
    if (difference > tolerance) {
      logger.warn('Payment amount mismatch detected', {
        expected: expectedAmount,
        actual: actualAmount,
        difference,
        tolerance
      });
      
      return {
        isValid: false,
        error: `Payment amount mismatch. Expected ${expectedAmount} sats, received ${actualAmount} sats`,
        expectedAmount,
        actualAmount,
        difference
      };
    }
    
    return {
      isValid: true,
      expectedAmount,
      actualAmount
    };
  }

  /**
   * Generate idempotency key for a payment request
   * @param {Object} paymentData - Payment request data
   * @returns {string} Idempotency key
   */
  generateIdempotencyKey(paymentData) {
    const keyData = {
      rgbInvoice: paymentData.rgbInvoice,
      batchCount: paymentData.batchCount,
      amount: paymentData.amount,
      timestamp: Math.floor(Date.now() / 60000) // 1 minute precision
    };
    
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
    
    return `idem_${hash.substring(0, 16)}`;
  }

  /**
   * Check and record idempotency key
   * @param {string} key - Idempotency key
   * @param {Object} result - Result to return for duplicate requests
   * @returns {Object|null} Previous result if duplicate, null if new
   */
  checkIdempotency(key, result = null) {
    if (this.processedKeys.has(key)) {
      const cached = this.processedKeys.get(key);
      logger.info('Duplicate request detected via idempotency key', {
        key,
        originalTime: cached.timestamp
      });
      return cached.result;
    }
    
    if (result) {
      this.processedKeys.set(key, {
        result,
        timestamp: Date.now(),
        expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });
    }
    
    return null;
  }

  /**
   * Validate game score and tier
   * @param {number} score - Claimed game score
   * @param {string} tier - Claimed tier
   * @param {string} sessionId - Game session ID
   * @returns {Object} Validation result
   */
  async validateGameScore(score, tier, sessionId) {
    // In production, this would check against server-stored game sessions
    // For now, we'll implement basic validation rules
    
    const tierRequirements = {
      bronze: { min: 11, max: 17 },
      silver: { min: 18, max: 27 },
      gold: { min: 28, max: null }
    };
    
    if (!tier || !tierRequirements[tier]) {
      return {
        isValid: false,
        error: 'Invalid tier specified'
      };
    }
    
    const req = tierRequirements[tier];
    
    if (score < req.min || (req.max && score > req.max)) {
      logger.warn('Game score does not match tier', {
        score,
        tier,
        requirements: req
      });
      
      return {
        isValid: false,
        error: `Score ${score} does not qualify for ${tier} tier`,
        actualTier: this.getTierFromScore(score)
      };
    }
    
    return {
      isValid: true,
      score,
      tier
    };
  }

  /**
   * Get tier from score
   * @param {number} score - Game score
   * @returns {string|null} Tier name or null
   */
  getTierFromScore(score) {
    if (score >= 28) return 'gold';
    if (score >= 18) return 'silver';
    if (score >= 11) return 'bronze';
    return null;
  }

  /**
   * Validate batch count for tier
   * @param {number} batchCount - Requested batch count
   * @param {string} tier - User tier
   * @returns {Object} Validation result
   */
  validateBatchCountForTier(batchCount, tier) {
    const tierLimits = constants.TIER_LIMITS;
    
    if (!tier) {
      return {
        isValid: false,
        error: 'No tier specified - game must be played first'
      };
    }
    
    if (!tierLimits[tier]) {
      return {
        isValid: false,
        error: 'Invalid tier'
      };
    }
    
    const maxAllowed = tierLimits[tier];
    
    if (batchCount > maxAllowed) {
      return {
        isValid: false,
        error: `Maximum ${maxAllowed} batches allowed for ${tier} tier`,
        maxAllowed
      };
    }
    
    if (batchCount < 1) {
      return {
        isValid: false,
        error: 'Minimum 1 batch required'
      };
    }
    
    return {
      isValid: true,
      batchCount,
      tier,
      maxAllowed
    };
  }

  /**
   * Calculate expected payment amount
   * @param {number} batchCount - Number of batches
   * @returns {number} Expected amount in satoshis
   */
  calculateExpectedAmount(batchCount) {
    return batchCount * constants.SATS_PER_BATCH;
  }

  /**
   * Validate complete payment request
   * @param {Object} paymentRequest - Payment request data
   * @returns {Object} Comprehensive validation result
   */
  async validatePaymentRequest(paymentRequest) {
    const { rgbInvoice, batchCount, tier, gameScore, sessionId } = paymentRequest;
    
    const validations = {
      rgbInvoice: !!rgbInvoice,
      batchCount: this.validateBatchCountForTier(batchCount, tier),
      expectedAmount: this.calculateExpectedAmount(batchCount)
    };
    
    // Only validate game score if provided
    if (gameScore !== undefined && sessionId) {
      validations.gameScore = await this.validateGameScore(gameScore, tier, sessionId);
    }
    
    const isValid = validations.rgbInvoice && 
                   validations.batchCount.isValid &&
                   (!validations.gameScore || validations.gameScore.isValid);
    
    return {
      isValid,
      validations,
      expectedAmount: validations.expectedAmount
    };
  }

  /**
   * Clean up expired idempotency keys
   */
  cleanupExpiredKeys() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, data] of this.processedKeys.entries()) {
      if (data.expiry < now) {
        this.processedKeys.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired idempotency keys`);
    }
  }

  /**
   * Generate secure game session ID
   * @returns {string} Session ID
   */
  generateGameSessionId() {
    return 'gs_' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash sensitive payment data for logging
   * @param {string} data - Sensitive data
   * @returns {string} Hashed data safe for logging
   */
  hashForLogging(data) {
    if (!data) return 'null';
    const hash = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
    return hash.substring(0, 8) + '...';
  }
}

module.exports = new PaymentSecurityService();