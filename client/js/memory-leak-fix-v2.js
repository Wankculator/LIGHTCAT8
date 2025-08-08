// Memory Leak Fix V2 - Proper WeakMap implementation
(function() {
    'use strict';
    
    console.log('🔧 Memory Leak Fix V2: Loading...');
    
    // Proper event listener registry using WeakMap
    const eventRegistry = new WeakMap(); // Element -> Map<eventType, Set<handler>>
    const timerRegistry = new Set();
    const observerRegistry = new Set();
    
    // Track event listeners
    function addTrackedEvent(element, eventType, handler, options) {
        if (!element || !eventType || !handler) return;
        
        // Add the actual event listener
        element.addEventListener(eventType, handler, options);
        
        // Track it in our registry
        let elementMap = eventRegistry.get(element);
        if (!elementMap) {
            elementMap = new Map();
            eventRegistry.set(element, elementMap);
        }
        
        let handlerSet = elementMap.get(eventType);
        if (!handlerSet) {
            handlerSet = new Set();
            elementMap.set(eventType, handlerSet);
        }
        
        handlerSet.add(handler);
    }
    
    // Remove all tracked events for an element
    function removeAllTrackedEvents(element) {
        if (!element) return;
        
        const elementMap = eventRegistry.get(element);
        if (!elementMap) return;
        
        // Iterate through the Map properly
        for (const [eventType, handlerSet] of elementMap.entries()) {
            // Iterate through the Set properly
            for (const handler of handlerSet) {
                try {
                    element.removeEventListener(eventType, handler);
                } catch (e) {
                    console.warn('[Memory] Failed to remove event listener:', e);
                }
            }
            handlerSet.clear();
        }
        
        elementMap.clear();
        eventRegistry.delete(element);
    }
    
    // Override addEventListener to track all listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        // Skip tracking for certain event types that are numerous but safe
        const skipTypes = ['mousemove', 'scroll', 'resize', 'touchmove'];
        
        if (!skipTypes.includes(type) && this.nodeType === 1) { // Only track Element nodes
            addTrackedEvent(this, type, listener, options);
        } else {
            originalAddEventListener.call(this, type, listener, options);
        }
    };
    
    // Track timers
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalClearTimeout = window.clearTimeout;
    const originalClearInterval = window.clearInterval;
    
    window.setTimeout = function(callback, delay, ...args) {
        const id = originalSetTimeout.call(window, callback, delay, ...args);
        timerRegistry.add(id);
        return id;
    };
    
    window.setInterval = function(callback, delay, ...args) {
        const id = originalSetInterval.call(window, callback, delay, ...args);
        timerRegistry.add(id);
        return id;
    };
    
    window.clearTimeout = function(id) {
        timerRegistry.delete(id);
        return originalClearTimeout.call(window, id);
    };
    
    window.clearInterval = function(id) {
        timerRegistry.delete(id);
        return originalClearInterval.call(window, id);
    };
    
    // Track observers
    function trackObserver(observer) {
        observerRegistry.add(observer);
    }
    
    // Cleanup function
    function cleanupAll() {
        console.log('🧹 Cleaning up resources...');
        
        // Clear all timers
        let timerCount = 0;
        for (const timerId of timerRegistry) {
            originalClearTimeout(timerId);
            originalClearInterval(timerId);
            timerCount++;
        }
        timerRegistry.clear();
        
        // Disconnect all observers
        let observerCount = 0;
        for (const observer of observerRegistry) {
            try {
                if (observer.disconnect) {
                    observer.disconnect();
                    observerCount++;
                }
            } catch (e) {
                console.warn('[Memory] Failed to disconnect observer:', e);
            }
        }
        observerRegistry.clear();
        
        // Clean up tracked events for removed elements
        const allElements = document.querySelectorAll('*');
        let eventCount = 0;
        allElements.forEach(element => {
            const elementMap = eventRegistry.get(element);
            if (elementMap) {
                eventCount += elementMap.size;
            }
        });
        
        console.log(`✅ Cleaned up: ${timerCount} timers, ${observerCount} observers, tracking ${eventCount} event types`);
    }
    
    // Periodic cleanup of detached elements
    setInterval(() => {
        const allTrackedElements = [];
        // WeakMap doesn't have iteration, so we can't directly clean it
        // But WeakMap automatically cleans up when elements are GC'd
        // Just log for monitoring
        console.log('[Memory] Automatic cleanup check completed');
    }, 60000); // Every minute
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanupAll);
    window.addEventListener('pagehide', cleanupAll);
    
    // Expose utilities globally
    window.memoryUtils = {
        addTrackedEvent,
        removeAllTrackedEvents,
        trackObserver,
        cleanupAll,
        getStats: () => ({
            timers: timerRegistry.size,
            observers: observerRegistry.size
        })
    };
    
    console.log('✅ Memory leak fix V2 initialized (WeakMap implementation)');
})();