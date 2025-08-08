// RGB Integration Routes
// API endpoints for automated token distribution

const express = require('express');
const router = express.Router();
const rgbIntegrationController = require('../controllers/rgbIntegrationController');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Public endpoints
router.post('/invoice',
  rateLimiter({ windowMs: 60000, max: 10 }), // 10 requests per minute
  validateRequest({
    rgbInvoice: 'required|string|min:100',
    batchCount: 'required|integer|min:1|max:10',
    email: 'email',
    tier: 'required|string|in:bronze,silver,gold'
  }),
  rgbIntegrationController.createInvoice.bind(rgbIntegrationController)
);

router.get('/invoice/:invoiceId/status',
  rateLimiter({ windowMs: 60000, max: 60 }), // 60 requests per minute
  rgbIntegrationController.checkPaymentStatus.bind(rgbIntegrationController)
);

router.get('/download/:invoiceId',
  rateLimiter({ windowMs: 60000, max: 20 }), // 20 downloads per minute
  rgbIntegrationController.downloadConsignment.bind(rgbIntegrationController)
);

router.get('/stats',
  rateLimiter({ windowMs: 60000, max: 30 }), // 30 requests per minute
  rgbIntegrationController.getStats.bind(rgbIntegrationController)
);

// Webhook endpoint (no rate limiting for webhooks)
router.post('/webhook/btcpay',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  rgbIntegrationController.processWebhook.bind(rgbIntegrationController)
);

// Admin endpoints (require authentication)
router.get('/admin/distribution-queue',
  authenticate,
  async (req, res) => {
    const rgbIntegrationService = require('../services/rgbIntegrationService');
    const stats = await rgbIntegrationService.getDistributionStats();
    res.json(stats);
  }
);

router.post('/admin/distribution/pause',
  authenticate,
  async (req, res) => {
    const rgbIntegrationService = require('../services/rgbIntegrationService');
    await rgbIntegrationService.emergencyStop();
    res.json({ success: true, message: 'Distribution paused' });
  }
);

router.post('/admin/distribution/resume',
  authenticate,
  async (req, res) => {
    const rgbIntegrationService = require('../services/rgbIntegrationService');
    await rgbIntegrationService.resumeDistribution();
    res.json({ success: true, message: 'Distribution resumed' });
  }
);

router.get('/admin/monitor/stats',
  authenticate,
  async (req, res) => {
    const blockchainMonitor = require('../services/blockchainMonitorService');
    const stats = blockchainMonitor.getStats();
    res.json(stats);
  }
);

router.get('/admin/btcpay/health',
  authenticate,
  async (req, res) => {
    const btcpayVoltageService = require('../services/btcpayVoltageService');
    const health = await btcpayVoltageService.checkHealth();
    res.json(health);
  }
);

// Error handler
router.use((error, req, res, next) => {
  console.error('RGB Integration route error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;