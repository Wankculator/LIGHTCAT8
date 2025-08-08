#!/usr/bin/env node

/**
 * Implement Critical Security Fixes Based on Security Audit
 * Run this script to apply the highest priority security fixes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔒 Implementing Critical Security Fixes...\n');

let totalFixes = 0;
const fixes = [];

// Fix 1: Remove hardcoded JWT secret
function fixJWTSecret() {
    console.log('🔑 Fixing hardcoded JWT secret...');
    
    const configPath = path.join(__dirname, '..', 'config.js');
    let content = fs.readFileSync(configPath, 'utf8');
    const originalContent = content;
    
    // Replace the hardcoded fallback
    content = content.replace(
        "jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',",
        `jwtSecret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      return 'dev-only-' + crypto.randomBytes(32).toString('hex');
    })(),`
    );
    
    if (content !== originalContent) {
        fs.writeFileSync(configPath, content);
        fixes.push('✅ Fixed hardcoded JWT secret');
        totalFixes++;
    }
}

// Fix 2: Add payment amount verification
function addPaymentVerification() {
    console.log('\n💰 Adding payment amount verification...');
    
    const controllerPath = path.join(__dirname, '..', 'server', 'controllers', 'rgbPaymentController.js');
    let content = fs.readFileSync(controllerPath, 'utf8');
    const originalContent = content;
    
    // Find the payment verification section
    const verificationCode = `
        // SECURITY: Verify payment amount matches expected
        if (paymentStatus.isPaid && paymentStatus.amountPaid) {
          const expectedAmount = purchase.amount_sats;
          const paidAmount = paymentStatus.amountPaid;
          
          // Allow small variance for Lightning fees (max 1%)
          const variance = expectedAmount * 0.01;
          
          if (paidAmount < expectedAmount - variance) {
            logger.error('Payment amount mismatch', {
              expected: expectedAmount,
              paid: paidAmount,
              invoiceId: invoice.invoice_id
            });
            
            // Mark as underpaid
            await req.databaseService.updatePurchase(invoice.invoice_id, {
              status: 'underpaid',
              paid_amount: paidAmount
            });
            
            return res.json({
              success: false,
              status: 'underpaid',
              message: \`Payment of \${paidAmount} sats is less than required \${expectedAmount} sats\`
            });
          }
        }
`;
    
    // Insert after payment check
    const insertPoint = 'if (paymentStatus.isPaid) {';
    const insertIndex = content.indexOf(insertPoint);
    
    if (insertIndex !== -1 && !content.includes('Payment amount mismatch')) {
        const endIndex = insertIndex + insertPoint.length;
        content = content.slice(0, endIndex) + verificationCode + content.slice(endIndex);
        
        fs.writeFileSync(controllerPath, content);
        fixes.push('✅ Added payment amount verification');
        totalFixes++;
    }
}

// Fix 3: Add idempotency key support
function addIdempotencySupport() {
    console.log('\n🔄 Adding idempotency key support...');
    
    const controllerPath = path.join(__dirname, '..', 'server', 'controllers', 'rgbPaymentController.js');
    let content = fs.readFileSync(controllerPath, 'utf8');
    const originalContent = content;
    
    // Add idempotency check at the beginning of createInvoice
    const idempotencyCode = `
      // SECURITY: Check for idempotency key to prevent duplicate transactions
      const idempotencyKey = req.headers['idempotency-key'];
      if (idempotencyKey) {
        // Check if we've seen this key before
        const existingInvoice = await req.databaseService.getInvoiceByIdempotencyKey(idempotencyKey);
        if (existingInvoice) {
          logger.info('Idempotency key match, returning existing invoice', {
            idempotencyKey,
            invoiceId: existingInvoice.invoice_id
          });
          
          return res.json({
            success: true,
            invoiceId: existingInvoice.invoice_id,
            lightningInvoice: existingInvoice.payment_request,
            amount: existingInvoice.amount_sats,
            expiresAt: existingInvoice.expires_at,
            qrCode: \`lightning:\${existingInvoice.payment_request}\`,
            cached: true
          });
        }
      }
`;
    
    // Insert after the try statement in createInvoice
    const insertPoint = 'const { rgbInvoice, batchCount, email, tier } = req.body;';
    const insertIndex = content.indexOf(insertPoint);
    
    if (insertIndex !== -1 && !content.includes('idempotency-key')) {
        const endIndex = insertIndex + insertPoint.length;
        content = content.slice(0, endIndex) + idempotencyCode + content.slice(endIndex);
        
        // Also add idempotency key to invoice data
        content = content.replace(
            'const invoiceData = {',
            `const invoiceData = {
        idempotency_key: idempotencyKey || null,`
        );
        
        fs.writeFileSync(controllerPath, content);
        fixes.push('✅ Added idempotency key support');
        totalFixes++;
    }
}

// Fix 4: Add server-side game score validation
function addGameScoreValidation() {
    console.log('\n🎮 Adding server-side game score validation...');
    
    const gameControllerPath = path.join(__dirname, '..', 'server', 'controllers', 'gameController.js');
    
    // Check if file exists, if not we need to find where game scores are handled
    if (!fs.existsSync(gameControllerPath)) {
        // Search for game score handling
        const searchPaths = [
            path.join(__dirname, '..', 'server', 'routes', 'game.js'),
            path.join(__dirname, '..', 'server', 'controllers')
        ];
        
        console.log('   ℹ️  Game controller not found, searching for game score handling...');
        return;
    }
    
    // Add validation logic
    const validationCode = `
    // SECURITY: Server-side validation of game scores
    validateGameScore(score, duration, moves, metadata = {}) {
        const errors = [];
        
        // Basic sanity checks
        if (typeof score !== 'number' || score < 0 || score > 50) {
            errors.push('Invalid score range');
        }
        
        if (typeof duration !== 'number' || duration < 5 || duration > 300) {
            errors.push('Invalid game duration');
        }
        
        // Physics-based validation
        const maxPossibleScore = Math.floor(duration / 2); // Max 1 point per 2 seconds
        if (score > maxPossibleScore) {
            errors.push('Score impossible for duration');
        }
        
        // Pattern detection for cheating
        if (metadata.clickPattern) {
            const pattern = metadata.clickPattern;
            const avgInterval = pattern.reduce((a, b) => a + b, 0) / pattern.length;
            
            // Detect inhuman consistency (bot behavior)
            const variance = pattern.reduce((sum, interval) => 
                sum + Math.pow(interval - avgInterval, 2), 0) / pattern.length;
            
            if (variance < 10) { // Too consistent
                errors.push('Suspicious input pattern detected');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            tier: this.calculateTier(score)
        };
    }
`;
    
    fixes.push('⚠️  Game score validation needs manual implementation');
}

// Fix 5: Add request signing
function addRequestSigning() {
    console.log('\n✍️  Adding request signing middleware...');
    
    const middlewarePath = path.join(__dirname, '..', 'server', 'middleware', 'requestSigning.js');
    
    const signingMiddleware = `const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * Request Signing Middleware
 * Validates HMAC signatures on critical requests
 */
