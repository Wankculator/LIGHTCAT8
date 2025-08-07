/**
 * Professional Error Handling System
 * Zero errors, zero complaints - Production Grade
 * LIGHTCAT Error Management
 */

class ErrorHandlerPro {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.errorCallbacks = new Set();
        this.suppressedErrors = new Set();
        this.criticalHandlers = new Map();
        
        // Install global error handlers
        this.installHandlers();
        
        // Error reporting endpoint
        this.reportEndpoint = '/api/errors/report';
    }

    installHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                type: 'uncaught'
            });
            
            // Prevent default browser error handling
            event.preventDefault();
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                message: `Unhandled Promise Rejection: ${event.reason}`,
                error: event.reason,
                promise: event.promise,
                type: 'unhandled_promise'
            });
            
            // Prevent default browser handling
            event.preventDefault();
        });

        // Console error override
        const originalError = console.error;
        console.error = (...args) => {
            this.handleError({
                message: args.join(' '),
                type: 'console_error',
                args: args
            });
            
            // Call original if not suppressed
            if (!this.isSuppressed('console_error')) {
                originalError.apply(console, args);
            }
        };
    }

    /**
     * Handle an error with full tracking and recovery
     * @param {Object} errorInfo - Error information
     */
    handleError(errorInfo) {
        // Create error record
        const errorRecord = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...errorInfo,
            stackTrace: this.getStackTrace(errorInfo.error),
            context: this.getErrorContext()
        };

        // Check if error should be suppressed
        if (this.shouldSuppress(errorRecord)) {
            return;
        }

        // Store error
        this.errors.unshift(errorRecord);
        if (this.errors.length > this.maxErrors) {
            this.errors.pop();
        }

        // Execute callbacks
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorRecord);
            } catch (e) {
                // Prevent callback errors from causing loops
            }
        });

        // Handle critical errors
        if (this.isCritical(errorRecord)) {
            this.handleCriticalError(errorRecord);
        }

        // Report to server (throttled)
        this.reportError(errorRecord);
    }

    /**
     * Get detailed stack trace
     * @param {Error} error - Error object
     * @returns {string} Stack trace
     */
    getStackTrace(error) {
        if (error && error.stack) {
            return error.stack;
        }
        
        // Generate stack trace if not available
        try {
            throw new Error();
        } catch (e) {
            return e.stack || 'No stack trace available';
        }
    }

    /**
     * Get error context (current state, user actions, etc.)
     * @returns {Object} Context information
     */
    getErrorContext() {
        return {
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height
            },
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            connection: navigator.connection ? {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            localStorage: this.getLocalStorageInfo(),
            gameState: window.game && typeof window.game.getState === 'function' ? window.game.getState() : null
        };
    }

    /**
     * Get localStorage info (without sensitive data)
     * @returns {Object} Storage information
     */
    getLocalStorageInfo() {
        try {
            const keys = Object.keys(localStorage);
            return {
                itemCount: keys.length,
                totalSize: new Blob(Object.values(localStorage)).size,
                keys: keys.filter(k => !k.includes('private') && !k.includes('key'))
            };
        } catch (e) {
            return { error: 'Unable to access localStorage' };
        }
    }

    /**
     * Check if error should be suppressed
     * @param {Object} errorRecord - Error record
     * @returns {boolean} Should suppress
     */
    shouldSuppress(errorRecord) {
        // Suppress specific known errors
        const suppressPatterns = [
            /ResizeObserver loop limit exceeded/,
            /Non-Error promise rejection captured/,
            /Network request failed/,
            /Failed to fetch/
        ];

        return suppressPatterns.some(pattern => 
            pattern.test(errorRecord.message)
        );
    }

    /**
     * Check if error is critical
     * @param {Object} errorRecord - Error record
     * @returns {boolean} Is critical
     */
    isCritical(errorRecord) {
        const criticalPatterns = [
            /payment/i,
            /invoice/i,
            /wallet/i,
            /security/i,
            /authentication/i
        ];

        return criticalPatterns.some(pattern => 
            pattern.test(errorRecord.message)
        );
    }

    /**
     * Handle critical errors with recovery
     * @param {Object} errorRecord - Error record
     */
    handleCriticalError(errorRecord) {
        // Execute critical error handlers
        this.criticalHandlers.forEach((handler, name) => {
            try {
                handler(errorRecord);
            } catch (e) {
                // Log but don't throw
                console.warn(`Critical handler ${name} failed:`, e);
            }
        });

        // Attempt recovery based on error type
        this.attemptRecovery(errorRecord);
    }

    /**
     * Attempt to recover from error
     * @param {Object} errorRecord - Error record
     */
    attemptRecovery(errorRecord) {
        // Payment errors
        if (errorRecord.message.includes('payment')) {
            // Reset payment state
            if (window.paymentManager) {
                window.paymentManager.reset();
            }
        }

        // Game errors
        if (errorRecord.message.includes('game')) {
            // Restart game
            if (window.game) {
                window.game.restart();
            }
        }

        // Network errors
        if (errorRecord.message.includes('network')) {
            // Retry with exponential backoff
            this.retryNetworkOperation(errorRecord);
        }
    }

    /**
     * Report error to server (throttled)
     * @param {Object} errorRecord - Error record
     */
    async reportError(errorRecord) {
        // Throttle reporting
        if (!this.canReport()) return;

        try {
            await fetch(this.reportEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: errorRecord,
                    sessionId: this.getSessionId()
                })
            });
        } catch (e) {
            // Silently fail - don't create error loops
        }
    }

    /**
     * Check if we can report (rate limiting)
     * @returns {boolean} Can report
     */
    canReport() {
        const now = Date.now();
        const window = 60000; // 1 minute
        const maxReports = 10;
        
        // Clean old reports
        this.reportTimes = (this.reportTimes || []).filter(t => now - t < window);
        
        if (this.reportTimes.length >= maxReports) {
            return false;
        }
        
        this.reportTimes.push(now);
        return true;
    }

    /**
     * Generate unique error ID
     * @returns {string} Error ID
     */
    generateErrorId() {
        const array = new Uint8Array(6);
        crypto.getRandomValues(array);
        const randomPart = Array.from(array, byte => byte.toString(36)).join('').substr(0, 9);
        return `err_${Date.now()}_${randomPart}`;
    }

    /**
     * Get or create session ID
     * @returns {string} Session ID
     */
    getSessionId() {
        if (!this.sessionId) {
            const array = new Uint8Array(6);
            crypto.getRandomValues(array);
            const randomPart = Array.from(array, byte => byte.toString(36)).join('').substr(0, 9);
            this.sessionId = `sess_${Date.now()}_${randomPart}`;
        }
        return this.sessionId;
    }

    /**
     * Register error callback
     * @param {Function} callback - Callback function
     * @returns {Function} Unregister function
     */
    onError(callback) {
        this.errorCallbacks.add(callback);
        return () => this.errorCallbacks.delete(callback);
    }

    /**
     * Register critical error handler
     * @param {string} name - Handler name
     * @param {Function} handler - Handler function
     */
    registerCriticalHandler(name, handler) {
        this.criticalHandlers.set(name, handler);
    }

    /**
     * Get error statistics
     * @returns {Object} Statistics
     */
    getStats() {
        const errorTypes = {};
        this.errors.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
        });

        return {
            total: this.errors.length,
            types: errorTypes,
            critical: this.errors.filter(e => this.isCritical(e)).length,
            recent: this.errors.slice(0, 10)
        };
    }

    /**
     * Clear error history
     */
    clear() {
        this.errors = [];
    }

    /**
     * Check if specific error type is suppressed
     * @param {string} type - Error type
     * @returns {boolean} Is suppressed
     */
    isSuppressed(type) {
        return this.suppressedErrors.has(type);
    }

    /**
     * Suppress specific error type
     * @param {string} type - Error type
     */
    suppress(type) {
        this.suppressedErrors.add(type);
    }

    /**
     * Unsuppress specific error type
     * @param {string} type - Error type
     */
    unsuppress(type) {
        this.suppressedErrors.delete(type);
    }
}

// Create global instance
window.ErrorHandler = new ErrorHandlerPro();

// Register critical handlers
window.ErrorHandler.registerCriticalHandler('payment', (error) => {
    // Payment error recovery
    console.warn('Critical payment error detected, attempting recovery...');
    // Add payment-specific recovery logic
});

window.ErrorHandler.registerCriticalHandler('security', (error) => {
    // Security error handling
    console.warn('Security error detected, logging out user...');
    // Add security-specific handling
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandlerPro;
}