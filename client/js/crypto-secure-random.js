/**
 * Cryptographically Secure Random Number Generator
 * Replaces all Math.random() usage for security
 * LIGHTCAT Production Grade Implementation
 */

class CryptoSecureRandom {
    constructor() {
        this.crypto = window.crypto || window.msCrypto;
        if (!this.crypto) {
            throw new Error('Web Crypto API not available. This browser is not supported.');
        }
    }

    /**
     * Generate a secure random number between 0 and 1 (like Math.random())
     * @returns {number} Random number between 0 and 1
     */
    random() {
        const array = new Uint32Array(1);
        this.crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
    }

    /**
     * Generate a secure random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomInt(min, max) {
        const range = max - min + 1;
        const bytesNeeded = Math.ceil(Math.log2(range) / 8);
        const maxValue = Math.pow(256, bytesNeeded) - 1;
        const array = new Uint8Array(bytesNeeded);
        
        let value;
        do {
            this.crypto.getRandomValues(array);
            value = 0;
            for (let i = 0; i < bytesNeeded; i++) {
                value = (value << 8) | array[i];
            }
        } while (value > maxValue - maxValue % range);
        
        return min + (value % range);
    }

    /**
     * Generate a secure random float between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random float
     */
    randomFloat(min, max) {
        return min + this.random() * (max - min);
    }

    /**
     * Shuffle an array securely using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Choose a random element from an array
     * @param {Array} array - Array to choose from
     * @returns {*} Random element
     */
    choose(array) {
        if (!array || array.length === 0) return null;
        return array[this.randomInt(0, array.length - 1)];
    }

    /**
     * Generate a cryptographically secure UUID v4
     * @returns {string} UUID
     */
    uuid() {
        const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        return template.replace(/[xy]/g, (c) => {
            const r = this.randomInt(0, 15);
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Generate secure random bytes
     * @param {number} length - Number of bytes
     * @returns {Uint8Array} Random bytes
     */
    randomBytes(length) {
        const bytes = new Uint8Array(length);
        this.crypto.getRandomValues(bytes);
        return bytes;
    }

    /**
     * Generate a secure random hex string
     * @param {number} length - Length of hex string
     * @returns {string} Hex string
     */
    randomHex(length) {
        const bytes = this.randomBytes(Math.ceil(length / 2));
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .substring(0, length);
    }
}

// Create global instance and polyfill Math.random for security
window.SecureRandom = new CryptoSecureRandom();

// Override Math.random globally for security (with warning)
const originalRandom = Math.random;
Math.random = function() {
    if (window.ALLOW_MATH_RANDOM_FOR_VISUALS) {
        return originalRandom.call(Math);
    }
    console.warn('Math.random() called - using secure random instead');
    return window.SecureRandom.random();
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoSecureRandom;
}