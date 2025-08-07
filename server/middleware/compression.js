/**
 * Compression Middleware Configuration
 * Properly handles response compression using the standard compression library
 */

const compression = require('compression');

/**
 * Compression filter for text-based content types
 */
function shouldCompress(req, res) {
    // Check if response should be compressed
    if (req.headers['x-no-compression']) {
        return false;
    }
    
    // Get content type
    const contentType = res.getHeader('content-type') || '';
    
    // Compress text-based content types
    const compressibleTypes = [
        'text/',
        'application/javascript',
        'application/json',
        'application/xml',
        'application/rss+xml',
        'application/atom+xml',
        'image/svg+xml'
    ];
    
    return compressibleTypes.some(type => contentType.includes(type));
}

/**
 * Compression configuration
 */
const compressionConfig = {
    // Compression level (1-9, 6 is default)
    level: 6,
    
    // Minimum response size to compress (bytes)
    threshold: 1024,
    
    // Custom filter function
    filter: shouldCompress,
    
    // Memory level (1-9, 8 is default)
    memLevel: 8,
    
    // Window size (9-15, 15 is default)
    windowBits: 15,
    
    // Chunk size for streaming
    chunkSize: 16 * 1024
};

/**
 * Create configured compression middleware
 */
function createCompressionMiddleware() {
    return compression(compressionConfig);
}

/**
 * Compression middleware with file extension filtering
 */
function fileExtensionCompressionFilter(req, res, next) {
    // Check if request path matches compressible file extensions
    const compressibleExtensions = /\.(js|css|html|json|svg|xml|txt)$/i;
    
    if (compressibleExtensions.test(req.path)) {
        // Allow compression for these file types
        return next();
    }
    
    // Skip compression for binary files
    if (req.path.match(/\.(jpg|jpeg|png|gif|ico|woff|woff2|ttf|otf|eot|pdf|zip|gz)$/i)) {
        req.headers['x-no-compression'] = true;
    }
    
    next();
}

module.exports = {
    createCompressionMiddleware,
    fileExtensionCompressionFilter,
    compressionConfig,
    shouldCompress
};
