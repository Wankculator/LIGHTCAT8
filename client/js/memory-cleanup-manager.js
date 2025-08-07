/**
 * Memory Cleanup Manager for LIGHTCAT
 * Prevents memory leaks by tracking and cleaning up resources
 * Following CLAUDE.md memory management requirements
 */

(function(window) {
    'use strict';
    
    class MemoryCleanupManager {
        constructor() {
            this.listeners = new Map();
            this.timers = new Map();
            this.observers = new Map();
            this.animations = new Set();
            this.resources = new Map();
            
            // Auto cleanup on page unload
            window.addEventListener('beforeunload', () => this.cleanupAll());
        }
        
        // Track event listeners
        addEventListener(element, event, handler, options) {
            if (!element || !event || !handler) return;
            
            // Create unique key
            const key = `${element.id || 'elem'}_${event}_${handler.name || 'anonymous'}`;
            
            // Store for cleanup
            if (!this.listeners.has(element)) {
                this.listeners.set(element, new Map());
            }
            this.listeners.get(element).set(key, { event, handler, options });
            
            // Add the listener
            element.addEventListener(event, handler, options);
        }
        
        // Remove specific event listener
        removeEventListener(element, event, handler) {
            if (!element || !this.listeners.has(element)) return;
            
            const elementListeners = this.listeners.get(element);
            for (const [key, data] of elementListeners) {
                if (data.event === event && data.handler === handler) {
                    element.removeEventListener(event, handler, data.options);
                    elementListeners.delete(key);
                    break;
                }
            }
            
            // Clean up if no more listeners
            if (elementListeners.size === 0) {
                this.listeners.delete(element);
            }
        }
        
        // Remove all listeners for an element
        removeAllListeners(element) {
            if (!element || !this.listeners.has(element)) return;
            
            const elementListeners = this.listeners.get(element);
            for (const [key, data] of elementListeners) {
                element.removeEventListener(data.event, data.handler, data.options);
            }
            this.listeners.delete(element);
        }
        
        // Track timers
        setTimeout(callback, delay) {
            const id = window.setTimeout(() => {
                callback();
                this.timers.delete(id);
            }, delay);
            this.timers.set(id, { type: 'timeout', callback });
            return id;
        }
        
        setInterval(callback, delay) {
            const id = window.setInterval(callback, delay);
            this.timers.set(id, { type: 'interval', callback });
            return id;
        }
        
        clearTimeout(id) {
            window.clearTimeout(id);
            this.timers.delete(id);
        }
        
        clearInterval(id) {
            window.clearInterval(id);
            this.timers.delete(id);
        }
        
        // Track observers
        observeMutation(target, callback, options) {
            const observer = new MutationObserver(callback);
            observer.observe(target, options);
            this.observers.set(observer, { target, callback, options });
            return observer;
        }
        
        observeIntersection(targets, callback, options) {
            const observer = new IntersectionObserver(callback, options);
            const targetArray = Array.isArray(targets) ? targets : [targets];
            targetArray.forEach(target => observer.observe(target));
            this.observers.set(observer, { targets: targetArray, callback, options });
            return observer;
        }
        
        disconnectObserver(observer) {
            if (this.observers.has(observer)) {
                observer.disconnect();
                this.observers.delete(observer);
            }
        }
        
        // Track animations
        requestAnimationFrame(callback) {
            const id = window.requestAnimationFrame((timestamp) => {
                callback(timestamp);
                this.animations.delete(id);
            });
            this.animations.add(id);
            return id;
        }
        
        cancelAnimationFrame(id) {
            window.cancelAnimationFrame(id);
            this.animations.delete(id);
        }
        
        // Track generic resources
        addResource(key, resource, cleanup) {
            this.resources.set(key, { resource, cleanup });
        }
        
        removeResource(key) {
            const item = this.resources.get(key);
            if (item && item.cleanup) {
                item.cleanup(item.resource);
            }
            this.resources.delete(key);
        }
        
        // Clean up all tracked resources
        cleanupAll() {
            // Clean up event listeners
            for (const [element, listeners] of this.listeners) {
                for (const [key, data] of listeners) {
                    element.removeEventListener(data.event, data.handler, data.options);
                }
            }
            this.listeners.clear();
            
            // Clean up timers
            for (const [id, data] of this.timers) {
                if (data.type === 'timeout') {
                    window.clearTimeout(id);
                } else {
                    window.clearInterval(id);
                }
            }
            this.timers.clear();
            
            // Clean up observers
            for (const [observer] of this.observers) {
                observer.disconnect();
            }
            this.observers.clear();
            
            // Clean up animations
            for (const id of this.animations) {
                window.cancelAnimationFrame(id);
            }
            this.animations.clear();
            
            // Clean up custom resources
            for (const [key, item] of this.resources) {
                if (item.cleanup) {
                    item.cleanup(item.resource);
                }
            }
            this.resources.clear();
        }
    }
    
    // Create global instance
    window.memoryManager = new MemoryCleanupManager();
    
    // Wrap common game functions to use memory manager
    if (window.game || window.gameInstance) {
        const gameTarget = window.game || window.gameInstance;
        
        // Wrap addEventListener
        const originalAddEventListener = gameTarget.addEventListener;
        if (originalAddEventListener) {
            gameTarget.addEventListener = function(element, event, handler, options) {
                window.memoryManager.addEventListener(element, event, handler, options);
            };
        }
        
        // Wrap timer functions
        const originalSetTimeout = gameTarget.setTimeout;
        if (originalSetTimeout) {
            gameTarget.setTimeout = function(callback, delay) {
                return window.memoryManager.setTimeout(callback, delay);
            };
        }
        
        const originalSetInterval = gameTarget.setInterval;
        if (originalSetInterval) {
            gameTarget.setInterval = function(callback, delay) {
                return window.memoryManager.setInterval(callback, delay);
            };
        }
    }
    
    // Helper function to clean up game resources
    window.cleanupGameResources = function() {
        // Clean up Three.js resources
        if (window.scene) {
            window.scene.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        
        // Clean up WebGL context
        if (window.renderer) {
            window.renderer.dispose();
            window.renderer.forceContextLoss();
            window.renderer.context = null;
            window.renderer.domElement = null;
            window.renderer = null;
        }
        
        // Clean up all tracked resources
        window.memoryManager.cleanupAll();
    };
    
    console.log('[MemoryCleanupManager] Initialized - Tracking all resources for cleanup');
    
})(window);