// DOM safety helpers to prevent null reference errors
(function() {
    'use strict';
    
    // Safe querySelector that never throws
    window.qs = function(rootOrSelector, selector) {
        if (selector === undefined) {
            try {
                return document.querySelector(rootOrSelector);
            } catch {
                return null;
            }
        }
        const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;
        if (!root) return null;
        try { 
            return root.querySelector(selector); 
        } catch { 
            return null; 
        }
    };
    
    // Safe querySelectorAll that returns empty array on error
    window.qsa = function(selector, root = document) {
        try {
            // Fix for pseudo-selectors like :contains() which aren't valid
            if (selector.includes(':contains(')) {
                console.warn('[DOM] :contains() is not a valid CSS selector, returning empty array');
                return [];
            }
            return Array.from(root.querySelectorAll(selector));
        } catch (e) {
            console.warn('[DOM] Invalid selector:', selector, e);
            return [];
        }
    };
    
    // Safe element removal
    window.safeRemove = function(node) {
        if (!node) return;
        const parent = node.parentNode;
        if (parent && parent.contains(node)) {
            try { 
                parent.removeChild(node); 
            } catch (e) {
                console.warn('[DOM] Failed to remove node:', e);
            }
        }
    };
    
    // Ensure child element exists
    window.ensureChild = function(parent, selector, factory) {
        if (!parent) return null;
        let child = parent.querySelector(selector);
        if (!child && factory) {
            child = factory();
            parent.appendChild(child);
        }
        return child;
    };
    
    // Safe style setting
    window.setStyle = function(element, styles) {
        if (!element || !element.style) return;
        try {
            Object.assign(element.style, styles);
        } catch (e) {
            console.warn('[DOM] Failed to set styles:', e);
        }
    };
    
    // Safe class operations
    window.safeClassOp = function(element, operation, className) {
        if (!element || !element.classList) return;
        try {
            element.classList[operation](className);
        } catch (e) {
            console.warn('[DOM] Failed class operation:', operation, className, e);
        }
    };
    
    console.log('✅ DOM safety helpers loaded');
})();