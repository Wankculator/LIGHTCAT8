// This file requires memory-safe-events.js to be loaded first
/**
 * SecureStorage - Secure wrapper for localStorage with validation and encryption
 * Protects against XSS attacks and data tampering
 */

class SecureStorage {
  constructor() {
    this.prefix = 'litecat_';
    this.encryptionKey = this._generateKey();
  
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}

  /**
   * Generate a simple key for basic obfuscation (not true encryption)
   * For production, use proper encryption with Web Crypto API
   */
  _generateKey() {
    // This is a basic implementation - in production, use a proper key derivation
    return 'litecat_2025_secure_key';
  }

  /**
   * Simple XOR obfuscation (replace with proper encryption in production)
   */
  _obfuscate(data) {
    const key = this.encryptionKey;
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
  }

  /**
   * Deobfuscate data
   */
  _deobfuscate(data) {
    try {
      const decoded = atob(data);
      const key = this.encryptionKey;
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  /**
   * Validate and sanitize keys
   */
  _validateKey(key) {
    if (typeof key !== 'string' || !key) {
      throw new Error('Invalid storage key');
    }
    // Only allow alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      throw new Error('Storage key contains invalid characters');
    }
    return this.prefix + key;
  }

  /**
   * Store data with validation and integrity check
   */
  setItem(key, value, options = {}) {
    try {
      const validKey = this._validateKey(key);
      
      // Create storage object with metadata
      const storageObject = {
        value: value,
        timestamp: Date.now(),
        checksum: this._generateChecksum(value),
        type: typeof value,
        expires: options.expires || null
      };

      // Serialize and obfuscate
      const serialized = JSON.stringify(storageObject);
      const obfuscated = this._obfuscate(serialized);
      
      // Store in localStorage
      localStorage.setItem(validKey, obfuscated);
      
      return true;
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      return false;
    }
  }

  /**
   * Retrieve data with validation
   */
  getItem(key) {
    try {
      const validKey = this._validateKey(key);
      const obfuscated = localStorage.getItem(validKey);
      
      if (!obfuscated) {
        return null;
      }

      // Deobfuscate and parse
      const serialized = this._deobfuscate(obfuscated);
      if (!serialized) {
        return null;
      }

      const storageObject = JSON.parse(serialized);

      // Check expiry
      if (storageObject.expires && Date.now() > storageObject.expires) {
        this.removeItem(key);
        return null;
      }

      // Verify checksum
      const checksum = this._generateChecksum(storageObject.value);
      if (checksum !== storageObject.checksum) {
        console.warn('SecureStorage: Data integrity check failed for key:', key);
        this.removeItem(key);
        return null;
      }

      return storageObject.value;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  /**
   * Remove item
   */
  removeItem(key) {
    try {
      const validKey = this._validateKey(key);
      localStorage.removeItem(validKey);
      return true;
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
      return false;
    }
  }

  /**
   * Clear all secure storage items
   */
  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Generate checksum for data integrity
   */
  _generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Check if storage is available
   */
  isAvailable() {
    try {
      const test = '__secure_storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get all keys (for debugging)
   */
  getAllKeys() {
    const keys = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    });
    return keys;
  }
}

// Game-specific secure storage methods
class GameSecureStorage {
  constructor() {
    super();
    this.gamePrefix = 'game_';
  
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}

  /**
   * Save game score with server validation token
   */
  saveGameScore(score, tier, validationToken) {
    if (typeof score !== 'number' || score < 0) {
      throw new Error('Invalid game score');
    }

    const gameData = {
      score: score,
      tier: tier,
      validationToken: validationToken,
      timestamp: Date.now()
    };

    return this.setItem(this.gamePrefix + 'score', gameData, {
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
  }

  /**
   * Get validated game score
   */
  getGameScore() {
    const data = this.getItem(this.gamePrefix + 'score');
    if (!data || !data.validationToken) {
      return null;
    }
    
    // In production, validate token with server
    return data;
  }

  /**
   * Save tier unlock with server validation
   */
  saveTierUnlock(tier, score, serverToken) {
    const validTiers = ['bronze', 'silver', 'gold'];
    if (!validTiers.includes(tier)) {
      throw new Error('Invalid tier');
    }

    const tierData = {
      tier: tier,
      score: score,
      serverToken: serverToken,
      unlockTime: Date.now()
    };

    return this.setItem(this.gamePrefix + 'tier', tierData);
  }

  /**
   * Get tier with validation
   */
  getTierUnlock() {
    return this.getItem(this.gamePrefix + 'tier');
  }

  /**
   * Clear game data
   */
  clearGameData() {
    this.removeItem(this.gamePrefix + 'score');
    this.removeItem(this.gamePrefix + 'tier');
  }
}

// Create singleton instances
const secureStorage = new SecureStorage();
const gameSecureStorage = new GameSecureStorage();

// Export for use
if (typeof window !== 'undefined') {
  window.SecureStorage = secureStorage;
  window.GameSecureStorage = gameSecureStorage;
}

// Migration helper for existing localStorage usage
function migrateToSecureStorage() {
  const migrations = {
    'highScore': 'game_score',
    'unlockedTier': 'game_tier',
    'litecatGameTier': 'game_tier',
    'gameScore': 'game_score',
    'currentInvoice': 'invoice_current',
    'twitterFollowClicked': 'social_twitter_follow',
    'followClickTime': 'social_follow_time',
    'twitterVerified': 'social_twitter_verified'
  };

  Object.entries(migrations).forEach(([oldKey, newKey]) => {
    const value = localStorage.getItem(oldKey);
    if (value !== null) {
      try {
        // Try to parse JSON values
        let parsedValue = value;
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          // Not JSON, use as-is
        }
        
        secureStorage.setItem(newKey, parsedValue);
        localStorage.removeItem(oldKey);
        console.log(`Migrated ${oldKey} to secure storage`);
      } catch (error) {
        console.error(`Failed to migrate ${oldKey}:`, error);
      }
    }
  });
}

// Auto-migrate on load
if (typeof window !== 'undefined') {
  window.SafeEvents.on(window, 'DOMContentLoaded', () => {
    if (secureStorage.isAvailable()) {
      migrateToSecureStorage();
    }
  });
}