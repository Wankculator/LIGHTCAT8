// Comprehensive Rate Limiting Middleware for LIGHTCAT
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Store for tracking requests across different categories
const stores = new Map();

/**
 * Create a rate limiter with custom configuration
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests default
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip,
    category = 'general'
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${category}:`, {
        ip: req.ip,
        path: req.path,
        category
      });
      
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Specific rate limiters for different endpoints

// RGB Invoice creation - Very strict
const rgbInvoiceLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 invoices per 5 minutes
  message: 'Too many invoice creation attempts. Please wait before creating more invoices.',
  category: 'rgb-invoice'
});

// Payment verification - Moderate
const paymentStatusLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 checks per minute (1 per second)
  message: 'Too many payment status checks. Please wait a moment.',
  category: 'payment-status'
});

// Stats endpoint - Lenient
const statsLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: 'Too many stats requests.',
  category: 'stats'
});

// Authentication attempts - Very strict
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
  category: 'auth',
  skipSuccessfulRequests: true // Only count failed attempts
});

// Game score submission - Moderate
const gameScoreLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 submissions per 5 minutes
  message: 'Too many score submissions. Please wait.',
  category: 'game-score'
});

// General API rate limiter - Applied to all /api routes
const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: 'Too many API requests. Please slow down.',
  category: 'api-general'
});

// WebSocket connection limiter
const websocketLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 new connections per minute
  message: 'Too many WebSocket connection attempts.',
  category: 'websocket'
});

// Download limiter for consignment files
const downloadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 downloads per 10 minutes
  message: 'Too many download attempts. Please wait.',
  category: 'download'
});

// Admin endpoints - Strict
const adminLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  message: 'Too many admin requests.',
  category: 'admin',
  keyGenerator: (req) => req.user?.id || req.ip // Rate limit by user if authenticated
});

// Webhook endpoints - Special handling
const webhookLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 webhooks per minute
  message: 'Too many webhook requests.',
  category: 'webhook',
  // Webhooks might come from specific IPs, so we might want to whitelist them
  skip: (req) => {
    const whitelistedIPs = process.env.WEBHOOK_WHITELIST_IPS?.split(',') || [];
    return whitelistedIPs.includes(req.ip);
  }
});

// Dynamic rate limiter based on user tier
const createDynamicLimiter = (tier) => {
  const limits = {
    bronze: { windowMs: 15 * 60 * 1000, max: 100 },
    silver: { windowMs: 15 * 60 * 1000, max: 200 },
    gold: { windowMs: 15 * 60 * 1000, max: 500 },
    default: { windowMs: 15 * 60 * 1000, max: 50 }
  };

  const config = limits[tier] || limits.default;
  
  return createRateLimiter({
    ...config,
    message: `Rate limit exceeded for ${tier} tier.`,
    category: `tier-${tier}`
  });
};

// Middleware to apply rate limiting based on route
const applyRateLimiting = (req, res, next) => {
  const path = req.path;
  
  // Determine which rate limiter to use based on the path
  if (path.includes('/api/rgb/invoice') && req.method === 'POST') {
    return rgbInvoiceLimiter(req, res, next);
  } else if (path.includes('/api/rgb/invoice/') && path.includes('/status')) {
    return paymentStatusLimiter(req, res, next);
  } else if (path.includes('/api/rgb/stats') || path.includes('/api/payments/stats')) {
    return statsLimiter(req, res, next);
  } else if (path.includes('/api/auth') || path.includes('/login')) {
    return authLimiter(req, res, next);
  } else if (path.includes('/api/game/score')) {
    return gameScoreLimiter(req, res, next);
  } else if (path.includes('/api/rgb/download')) {
    return downloadLimiter(req, res, next);
  } else if (path.includes('/api/admin')) {
    return adminLimiter(req, res, next);
  } else if (path.includes('/api/webhooks')) {
    return webhookLimiter(req, res, next);
  } else if (path.startsWith('/api/')) {
    return generalApiLimiter(req, res, next);
  }
  
  // No rate limiting for non-API routes
  next();
};

// Export individual limiters and the main middleware
module.exports = {
  createRateLimiter,
  rgbInvoiceLimiter,
  paymentStatusLimiter,
  statsLimiter,
  authLimiter,
  gameScoreLimiter,
  generalApiLimiter,
  websocketLimiter,
  downloadLimiter,
  adminLimiter,
  webhookLimiter,
  createDynamicLimiter,
  applyRateLimiting
};