/**
 * Memory-Safe Event Listener Manager
 * Prevents memory leaks by tracking and cleaning up all event listeners
 * LIGHTCAT Production Grade Implementation
 */

class MemorySafeEvents {
    constructor() {
        this.listeners = new WeakMap();
        this.globalListeners = new Map();
        this.activeElements = new WeakSet();
        
        // Auto-cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup(), { once: true });
    }

    /**
     * Add an event listener with automatic cleanup tracking
     * @param {EventTarget} target - DOM element or event target
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - addEventListener options
     * @returns {Function} Cleanup function
     */
    on(target, event, handler, options = {}) {
        // Ensure handler is not anonymous for removal
        const boundHandler = handler.bind(null);
        
        // Track listener for this element
        if (!this.listeners.has(target)) {
            this.listeners.set(target, new Map());
        }
        
        const elementListeners = this.listeners.get(target);
        if (!elementListeners.has(event)) {
            elementListeners.set(event, new Set());
        }
        
        elementListeners.get(event).add({
            handler: boundHandler,
            original: handler,
            options
        });
        
        // Track globally for cleanup
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const listenerId = `${Date.now()}_${array[0]}`;
        this.globalListeners.set(listenerId, {
            target,
            event,
            handler: boundHandler,
            options
        });
        
        // Add the actual listener
        target.addEventListener(event, boundHandler, options);
        this.activeElements.add(target);
        
        // Return cleanup function
        return () => this.off(target, event, handler);
    }

    /**
     * Remove an event listener
     * @param {EventTarget} target - DOM element or event target
     * @param {string} event - Event name
     * @param {Function} handler - Original event handler
     */
    off(target, event, handler) {
        if (!this.listeners.has(target)) return;
        
        const elementListeners = this.listeners.get(target);
        if (!elementListeners.has(event)) return;
        
        const eventListeners = elementListeners.get(event);
        
        // Find and remove the listener
        for (const listener of eventListeners) {
            if (listener.original === handler) {
                target.removeEventListener(event, listener.handler, listener.options);
                eventListeners.delete(listener);
                
                // Clean up empty maps
                if (eventListeners.size === 0) {
                    elementListeners.delete(event);
                }
                if (elementListeners.size === 0) {
                    this.listeners.delete(target);
                    this.activeElements.delete(target);
                }
                
                break;
            }
        }
        
        // Remove from global tracking
        for (const [id, listener] of this.globalListeners) {
            if (listener.target === target && listener.event === event && listener.handler === handler) {
                this.globalListeners.delete(id);
                break;
            }
        }
    }

    /**
     * Remove all listeners for a specific element
     * @param {EventTarget} target - DOM element or event target
     */
    removeAll(target) {
        if (!this.listeners.has(target)) return;
        
        const elementListeners = this.listeners.get(target);
        
        // Remove all listeners for this element
        for (const [event, listeners] of elementListeners) {
            for (const listener of listeners) {
                target.removeEventListener(event, listener.handler, listener.options);
            }
        }
        
        // Clean up maps
        this.listeners.delete(target);
        this.activeElements.delete(target);
        
        // Remove from global tracking
        const toRemove = [];
        for (const [id, listener] of this.globalListeners) {
            if (listener.target === target) {
                toRemove.push(id);
            }
        }
        toRemove.forEach(id => this.globalListeners.delete(id));
    }

    /**
     * Delegate event handling for dynamic elements
     * @param {EventTarget} container - Container element
     * @param {string} selector - CSS selector for target elements
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    delegate(container, selector, event, handler) {
        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && container.contains(target)) {
                handler.call(target, e);
            }
        };
        
        return this.on(container, event, delegatedHandler);
    }

    /**
     * Add one-time event listener
     * @param {EventTarget} target - DOM element or event target
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    once(target, event, handler) {
        const cleanup = this.on(target, event, function onceHandler(e) {
            cleanup();
            handler.call(this, e);
        });
        return cleanup;
    }

    /**
     * Clean up all tracked listeners
     */
    cleanup() {
        // Remove all global listeners
        for (const [id, listener] of this.globalListeners) {
            try {
                listener.target.removeEventListener(listener.event, listener.handler, listener.options);
            } catch (e) {
                // Element might be removed from DOM
            }
        }
        
        // Clear all maps
        this.listeners = new WeakMap();
        this.globalListeners.clear();
        this.activeElements = new WeakSet();
    }

    /**
     * Get statistics about tracked listeners
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            totalListeners: this.globalListeners.size,
            activeElements: this.activeElements.size
        };
    }
}

// Create global instance
window.SafeEvents = new MemorySafeEvents();

// Monkey-patch addEventListener to track all listeners automatically
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Call original
    originalAddEventListener.call(this, type, listener, options);
    
    // Track for cleanup if not already tracked
    if (window.SafeEvents && !window.DISABLE_EVENT_TRACKING) {
        window.SafeEvents.on(this, type, listener, options);
    }
};

EventTarget.prototype.removeEventListener = function(type, listener, options) {
    // Call original
    originalRemoveEventListener.call(this, type, listener, options);
    
    // Update tracking
    if (window.SafeEvents && !window.DISABLE_EVENT_TRACKING) {
        window.SafeEvents.off(this, type, listener);
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemorySafeEvents;
}