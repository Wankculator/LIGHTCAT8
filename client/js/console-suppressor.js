// This file requires memory-safe-events.js to be loaded first
/**
 * Console Suppressor for Mobile Production
 * Prevents console errors from appearing in mobile browsers
 */

(function() {
    'use strict';
    
    // Only suppress on mobile in production
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isProduction = window.location.hostname === 'rgblightcat.com' || 
                        window.location.hostname === 'www.rgblightcat.com';
    
    if (isMobile && isProduction) {
        // Store original methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        // Suppress all console output
        console.log = function() {};
        console.error = function() {};
        console.warn = function() {};
        console.debug = function() {};
        console.info = function() {};
        
        // Prevent error dialogs
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            // Silently handle errors
            return true; // Prevents default error handling
        };
        
        // Handle unhandled promise rejections
        window.SafeEvents.on(window, 'unhandledrejection', function(event) {
            event.preventDefault();
        });
    }
})();