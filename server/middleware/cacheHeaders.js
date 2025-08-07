/**
 * Cache Headers Middleware
 * Implements proper caching strategy for optimal performance
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cache durations
const CACHE_DURATIONS = {
    // Static assets - 1 year
    images: 365 * 24 * 60 * 60,     // 1 year
    fonts: 365 * 24 * 60 * 60,      // 1 year
    
    // CSS/JS - 30 days with revalidation
    styles: 30 * 24 * 60 * 60,      // 30 days
    scripts: 30 * 24 * 60 * 60,     // 30 days
    
    // HTML - no cache
    html: 0,
    
    // API responses - varies
    api: {
        stats: 60,                   // 1 minute
        health: 0,                   // No cache
        invoice: 0,                  // No cache
        consignment: 300            // 5 minutes
    }
};

/**
 * Generate ETag for content
 */
function generateETag(content) {
    return crypto
        .createHash('md5')
        .update(content)
        .digest('hex')
        .substring(0, 16);
}

/**
 * Set cache headers based on file type
 */
function setCacheHeaders(res, fileType, options = {}) {
    const duration = options.duration || CACHE_DURATIONS[fileType] || 0;
    
    if (duration > 0) {
        // Cache-Control
        const directives = [
            'public',
            `max-age=${duration}`,
            options.immutable ? 'immutable' : null,
            options.mustRevalidate ? 'must-revalidate' : null
        ].filter(Boolean).join(', ');
        
        res.setHeader('Cache-Control', directives);
        
        // Expires (for older browsers)
        const expires = new Date(Date.now() + duration * 1000);
        res.setHeader('Expires', expires.toUTCString());
    } else {
        // No cache
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    // Additional headers
    if (options.etag) {
        res.setHeader('ETag', options.etag);
    }
    
    if (options.lastModified) {
        res.setHeader('Last-Modified', options.lastModified);
    }
}

/**
 * Middleware for static assets
 */
function staticAssetsCaching(req, res, next) {
    const ext = path.extname(req.path).toLowerCase();
    
    // Determine file type
    let fileType;
    let options = {};
    
    switch (ext) {
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.svg':
        case '.ico':
            fileType = 'images';
            options.immutable = true;
            break;
            
        case '.woff':
        case '.woff2':
        case '.ttf':
        case '.otf':
        case '.eot':
            fileType = 'fonts';
            options.immutable = true;
            break;
            
        case '.css':
            fileType = 'styles';
            options.mustRevalidate = true;
            break;
            
        case '.js':
            fileType = 'scripts';
            options.mustRevalidate = true;
            break;
            
        case '.html':
            fileType = 'html';
            break;
            
        default:
            return next();
    }
    
    // Set appropriate headers
    setCacheHeaders(res, fileType, options);
    
    // Continue to next middleware
    next();
}

/**
 * Middleware for API responses
 */
function apiCaching(endpoint) {
    return (req, res, next) => {
        const duration = CACHE_DURATIONS.api[endpoint] || 0;
        
        setCacheHeaders(res, 'api', { duration });
        
        // Add API-specific headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        
        next();
    };
}

/**
 * Performance optimization headers
 */
function performanceHeaders(req, res, next) {
    // Preload critical resources
    if (req.path === '/' || req.path === '/index.html') {
        res.setHeader('Link', [
            '</js/secure-random-fixed.js>; rel=preload; as=script',
            '</js/memory-leak-fix.js>; rel=preload; as=script',
            '</css/perfect-10-improvements.css>; rel=preload; as=style',
            '</images/RGB_LITE_CAT_LOGO.jpg>; rel=preload; as=image'
        ].join(', '));
    }
    
    // DNS prefetch for external resources
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    
    next();
// Define at module level
const PRELOAD_RESOURCES = [
    { path: '/js/secure-random-fixed.js', as: 'script' },
    { path: '/js/memory-leak-fix.js', as: 'script' },
    { path: '/css/perfect-10-improvements.css', as: 'style' },
    { path: '/images/RGB_LITE_CAT_LOGO.jpg', as: 'image' }
];

function performanceHeaders(req, res, next) {
    // Preload critical resources
    if (req.path === '/' || req.path === '/index.html') {
        const links = PRELOAD_RESOURCES
            .map(r => `<${r.path}>; rel=preload; as=${r.as}`)
            .join(', ');
        res.setHeader('Link', links);
    }

    // ... rest of middleware logic ...
}
    if (req.path === '/sw.js') {
        // Service worker should always be fresh
        setCacheHeaders(res, 'api', { duration: 0 });
    }
    next();
}

module.exports = {
    staticAssetsCaching,
    apiCaching,
    performanceHeaders,
    serviceWorkerCache,
    setCacheHeaders,
    generateETag
};