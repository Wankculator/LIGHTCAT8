/**
 * Secure Random Number Generator
 * Replaces all Math.random() usage with cryptographically secure alternatives
 * CRITICAL: This must be loaded before any other scripts
 */

(function() {
    'use strict';

    // Check if we're in a browser environment with crypto API
    const hasCrypto = typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues;
    
    if (!hasCrypto) {
        console.error('Crypto API not available. Application requires secure random number generation.');
        return;
    }

    /**
     * Generate a secure random number between 0 and 1 (like Math.random())
     * @returns {number} Random number between 0 and 1
     */
    function secureRandom() {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        // Convert to 0-1 range by dividing by max uint32 value
        return array[0] / (0xFFFFFFFF + 1);
    }

    /**
     * Generate a secure random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer between min and max
     */
    function secureRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(secureRandom() * (max - min + 1)) + min;
    }

    /**
     * Generate a secure random float between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random float between min and max
     */
    function secureRandomFloat(min, max) {
        return secureRandom() * (max - min) + min;
    }

    /**
     * Choose a random element from an array securely
     * @param {Array} array - Array to choose from
     * @returns {*} Random element from array
     */
    function secureRandomChoice(array) {
        if (!array || array.length === 0) return undefined;
        return array[secureRandomInt(0, array.length - 1)];
    }

    /**
     * Shuffle an array securely (Fisher-Yates)
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    function secureRandomShuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = secureRandomInt(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Store original Math.random for debugging
    const originalMathRandom = Math.random;

    // Override Math.random with secure implementation
    Math.random = function() {
        // Log usage in development
        if (window.location.hostname === 'localhost') {
            console.debug('Math.random() called - using secure random');
        }
        return secureRandom();
    };

    // Add secure random utilities to global scope
    window.SecureRandom = {
        random: secureRandom,
        randomInt: secureRandomInt,
        randomFloat: secureRandomFloat,
        randomChoice: secureRandomChoice,
        randomShuffle: secureRandomShuffle,
        // Restore original Math.random if needed (for testing only)
        restoreOriginal: function() {
            Math.random = originalMathRandom;
        }
    };

    // For game-specific needs
    window.GameRandom = {
        /**
         * Generate position for game objects
         * @param {number} spread - Maximum spread from center
         * @returns {{x: number, y: number, z: number}} 3D position
         */
        position3D: function(spread = 50) {
            return {
                x: secureRandomFloat(-spread, spread),
                y: 0,
                z: secureRandomFloat(-spread, spread)
            };
        },

        /**
         * Generate position with height variation
         * @param {number} spread - Horizontal spread
         * @param {number} minHeight - Minimum height
         * @param {number} maxHeight - Maximum height
         * @returns {{x: number, y: number, z: number}} 3D position
         */
        positionWithHeight: function(spread = 50, minHeight = 0, maxHeight = 10) {
            return {
                x: secureRandomFloat(-spread, spread),
                y: secureRandomFloat(minHeight, maxHeight),
                z: secureRandomFloat(-spread, spread)
            };
        },

        /**
         * Generate random color component
         * @param {number} min - Minimum value (0-1)
         * @param {number} max - Maximum value (0-1)
         * @returns {number} Color component value
         */
        colorComponent: function(min = 0, max = 1) {
            return secureRandomFloat(min, max);
        },

        /**
         * Generate spawn delay for game objects
         * @param {number} minDelay - Minimum delay in ms
         * @param {number} maxDelay - Maximum delay in ms
         * @returns {number} Delay in milliseconds
         */
        spawnDelay: function(minDelay = 100, maxDelay = 1000) {
            return secureRandomInt(minDelay, maxDelay);
        }
    };

    // Freeze objects to prevent tampering
    Object.freeze(window.SecureRandom);
    Object.freeze(window.GameRandom);

    console.log('✅ Secure Random initialized - Math.random() is now cryptographically secure');

})();