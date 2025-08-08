/**
 * Emergency Fix for Memory Safe Events Infinite Loop
 * Disables the problematic monkey-patching that causes recursion
 */
(function() {
    'use strict';
    
    console.log('[Memory Safe Events Fix] Preventing infinite recursion...');
    
    // Set flag to disable automatic event tracking BEFORE memory-safe-events.js loads
    window.DISABLE_EVENT_TRACKING = true;
    
    // Store original methods before they get patched
    window._originalAddEventListener = EventTarget.prototype.addEventListener;
    window._originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    
    // If memory-safe-events.js already loaded and broke things, restore originals
    if (window.SafeEvents) {
        console.log('[Memory Safe Events Fix] Restoring original event methods...');
        EventTarget.prototype.addEventListener = window._originalAddEventListener;
        EventTarget.prototype.removeEventListener = window._originalRemoveEventListener;
    }
    
    // Prevent any future patching attempts
    Object.defineProperty(EventTarget.prototype, 'addEventListener', {
        value: window._originalAddEventListener,
        writable: false,
        configurable: false
    });
    
    Object.defineProperty(EventTarget.prototype, 'removeEventListener', {
        value: window._originalRemoveEventListener,
        writable: false,
        configurable: false
    });
    
    console.log('[Memory Safe Events Fix] Protection applied successfully');
})();