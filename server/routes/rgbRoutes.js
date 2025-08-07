const express = require('express');
const router = express.Router();
const rgbPaymentController = require('../controllers/rgbPaymentController');
const { 
  rgbInvoiceLimiter, 
  statsLimiter, 
  tierBasedLimiter,
  apiLimiter 
} = require('../middleware/enhancedRateLimiter');
const { validateRequest } = require('../middleware/validation');
const { body, param } = require('express-validator');

// Use enhanced rate limiters
const rgbLimiter = apiLimiter;
const invoiceLimiter = rgbInvoiceLimiter;

// Validation rules
const createInvoiceValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('rgbInvoice').notEmpty().withMessage('RGB invoice is required'),
  body('batchCount').optional().isInt({ min: 1, max: 10 }).withMessage('Batch count must be between 1 and 10')
];

const invoiceIdValidation = [
  param('invoiceId').isUUID().withMessage('Invalid invoice ID')
];

// Routes

/**
 * @route   POST /api/rgb/invoice
 * @desc    Create Lightning invoice for RGB token purchase
 * @access  Public
 */
router.post(
  '/invoice',
  invoiceLimiter,
  tierBasedLimiter, // Apply tier-based limits
  createInvoiceValidation,
  validateRequest,
  rgbPaymentController.createInvoice
);

/**
 * @route   GET /api/rgb/invoice/:invoiceId/status
 * @desc    Check payment status and consignment availability
 * @access  Public
 */
router.get(
  '/invoice/:invoiceId/status',
  rgbLimiter,
  invoiceIdValidation,
  validateRequest,
  rgbPaymentController.checkPaymentStatus
);

/**
 * @route   GET /api/rgb/download/:invoiceId
 * @desc    Download RGB consignment file
 * @access  Public
 */
router.get(
  '/download/:invoiceId',
  rgbLimiter,
  invoiceIdValidation,
  validateRequest,
  rgbPaymentController.downloadConsignment
);

/**
 * @route   GET /api/rgb/stats
 * @desc    Get current RGB sale statistics
 * @access  Public
 */
router.get(
  '/stats',
  statsLimiter, // Use dedicated stats limiter
  rgbPaymentController.getStats
);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rgb-payment',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;