/**
 * Cryptographically secure random utilities
 * Replaces Math.random() for security-sensitive operations
 */

class CryptoUtils {
    /**
     * Generate a secure random float between 0 and 1 (like Math.random())
     * @returns {number} Random float between 0 and 1
     */
    static random() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
    }

    /**
     * Generate a secure random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    static randomInt(min, max) {
        const range = max - min + 1;
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return min + (array[0] % range);
    }

    /**
     * Generate a secure random string
     * @param {number} length - Length of the string
     * @param {string} charset - Character set to use
     * @returns {string} Random string
     */
    static randomString(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        const result = [];
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        
        for (let i = 0; i < length; i++) {
            result.push(charset[array[i] % charset.length]);
        }
        
        return result.join('');
    }

    /**
     * Generate a secure UUID v4
     * @returns {string} UUID string
     */
    static generateUUID() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        
        // Set version (4) and variant bits
        array[6] = (array[6] & 0x0f) | 0x40;
        array[8] = (array[8] & 0x3f) | 0x80;
        
        const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        
        return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
    }

    /**
     * Generate a secure ID with prefix
     * @param {string} prefix - ID prefix
     * @param {number} length - Length of random part
     * @returns {string} Secure ID
     */
    static generateId(prefix = '', length = 9) {
        const timestamp = Date.now().toString(36);
        const random = this.randomString(length, '0123456789abcdefghijklmnopqrstuvwxyz');
        return `${prefix}${timestamp}_${random}`;
    }

    /**
     * Generate a secure hex string
     * @param {number} bytes - Number of bytes
     * @returns {string} Hex string
     */
    static randomHex(bytes) {
        const array = new Uint8Array(bytes);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate a secure base64 string
     * @param {number} bytes - Number of bytes
     * @returns {string} Base64 string
     */
    static randomBase64(bytes) {
        const array = new Uint8Array(bytes);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoUtils;
}