class RequestSigningMiddleware {
  constructor(secret) {
    this.secret = secret || process.env.REQUEST_SIGNING_SECRET;
    if (!this.secret && process.env.NODE_ENV === 'production') {
      throw new Error('REQUEST_SIGNING_SECRET is required in production');
    }
  }

  verify(req, res, next) {
    // Skip in development if no secret
    if (!this.secret) {
      return next();
    }

    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (!signature || !timestamp) {
      return res.status(401).json({
        success: false,
        error: 'Request signature required'
      });
    }
    
    // Check timestamp to prevent replay attacks (5 minute window)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    const timeDiff = Math.abs(now - requestTime);
    
    if (timeDiff > 300000) { // 5 minutes
      return res.status(401).json({
        success: false,
        error: 'Request timestamp expired'
      });
    }
    
    // Verify signature
    const payload = \`\${req.method}:\${req.originalUrl}:\${timestamp}:\${JSON.stringify(req.body)}\`;
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      logger.warn('Invalid request signature', {
        ip: req.ip,
        url: req.originalUrl
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid request signature'
      });
    }
    
    next();
  }
  
  // Helper to sign requests (for clients)
  sign(method, url, body = {}) {
    const timestamp = Date.now();
    const payload = \`\${method}:\${url}:\${timestamp}:\${JSON.stringify(body)}\`;
    
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
    
    return {
      'x-signature': signature,
      'x-timestamp': timestamp
    };
  }
}

module.exports = new RequestSigningMiddleware();
`;
    
    fs.writeFileSync(middlewarePath, signingMiddleware);
    fixes.push('✅ Added request signing middleware');
    totalFixes++;
}

// Fix 6: Add input sanitization utility
function addInputSanitization() {
    console.log('\n🧹 Adding comprehensive input sanitization...');
    
    const sanitizerPath = path.join(__dirname, '..', 'server', 'utils', 'sanitizer.js');
    
    const sanitizerCode = `const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

/**
 * Comprehensive Input Sanitization Utility
 */
class Sanitizer {
  /**
   * Sanitize string input
   */
  sanitizeString(input, options = {}) {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\\0/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Remove HTML if not allowed
    if (!options.allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
    }
    
    // Escape special characters if needed
    if (options.escape) {
      sanitized = validator.escape(sanitized);
    }
    
    // Limit length
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize email
   */
  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    
    const normalized = validator.normalizeEmail(email, {
      all_lowercase: true,
      gmail_remove_dots: false
    });
    
    return validator.isEmail(normalized) ? normalized : '';
  }
  
  /**
   * Sanitize Bitcoin address
   */
  sanitizeBitcoinAddress(address) {
    if (!address || typeof address !== 'string') return '';
    
    // Remove whitespace and non-alphanumeric chars
    const cleaned = address.replace(/[^a-zA-Z0-9]/g, '');
    
    // Basic Bitcoin address validation
    if (cleaned.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || 
        cleaned.match(/^bc1[a-z0-9]{39,59}$/)) {
      return cleaned;
    }
    
    return '';
  }
  
  /**
   * Sanitize RGB invoice
   */
  sanitizeRgbInvoice(invoice) {
    if (!invoice || typeof invoice !== 'string') return '';
    
    // Must start with rgb: and contain utxob:
    if (!invoice.startsWith('rgb:') || !invoice.includes('utxob:')) {
      return '';
    }
    
    // Remove any potential injection characters
    const sanitized = invoice
      .replace(/[<>'"]/g, '')
      .substring(0, 500); // Max length
    
    return sanitized;
  }
  
  /**
   * Sanitize numeric input
   */
  sanitizeNumber(input, options = {}) {
    const num = parseFloat(input);
    
    if (isNaN(num)) {
      return options.default || 0;
    }
    
    // Apply bounds
    let sanitized = num;
    if (options.min !== undefined) {
      sanitized = Math.max(sanitized, options.min);
    }
    if (options.max !== undefined) {
      sanitized = Math.min(sanitized, options.max);
    }
    
    // Round if integer required
    if (options.integer) {
      sanitized = Math.round(sanitized);
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize object/JSON input
   */
  sanitizeObject(obj, schema = {}) {
    if (!obj || typeof obj !== 'object') return {};
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Only allow whitelisted keys
      if (schema[key]) {
        const type = schema[key].type;
        
        switch (type) {
          case 'string':
            sanitized[key] = this.sanitizeString(value, schema[key].options);
            break;
          case 'number':
            sanitized[key] = this.sanitizeNumber(value, schema[key].options);
            break;
          case 'email':
            sanitized[key] = this.sanitizeEmail(value);
            break;
          case 'boolean':
            sanitized[key] = !!value;
            break;
          default:
            // Skip unknown types
        }
      }
    }
    
    return sanitized;
  }
}

module.exports = new Sanitizer();
`;
    
    // Create utils directory if it doesn't exist
    const utilsDir = path.dirname(sanitizerPath);
    if (!fs.existsSync(utilsDir)) {
        fs.mkdirSync(utilsDir, { recursive: true });
    }
    
    fs.writeFileSync(sanitizerPath, sanitizerCode);
    fixes.push('✅ Added comprehensive input sanitization');
    totalFixes++;
}

// Fix 7: Add security headers
function addSecurityHeaders() {
    console.log('\n🛡️  Adding security headers...');
    
    const appPath = path.join(__dirname, '..', 'server', 'app.js');
    let content = fs.readFileSync(appPath, 'utf8');
    const originalContent = content;
    
    // Check if helmet is already imported
    if (!content.includes('helmet')) {
        // Add helmet import
        const expressImport = "const express = require('express');";
        const helmetImport = "\nconst helmet = require('helmet');";
        
        content = content.replace(expressImport, expressImport + helmetImport);
        
        // Add helmet middleware
        const appUse = 'app.use(express.json());';
        const helmetConfig = `
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

`;
        
        content = content.replace(appUse, helmetConfig + appUse);
        
        fs.writeFileSync(appPath, content);
        fixes.push('✅ Added security headers with helmet');
        totalFixes++;
    }
}

// Run all fixes
console.log('🚀 Starting security fix implementation...\n');

fixJWTSecret();
addPaymentVerification();
addIdempotencySupport();
addGameScoreValidation();
addRequestSigning();
addInputSanitization();
addSecurityHeaders();

console.log('\n📊 Security Fix Summary:');
console.log('─'.repeat(50));
fixes.forEach(fix => console.log(fix));
console.log('─'.repeat(50));
console.log(`\n✅ Total fixes applied: ${totalFixes}`);

console.log('\n⚠️  Additional Manual Steps Required:');
console.log('1. Set JWT_SECRET environment variable in production');
console.log('2. Set REQUEST_SIGNING_SECRET environment variable');
console.log('3. Update database schema to add idempotency_key column');
console.log('4. Implement server-side game validation endpoint');
console.log('5. Run npm install to add new dependencies (helmet, validator, isomorphic-dompurify)');
console.log('6. Update client code to include request signatures for critical operations');
console.log('7. Test all payment flows with the new validation');

console.log('\n🔒 Security implementation complete!');