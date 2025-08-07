const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Enhanced Rate Limiter with different limits for different endpoints
 */

// Redis client (if available)
let redisClient = null;

function initializeRedis() {
    try {
        const redis = require('redis');
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            connectTimeout: 5000,
            lazyConnect: true
        });
        
        redisClient.on('error', (err) => {
            logger.error('Redis connection error:', err);
            redisClient = null;
        });
        
        redisClient.on('connect', () => {
            logger.info('Redis connected successfully');
        });
        
    } catch (err) {
        logger.warn('Redis not available, using in-memory rate limiting:', err);
        redisClient = null;
    }
}

initializeRedis();

// Graceful shutdown
process.on('SIGINT', () => {
    if (redisClient) {
        redisClient.quit();
    }
});

// Helper to create rate limiter
const createLimiter = (options) => {
    const config = {
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || 100,
        message: options.message || 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}, endpoint: ${req.path}`);
            res.status(429).json({
                success: false,
                error: options.message || 'Too many requests, please try again later.',
                retryAfter: Math.ceil(options.windowMs / 1000)
            });
        }
    };

    // Use Redis store if available
    if (redisClient) {
        config.store = new RedisStore({
            client: redisClient,
            prefix: 'rl:' + (options.prefix || 'general')
        });
    }

    return rateLimit(config);
};

// Strict limiter for payment endpoints
const paymentLimiter = createLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per 5 minutes
    message: 'Too many payment requests. Please wait before trying again.',
    prefix: 'payment'
});

// RGB invoice creation limiter
const rgbInvoiceLimiter = createLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 invoices per 5 minutes
    message: 'Too many RGB invoice requests. Please wait before trying again.',
    prefix: 'rgb'
});

// General API limiter
const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests. Please slow down.',
    prefix: 'api'
});

// Stats endpoint limiter (more lenient)
const statsLimiter = createLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many stats requests.',
    prefix: 'stats'
});

// Webhook limiter (for external services)
const webhookLimiter = createLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 webhook calls per minute
// Cache for tier-based limiters
const tierLimiters = new Map();

// Dynamic rate limiter based on tier
const tierBasedLimiter = (req, res, next) => {
    const tier = req.body.tier || req.query.tier || 'none';

    // Get or create cached limiter for this tier
    if (!tierLimiters.has(tier)) {
        let maxRequests;
        switch (tier) {
            case 'gold':
                maxRequests = 30;
                break;
            case 'silver':
                maxRequests = 20;
                break;
            case 'bronze':
                maxRequests = 10;
                break;
            default:
                maxRequests = 5;
        }

        const limiter = createLimiter({
            windowMs: 5 * 60 * 1000,
            max: maxRequests,
            message: `Rate limit for ${tier} tier exceeded.`,
            prefix: `tier-${tier}`
        });

        tierLimiters.set(tier, limiter);
    }

    const limiter = tierLimiters.get(tier);
    limiter(req, res, next);
};
    switch(tier) {
        case 'gold':
            maxRequests = 30;
            break;
        case 'silver':
            maxRequests = 20;
            break;
        case 'bronze':
            maxRequests = 10;
            break;
        default:
            maxRequests = 5;
    }

    const limiter = createLimiter({
        windowMs: 5 * 60 * 1000,
        max: maxRequests,
        message: `Rate limit for ${tier} tier exceeded.`,
        prefix: `tier-${tier}`
    });

    limiter(req, res, next);
};

// IP-based strict limiter for suspicious activity
const suspiciousActivityLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 strikes per hour
    message: 'Suspicious activity detected. Access temporarily blocked.',
    prefix: 'suspicious',
    skipSuccessfulRequests: false
});

// Bypass rate limiting for whitelisted IPs (admin, monitoring)
const rateLimitBypass = (req, res, next) => {
    // Helper function to validate IP format
    const isValidIP = (ip) => {
        // IPv4 validation
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        // IPv6 validation (basic)
        const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    };
    
    // Constant-time comparison function to prevent timing attacks
    const constantTimeCompare = (a, b) => {
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    };
    
    // Get and validate whitelisted IPs
    const whitelistedIPs = (process.env.RATE_LIMIT_WHITELIST || '')
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip && isValidIP(ip));
    
    // Check IP whitelist
    if (whitelistedIPs.includes(req.ip)) {
        logger.info(`Rate limit bypass granted for whitelisted IP: ${req.ip}, endpoint: ${req.path}`, {
            ip: req.ip,
            endpoint: req.path,
            bypassType: 'IP_WHITELIST',
            userAgent: req.headers['user-agent']
        });
        return next();
    }
    
    // Check for API key bypass with constant-time comparison
    const apiKey = req.headers['x-api-key'];
    const adminApiKey = process.env.ADMIN_API_KEY;
    
    if (apiKey && adminApiKey && constantTimeCompare(apiKey, adminApiKey)) {
        logger.info(`Rate limit bypass granted for valid API key from IP: ${req.ip}, endpoint: ${req.path}`, {
            ip: req.ip,
            endpoint: req.path,
            bypassType: 'API_KEY',
            userAgent: req.headers['user-agent']
        });
        return next();
    }
    
    // Log failed bypass attempts for security monitoring
    if (apiKey && adminApiKey) {
        logger.warn(`Rate limit bypass attempt with invalid API key from IP: ${req.ip}, endpoint: ${req.path}`, {
            ip: req.ip,
            endpoint: req.path,
            attemptType: 'INVALID_API_KEY',
            userAgent: req.headers['user-agent']
        });
    }
    
    // Apply the appropriate limiter
    next();
};

module.exports = {
    paymentLimiter,
    rgbInvoiceLimiter,
    apiLimiter,
    statsLimiter,
    webhookLimiter,
    authLimiter,
    gameLimiter,
    tierBasedLimiter,
    suspiciousActivityLimiter,
    rateLimitBypass,
    createLimiter
};