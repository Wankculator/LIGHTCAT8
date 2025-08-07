/**
 * Webhook Routes
 * Handles payment webhooks and distribution triggers
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { rateLimiter } = require('../middleware/rateLimiter');

// BTCPay webhook endpoint
router.post('/lightning', 
  webhookController.handleWebhook.bind(webhookController)
);

// Alternative webhook endpoints for compatibility
router.post('/btcpay',
  webhookController.handleWebhook.bind(webhookController)
);

router.post('/payment',
  webhookController.handleWebhook.bind(webhookController)
);

// Admin endpoints for manual distribution
router.post('/admin/distribute/:invoiceId',
  rateLimiter({ max: 5, windowMs: 60000 }), // 5 requests per minute
  webhookController.triggerManualDistribution.bind(webhookController)
);

// Distribution status check
router.get('/distribution/status/:invoiceId',
  webhookController.getDistributionStatus.bind(webhookController)
);

module.exports = router;