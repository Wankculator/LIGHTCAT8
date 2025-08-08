/**
 * Memory Leak Fix
 * Comprehensive solution for cleaning up event listeners and preventing memory leaks
 */

(function() {
    'use strict';

    // Track all event listeners for cleanup
    const eventListenerRegistry = new WeakMap();
    const globalListeners = new Set();

    // Store original addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    /**
     * Enhanced addEventListener that tracks listeners for cleanup
     */
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        // Call original
        originalAddEventListener.call(this, type, listener, options);

        // Track the listener
        if (!eventListenerRegistry.has(this)) {
            eventListenerRegistry.set(this, new Map());
        }
        
        const listenersMap = eventListenerRegistry.get(this);
        if (!listenersMap.has(type)) {
            listenersMap.set(type, new Set());
        }
        
        listenersMap.get(type).add({
            listener,
            options,
            element: this
        });

        // Track global listeners
        if (this === window || this === document || this === document.body) {
            globalListeners.add({
                element: this,
                type,
                listener,
                options
            });
        }
    };

    /**
     * Enhanced removeEventListener that updates tracking
     */
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
        // Call original
        originalRemoveEventListener.call(this, type, listener, options);

        // Remove from tracking
        const listenersMap = eventListenerRegistry.get(this);
        if (listenersMap && listenersMap.has(type)) {
            const listeners = listenersMap.get(type);
            listeners.forEach(item => {
                if (item.listener === listener) {
                    listeners.delete(item);
                }
            });
        }

        // Remove from global tracking
        globalListeners.forEach(item => {
            if (item.element === this && item.type === type && item.listener === listener) {
                globalListeners.delete(item);
            }
        });
    };

    /**
     * Clean up all listeners for an element
     */
    function cleanupElement(element) {
        const listenersMap = eventListenerRegistry.get(element);
        if (!listenersMap) return;

        listenersMap.forEach((listeners, type) => {
            listeners.forEach(({ listener, options }) => {
                originalRemoveEventListener.call(element, type, listener, options);
            });
        });

        eventListenerRegistry.delete(element);
    }

    /**
     * Clean up all global listeners
     */
    function cleanupGlobalListeners() {
        globalListeners.forEach(({ element, type, listener, options }) => {
            originalRemoveEventListener.call(element, type, listener, options);
        });
        globalListeners.clear();
    }

    /**
     * Auto-cleanup on page unload
     */
    window.addEventListener('beforeunload', () => {
        cleanupGlobalListeners();
    });

    /**
     * Memory Management Utilities
     */
    window.MemoryManager = {
        /**
         * Clean up all event listeners for an element and its children
         */
        cleanupElement: function(element) {
            if (!element) return;

            // Clean element itself
            cleanupElement(element);

            // Clean all children
            const children = element.querySelectorAll('*');
            children.forEach(child => cleanupElement(child));
        },

        /**
         * Clean up a component (removes element and cleans listeners)
         */
        cleanupComponent: function(element) {
            if (!element) return;

            this.cleanupElement(element);
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        },

        /**
         * Clean up intervals and timeouts
         */
        cleanupTimers: function(timers = []) {
            timers.forEach(timer => {
                if (typeof timer === 'number') {
                    clearTimeout(timer);
                    clearInterval(timer);
                }
            });
        },

        /**
         * Clean up a Three.js scene
         */
        cleanupThreeScene: function(scene, renderer) {
            if (!scene) return;

            // Traverse and dispose
            scene.traverse(object => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
                if (object.texture) {
                    object.texture.dispose();
                }
            });

            // Clear scene
            while (scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }

            // Dispose renderer
            if (renderer) {
                renderer.dispose();
                renderer.forceContextLoss();
                renderer.context = null;
                renderer.domElement = null;
            }
        },

        /**
         * Get memory usage statistics
         */
        getMemoryStats: function() {
            if (performance.memory) {
                return {
                    usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                    totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                    jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
                    eventListeners: globalListeners.size
                };
            }
            return {
                eventListeners: globalListeners.size
            };
        },

        /**
         * Force garbage collection (development only)
         */
        forceGC: function() {
            if (window.gc) {
                window.gc();
                console.log('Garbage collection triggered');
            } else {
                console.warn('Garbage collection not available. Run Chrome with --js-flags="--expose-gc"');
            }
        }
    };

    /**
     * Auto-cleanup for common leak sources
     */
    
    // Clean up abandoned DOM nodes periodically
    let cleanupInterval = setInterval(() => {
        // Find detached nodes with listeners
        const allElements = document.querySelectorAll('*');
        eventListenerRegistry.forEach((listeners, element) => {
            if (!document.body.contains(element) && element !== window && element !== document) {
                cleanupElement(element);
            }
        });
    }, 30000); // Every 30 seconds

    // Store interval for cleanup
    window.MemoryManager._cleanupInterval = cleanupInterval;

    // Clean up on page hide (mobile)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Reduce memory usage when page is hidden
            if (window.game && window.game.pause) {
                window.game.pause();
            }
        }
    });

    console.log('✅ Memory leak prevention initialized');
    
})();