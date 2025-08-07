// This file requires crypto-secure-random.js to be loaded first
/**
 * Game Security Module
 * Handles secure game session management and score validation
 */
class GameSecurity {
  constructor() {
    this.sessionId = null;
    this.antiCheatToken = null;
    this.seed = null;
    this.checkpointInterval = 10000; // 10 seconds
    this.lastCheckpoint = 0;
    this.apiBase = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/game'
      : '/api/game';
  }

  /**
   * Initialize a new game session
   * @returns {Promise<boolean>} Success status
   */
  async startSession() {
    try {
      const response = await fetch(`${this.apiBase}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start game session');
      }

      const data = await response.json();
      
      if (data.success) {
        this.sessionId = data.sessionId;
        this.antiCheatToken = data.antiCheatToken;
        this.seed = data.seed;
        
        // Store session info securely (not in localStorage)
        this.storeSessionInfo();
        
        console.log('Game session started:', this.sessionId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to start game session:', error);
      return false;
    }
  }

  /**
   * Record a game checkpoint
   * @param {number} score - Current score
   * @param {Object} gameState - Additional game state
   * @returns {Promise<boolean>} Success status
   */
  async recordCheckpoint(score, gameState = {}) {
    if (!this.sessionId) {
      console.error('No active game session');
      return false;
    }

    const now = Date.now();
    if (now - this.lastCheckpoint < 5000) { // Minimum 5 seconds between checkpoints
      return false;
    }

    try {
      const response = await fetch(`${this.apiBase}/checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          score,
          position: gameState.position || null,
          collectibles: gameState.collectibles || 0,
          antiCheatToken: this.antiCheatToken,
          timestamp: now
        })
      });

      if (response.ok) {
        this.lastCheckpoint = now;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to record checkpoint:', error);
      return false;
    }
  }

  /**
   * Complete the game session and get tier
   * @param {number} finalScore - Final game score
   * @returns {Promise<Object>} Game result with tier
   */
  async completeSession(finalScore) {
    if (!this.sessionId) {
      console.error('No active game session');
      return {
        success: false,
        error: 'No active game session'
      };
    }

    try {
      const response = await fetch(`${this.apiBase}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          finalScore,
          antiCheatToken: this.antiCheatToken
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Store tier information securely
        this.storeTierInfo(data);
        
        // Clear session data
        this.clearSession();
        
        return data;
      }
      
      return {
        success: false,
        error: data.error || 'Failed to complete game'
      };
    } catch (error) {
      console.error('Failed to complete game session:', error);
      return {
        success: false,
        error: 'Failed to complete game session'
      };
    }
  }

  /**
   * Get current tier information
   * @returns {Object|null} Tier information
   */
  getTierInfo() {
    try {
      // Retrieve from session storage (expires when browser closes)
      const tierData = sessionStorage.getItem('gameValidation');
      if (!tierData) return null;
      
      const decrypted = this.decrypt(tierData);
      const parsed = JSON.parse(decrypted);
      
      // Check if still valid (1 hour expiry)
      if (Date.now() > parsed.validUntil) {
        sessionStorage.removeItem('gameValidation');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to retrieve tier info:', error);
      return null;
    }
  }

  /**
   * Store session information securely
   */
  storeSessionInfo() {
    // Use session storage instead of localStorage
    const sessionData = {
      sessionId: this.sessionId,
      startTime: Date.now()
    };
    
    sessionStorage.setItem('activeGameSession', JSON.stringify(sessionData));
  }

  /**
   * Store tier information securely
   * @param {Object} tierData - Tier data from server
   */
  storeTierInfo(tierData) {
    const validationData = {
      sessionId: tierData.sessionId,
      score: tierData.score,
      tier: tierData.tier,
      timestamp: Date.now(),
      validUntil: Date.now() + (60 * 60 * 1000) // 1 hour
    };
    
    // Encrypt before storing
    const encrypted = this.encrypt(JSON.stringify(validationData));
    sessionStorage.setItem('gameValidation', encrypted);
  }

  /**
   * Clear session data
   */
  clearSession() {
    this.sessionId = null;
    this.antiCheatToken = null;
    this.seed = null;
    this.lastCheckpoint = 0;
    sessionStorage.removeItem('activeGameSession');
  }

  /**
   * Simple encryption for client-side storage
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text
   */
  encrypt(text) {
    // Simple XOR encryption with anti-cheat token
    if (!this.antiCheatToken) return btoa(text);
    
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(
        text.charCodeAt(i) ^ this.antiCheatToken.charCodeAt(i % this.antiCheatToken.length)
      );
    }
    return btoa(encrypted);
  }

  /**
   * Simple decryption for client-side storage
   * @param {string} encrypted - Encrypted text
   * @returns {string} Decrypted text
   */
  decrypt(encrypted) {
    // Retrieve anti-cheat token from active session
    const sessionData = sessionStorage.getItem('activeGameSession');
    if (!sessionData) return atob(encrypted);
    
    const session = JSON.parse(sessionData);
    const token = this.antiCheatToken || '';
    
    const decoded = atob(encrypted);
    let decrypted = '';
    
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ token.charCodeAt(i % token.length)
      );
    }
    
    return decrypted;
  }

  /**
   * Generate secure random number using seed
   * @returns {number} Random number between 0 and 1
   */
  seededRandom() {
    if (!this.seed) return window.SecureRandom.random();
    
    // Simple seeded random for consistency
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Verify game integrity
   * @returns {boolean} Whether game state is valid
   */
  verifyIntegrity() {
    return !!(this.sessionId && this.antiCheatToken);
  }
}

// Export for use in game
window.GameSecurity = new GameSecurity();