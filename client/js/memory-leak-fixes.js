/**
 * Memory Leak Fixes for LIGHTCAT Platform
 * Prevents memory leaks in polling, intervals, and event listeners
 */

(function() {
    'use strict';

    // Track all active intervals and timeouts
    const activeIntervals = new Map();
    const activeTimeouts = new Map();
    const activeListeners = new Map();
    
    // Store original functions
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    const originalClearInterval = window.clearInterval;
    const originalClearTimeout = window.clearTimeout;
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    /**
     * Enhanced setInterval that tracks intervals
     */
    window.setInterval = function(callback, delay, ...args) {
        const id = originalSetInterval.call(window, callback, delay, ...args);
        const stackTrace = new Error().stack;
        
        activeIntervals.set(id, {
            callback: callback.toString().substring(0, 100),
            delay: delay,
            createdAt: new Date(),
            stackTrace: stackTrace
        });
        
        return id;
    };

    /**
     * Enhanced clearInterval that removes tracking
     */
    window.clearInterval = function(id) {
        if (id) {
            activeIntervals.delete(id);
            originalClearInterval.call(window, id);
        }
    };

    /**
     * Enhanced setTimeout that tracks timeouts
     */
    window.setTimeout = function(callback, delay, ...args) {
        const wrappedCallback = function() {
            activeTimeouts.delete(id);
            callback.apply(this, args);
        };
        
        const id = originalSetTimeout.call(window, wrappedCallback, delay);
        
        activeTimeouts.set(id, {
            callback: callback.toString().substring(0, 100),
            delay: delay,
            createdAt: new Date()
        });
        
        return id;
    };

    /**
     * Enhanced clearTimeout that removes tracking
     */
    window.clearTimeout = function(id) {
        if (id) {
            activeTimeouts.delete(id);
            originalClearTimeout.call(window, id);
        }
    };

    /**
     * Track event listeners
     */
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        const key = `${this.constructor.name}_${type}`;
        
        if (!activeListeners.has(key)) {
            activeListeners.set(key, new Set());
        }
        
        activeListeners.get(key).add(listener);
        
        return originalAddEventListener.call(this, type, listener, options);
    };

    /**
     * Remove tracked event listeners
     */
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
        const key = `${this.constructor.name}_${type}`;
        
        if (activeListeners.has(key)) {
            activeListeners.get(key).delete(listener);
        }
        
        return originalRemoveEventListener.call(this, type, listener, options);
    };

    /**
     * Clean up all intervals and timeouts when page unloads
     */
    window.addEventListener('beforeunload', function() {
        // Clear all intervals
        activeIntervals.forEach((info, id) => {
            clearInterval(id);
        });
        
        // Clear all timeouts
        activeTimeouts.forEach((info, id) => {
            clearTimeout(id);
        });
        
        console.log('Cleaned up', activeIntervals.size, 'intervals and', activeTimeouts.size, 'timeouts');
    });

    /**
     * Fix payment status polling memory leak
     */
    function fixPaymentPolling() {
        // Store reference to polling interval
        let paymentPollInterval = null;
        
        // Override the polling function
        const originalPollStatus = window.pollPaymentStatus;
        if (originalPollStatus) {
            window.pollPaymentStatus = function(invoiceId, callback) {
                // Clear any existing interval
                if (paymentPollInterval) {
                    clearInterval(paymentPollInterval);
                }
                
                // Set new interval
                paymentPollInterval = setInterval(async () => {
                    try {
                        const response = await fetch(`/api/rgb/invoice/${invoiceId}/status`);
                        const data = await response.json();
                        
                        if (callback) {
                            callback(data);
                        }
                        
                        // Stop polling if payment complete or expired
                        if (data.status === 'paid' || data.status === 'delivered' || data.status === 'expired') {
                            clearInterval(paymentPollInterval);
                            paymentPollInterval = null;
                        }
                    } catch (error) {
                        console.error('Polling error:', error);
                    }
                }, 3000);
                
                // Auto-stop after 15 minutes (invoice expiry)
                setTimeout(() => {
                    if (paymentPollInterval) {
                        clearInterval(paymentPollInterval);
                        paymentPollInterval = null;
                    }
                }, 15 * 60 * 1000);
                
                return paymentPollInterval;
            };
        }
        
        // Clean up on modal close
        const observeModalClose = () => {
            const modals = document.querySelectorAll('.modal, .payment-modal, [id*="Modal"]');
            
            modals.forEach(modal => {
                // Use MutationObserver to detect when modal is hidden
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            const display = window.getComputedStyle(modal).display;
                            if (display === 'none' && paymentPollInterval) {
                                clearInterval(paymentPollInterval);
                                paymentPollInterval = null;
                                console.log('Cleared payment polling on modal close');
                            }
                        }
                    });
                });
                
                observer.observe(modal, { attributes: true });
            });
        };
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeModalClose);
        } else {
            observeModalClose();
        }
    }

    /**
     * Fix WebSocket connection leaks
     */
    function fixWebSocketLeaks() {
        const activeWebSockets = new Set();
        
        // Override WebSocket constructor
        const OriginalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = new OriginalWebSocket(url, protocols);
            activeWebSockets.add(ws);
            
            // Remove from set when closed
            ws.addEventListener('close', () => {
                activeWebSockets.delete(ws);
            });
            
            return ws;
        };
        
        // Inherit prototype
        window.WebSocket.prototype = OriginalWebSocket.prototype;
        
        // Close all websockets on page unload
        window.addEventListener('beforeunload', () => {
            activeWebSockets.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
        });
    }

    /**
     * Fix Three.js memory leaks
     */
    function fixThreeJSLeaks() {
        if (window.THREE) {
            // Store original dispose methods
            const originalDispose = {
                geometry: THREE.BufferGeometry.prototype.dispose,
                material: THREE.Material.prototype.dispose,
                texture: THREE.Texture.prototype.dispose
            };
            
            // Track all Three.js resources
            const resources = {
                geometries: new Set(),
                materials: new Set(),
                textures: new Set()
            };
            
            // Override constructors to track resources
            const originalBufferGeometry = THREE.BufferGeometry;
            THREE.BufferGeometry = function(...args) {
                const geometry = new originalBufferGeometry(...args);
                resources.geometries.add(geometry);
                return geometry;
            };
            
            // Clean up on page unload
            window.addEventListener('beforeunload', () => {
                resources.geometries.forEach(g => g.dispose && g.dispose());
                resources.materials.forEach(m => m.dispose && m.dispose());
                resources.textures.forEach(t => t.dispose && t.dispose());
            });
        }
    }

    /**
     * Memory usage monitor
     */
    function monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const used = performance.memory.usedJSHeapSize;
                const limit = performance.memory.jsHeapSizeLimit;
                const percentage = (used / limit) * 100;
                
                if (percentage > 80) {
                    console.warn(`High memory usage: ${percentage.toFixed(2)}%`);
                    
                    // Log active resources
                    console.log('Active intervals:', activeIntervals.size);
                    console.log('Active timeouts:', activeTimeouts.size);
                    console.log('Active listeners:', activeListeners.size);
                    
                    // Trigger garbage collection if available
                    if (window.gc) {
                        window.gc();
                    }
                }
            }, 30000); // Check every 30 seconds
        }
    }

    /**
     * Clean up abandoned resources
     */
    function cleanupAbandonedResources() {
        setInterval(() => {
            const now = new Date();
            
            // Clean up old intervals (> 1 hour)
            activeIntervals.forEach((info, id) => {
                const age = now - info.createdAt;
                if (age > 3600000) { // 1 hour
                    console.warn('Cleaning up old interval:', info.callback);
                    clearInterval(id);
                }
            });
            
            // Clean up old timeouts (> 2 hours)
            activeTimeouts.forEach((info, id) => {
                const age = now - info.createdAt;
                if (age > 7200000) { // 2 hours
                    console.warn('Cleaning up old timeout:', info.callback);
                    clearTimeout(id);
                }
            });
        }, 300000); // Run every 5 minutes
    }

    /**
     * Public API for debugging
     */
    window.memoryLeakDebug = {
        getActiveIntervals: () => activeIntervals,
        getActiveTimeouts: () => activeTimeouts,
        getActiveListeners: () => activeListeners,
        clearAll: () => {
            activeIntervals.forEach((info, id) => clearInterval(id));
            activeTimeouts.forEach((info, id) => clearTimeout(id));
            console.log('Cleared all intervals and timeouts');
        },
        report: () => {
            console.log('=== Memory Leak Report ===');
            console.log('Active intervals:', activeIntervals.size);
            console.log('Active timeouts:', activeTimeouts.size);
            console.log('Active listeners:', activeListeners.size);
            
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1048576;
                const limit = performance.memory.jsHeapSizeLimit / 1048576;
                console.log(`Memory: ${used.toFixed(2)} MB / ${limit.toFixed(2)} MB`);
            }
            
            return {
                intervals: activeIntervals.size,
                timeouts: activeTimeouts.size,
                listeners: activeListeners.size
            };
        }
    };

    // Initialize all fixes
    fixPaymentPolling();
    fixWebSocketLeaks();
    fixThreeJSLeaks();
    monitorMemoryUsage();
    cleanupAbandonedResources();
    
    console.log('✅ Memory leak fixes initialized');
})();