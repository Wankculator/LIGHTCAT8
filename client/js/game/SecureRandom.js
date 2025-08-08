// This file requires crypto-secure-random.js to be loaded first
/**
 * SecureRandom - Cryptographically secure random number generator for game
 * Uses Web Crypto API when available, with window.SecureRandom.random() fallback for non-critical visual effects only
 */

class SecureRandom {
  constructor() {
    this.isSecureAvailable = typeof crypto !== 'undefined' && crypto.getRandomValues;
    this.warningShown = false;
  }

  /**
   * Get a secure random number between 0 and 1
   * @param {boolean} allowFallback - Allow window.SecureRandom.random() fallback for visual effects
   * @returns {number} Random number between 0 and 1
   */
  random(allowFallback = false) {
    if (this.isSecureAvailable) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / (0xffffffff + 1);
    } else if (allowFallback) {
      if (!this.warningShown) {
        console.warn('SecureRandom: Using window.SecureRandom.random() fallback. This should only be used for visual effects, not security-critical operations.');
        this.warningShown = true;
      }
      return window.SecureRandom.random();
    } else {
      throw new Error('Secure random number generation not available and fallback not allowed');
    }
  }

  /**
   * Get a secure random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {boolean} allowFallback - Allow window.SecureRandom.random() fallback for visual effects
   * @returns {number} Random integer
   */
  randomInt(min, max, allowFallback = false) {
    return Math.floor(this.random(allowFallback) * (max - min + 1)) + min;
  }

  /**
   * Get a secure random float between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {boolean} allowFallback - Allow window.SecureRandom.random() fallback for visual effects
   * @returns {number} Random float
   */
  randomFloat(min, max, allowFallback = false) {
    return this.random(allowFallback) * (max - min) + min;
  }

  /**
   * Generate a secure random hex string
   * @param {number} length - Length of hex string
   * @returns {string} Random hex string
   */
  randomHex(length) {
    if (!this.isSecureAvailable) {
      throw new Error('Secure random not available for cryptographic operations');
    }
    
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
  }

  /**
   * Shuffle an array securely
   * @param {Array} array - Array to shuffle
   * @param {boolean} allowFallback - Allow window.SecureRandom.random() fallback
   * @returns {Array} Shuffled array
   */
  shuffle(array, allowFallback = false) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i, allowFallback);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Choose a random element from an array
   * @param {Array} array - Array to choose from
   * @param {boolean} allowFallback - Allow window.SecureRandom.random() fallback
   * @returns {*} Random element
   */
  choose(array, allowFallback = false) {
    return array[this.randomInt(0, array.length - 1, allowFallback)];
  }
}

// Create singleton instance
const secureRandom = new SecureRandom();

// Export for use in game files
if (typeof window !== 'undefined') {
  window.SecureRandom = secureRandom;
}

// Legacy compatibility wrapper - logs deprecation warning
function gameRandom() {
  console.warn('gameRandom() is deprecated. Use SecureRandom.random(true) for visual effects or SecureRandom.random(false) for secure operations.');
  return secureRandom.random(true);
}

if (typeof window !== 'undefined') {
  window.gameRandom = gameRandom;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SecureRandom: secureRandom, gameRandom };
}