/**
 * Secure Random Utility for LIGHTCAT
 * Replaces all Math.random() with crypto-secure alternatives
 * Following CLAUDE.md security requirements
 */

(function(window) {
    'use strict';
    
    // Check if crypto is available
    const crypto = window.crypto || window.msCrypto;
    if (!crypto || !crypto.getRandomValues) {
        console.error('Crypto API not available. Falling back to Math.random() - NOT SECURE!');
        return;
    }
    
    // Secure random float between 0 and 1 (like Math.random())
    function secureRandom() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
    }
    
    // Secure random integer between min and max (inclusive)
    function secureRandomInt(min, max) {
        const range = max - min + 1;
        const array = new Uint32Array(1);
        let value;
        
        // Avoid modulo bias
        const maxAcceptable = Math.floor(0xffffffff / range) * range;
        
        do {
            crypto.getRandomValues(array);
            value = array[0];
        } while (value >= maxAcceptable);
        
        return min + (value % range);
    }
    
    // Secure random float between min and max
    function secureRandomFloat(min, max) {
        return min + secureRandom() * (max - min);
    }
    
    // Secure shuffle array (Fisher-Yates)
    function secureShuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = secureRandomInt(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // Secure random choice from array
    function secureRandomChoice(array) {
        if (!array || array.length === 0) return null;
        return array[secureRandomInt(0, array.length - 1)];
    }
    
    // Generate secure random ID
    function generateSecureId(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[secureRandomInt(0, chars.length - 1)];
        }
        return result;
    }
    
    // Override Math.random() globally (with warning)
    const originalMathRandom = Math.random;
    let warningShown = false;
    
    Math.random = function() {
        if (!warningShown) {
            console.warn('Math.random() called - using secure random instead. Update your code to use SecureRandom directly.');
            warningShown = true;
        }
        return secureRandom();
    };
    
    // Restore original Math.random if needed
    Math.random.restore = function() {
        Math.random = originalMathRandom;
    };
    
    // Export secure random utilities
    window.SecureRandom = {
        random: secureRandom,
        randomInt: secureRandomInt,
        randomFloat: secureRandomFloat,
        shuffleArray: secureShuffleArray,
        randomChoice: secureRandomChoice,
        generateId: generateSecureId,
        
        // Convenience methods matching Math API
        floor: function(value) {
            return Math.floor(value);
        },
        ceil: function(value) {
            return Math.ceil(value);
        },
        round: function(value) {
            return Math.round(value);
        }
    };
    
    // Replace common Math.random patterns in existing code
    if (window.gameConfig) {
        // Override game random functions
        const originalUpdate = window.gameConfig.update;
        if (originalUpdate) {
            window.gameConfig.update = function(...args) {
                // Temporarily restore Math.random for this scope
                const tempRandom = Math.random;
                Math.random = secureRandom;
                const result = originalUpdate.apply(this, args);
                Math.random = tempRandom;
                return result;
            };
        }
    }
    
    // Log replacement
    console.log('[SecureRandom] Initialized - Math.random() replaced with crypto-secure implementation');
    
})(window);