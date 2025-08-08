const crypto = require('crypto');
const logger = require('../utils/logger');

class GameValidationService {
  constructor() {
    // Store active game sessions
    this.activeSessions = new Map();
    // Store completed game results
    this.completedGames = new Map();
    // Clean up old sessions every 30 minutes
    setInterval(() => this.cleanupOldSessions(), 1800000);
  }

  /**
   * Create a new game session
   * @param {string} userIdentifier - User identifier (IP, session ID, etc.)
   * @returns {Object} Game session data
   */
  createGameSession(userIdentifier) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userIdentifier,
      startTime: Date.now(),
      seed: crypto.randomBytes(32).toString('hex'),
      checkpoints: [],
      status: 'active',
      antiCheatToken: this.generateAntiCheatToken()
    };
    
    this.activeSessions.set(sessionId, session);
    
    logger.info('Game session created', {
      sessionId,
      userIdentifier: this.hashIdentifier(userIdentifier)
    });
    
    return {
      sessionId,
      seed: session.seed,
      antiCheatToken: session.antiCheatToken
    };
  }

  /**
   * Record game checkpoint
   * @param {string} sessionId - Game session ID
   * @param {Object} checkpoint - Checkpoint data
   * @returns {boolean} Success status
   */
  recordCheckpoint(sessionId, checkpoint) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || session.status !== 'active') {
      logger.warn('Invalid session for checkpoint', { sessionId });
      return false;
    }
    
    // Validate checkpoint timing
    const lastCheckpoint = session.checkpoints[session.checkpoints.length - 1];
    if (lastCheckpoint) {
      const timeDiff = checkpoint.timestamp - lastCheckpoint.timestamp;
      
      // Suspicious if checkpoints are too close together
      if (timeDiff < 100) {
        logger.warn('Suspicious checkpoint timing', {
          sessionId,
          timeDiff,
          checkpoint
        });
        session.suspiciousActivity = (session.suspiciousActivity || 0) + 1;
      }
    }
    
    // Validate score progression
    if (lastCheckpoint && checkpoint.score < lastCheckpoint.score) {
      logger.warn('Score decreased between checkpoints', {
        sessionId,
        lastScore: lastCheckpoint.score,
        newScore: checkpoint.score
      });
      session.suspiciousActivity = (session.suspiciousActivity || 0) + 1;
    }
    
    session.checkpoints.push({
      ...checkpoint,
      timestamp: Date.now(),
      hash: this.generateCheckpointHash(sessionId, checkpoint)
    });
    
    return true;
  }

  /**
   * Complete game session and validate final score
   * @param {string} sessionId - Game session ID
   * @param {Object} gameResult - Final game result
   * @returns {Object} Validation result
   */
  completeGameSession(sessionId, gameResult) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return {
        isValid: false,
        error: 'Invalid game session'
      };
    }
    
    if (session.status !== 'active') {
      return {
        isValid: false,
        error: 'Game session already completed'
      };
    }
    
    // Validate game duration
    const duration = Date.now() - session.startTime;
    const minDuration = 30000; // 30 seconds minimum
    const maxDuration = 600000; // 10 minutes maximum
    
    if (duration < minDuration) {
      logger.warn('Game completed too quickly', {
        sessionId,
        duration,
        score: gameResult.score
      });
      return {
        isValid: false,
        error: 'Game completed too quickly'
      };
    }
    
    if (duration > maxDuration) {
      logger.warn('Game took too long', {
        sessionId,
        duration,
        score: gameResult.score
      });
      return {
        isValid: false,
        error: 'Game session expired'
      };
    }
    
    // Validate score progression
    const scoreValidation = this.validateScoreProgression(session, gameResult);
    if (!scoreValidation.isValid) {
      return scoreValidation;
    }
    
    // Check for suspicious activity
    if (session.suspiciousActivity > 3) {
      logger.warn('Too much suspicious activity in game session', {
        sessionId,
        suspiciousCount: session.suspiciousActivity
      });
      return {
        isValid: false,
        error: 'Invalid game session'
      };
    }
    
    // Mark session as completed
    session.status = 'completed';
    session.endTime = Date.now();
    session.finalScore = gameResult.score;
    session.tier = this.getTierFromScore(gameResult.score);
    
    // Store completed game for future reference
    const completedGame = {
      sessionId,
      userIdentifier: session.userIdentifier,
      score: gameResult.score,
      tier: session.tier,
      duration,
      completedAt: Date.now(),
      validUntil: Date.now() + (60 * 60 * 1000) // Valid for 1 hour
    };
    
    this.completedGames.set(sessionId, completedGame);
    this.activeSessions.delete(sessionId);
    
    logger.info('Game session completed', {
      sessionId,
      score: gameResult.score,
      tier: session.tier,
      duration
    });
    
    return {
      isValid: true,
      score: gameResult.score,
      tier: session.tier,
      sessionId
    };
  }

  /**
   * Validate score progression through checkpoints
   * @param {Object} session - Game session
   * @param {Object} finalResult - Final game result
   * @returns {Object} Validation result
   */
  validateScoreProgression(session, finalResult) {
    const checkpoints = session.checkpoints;
    
    if (checkpoints.length < 3) {
      return {
        isValid: false,
        error: 'Insufficient game checkpoints'
      };
    }
    
    // Check if final score matches last checkpoint
    const lastCheckpoint = checkpoints[checkpoints.length - 1];
    if (Math.abs(lastCheckpoint.score - finalResult.score) > 5) {
      logger.warn('Final score does not match last checkpoint', {
        sessionId: session.id,
        checkpointScore: lastCheckpoint.score,
        finalScore: finalResult.score
      });
      return {
        isValid: false,
        error: 'Invalid final score'
      };
    }
    
    // Validate score rate
    const scoringRate = finalResult.score / (session.checkpoints.length + 1);
    const maxScoringRate = 3; // Max 3 points per checkpoint average
    
    if (scoringRate > maxScoringRate) {
      logger.warn('Suspicious scoring rate', {
        sessionId: session.id,
        scoringRate,
        maxAllowed: maxScoringRate
      });
      return {
        isValid: false,
        error: 'Invalid scoring pattern'
      };
    }
    
    return { isValid: true };
  }

  /**
   * Verify game result for purchase
   * @param {string} sessionId - Game session ID
   * @param {string} userIdentifier - User identifier
   * @returns {Object} Verification result
   */
  verifyGameForPurchase(sessionId, userIdentifier) {
    const completedGame = this.completedGames.get(sessionId);
    
    if (!completedGame) {
      return {
        isValid: false,
        error: 'No completed game found for this session'
      };
    }
    
    // Check if game result has expired
    if (Date.now() > completedGame.validUntil) {
      return {
        isValid: false,
        error: 'Game result has expired. Please play again.'
      };
    }
    
    // Verify user identifier matches
    if (completedGame.userIdentifier !== userIdentifier) {
      logger.warn('User identifier mismatch for game verification', {
        sessionId,
        expected: this.hashIdentifier(completedGame.userIdentifier),
        provided: this.hashIdentifier(userIdentifier)
      });
      return {
        isValid: false,
        error: 'Invalid game session'
      };
    }
    
    return {
      isValid: true,
      score: completedGame.score,
      tier: completedGame.tier,
      sessionId
    };
  }

  /**
   * Get tier from score
   * @param {number} score - Game score
   * @returns {string|null} Tier name or null
   */
  getTierFromScore(score) {
    if (score >= 28) return 'gold';
    if (score >= 18) return 'silver';
    if (score >= 11) return 'bronze';
    return null;
  }

  /**
   * Generate secure session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return 'game_' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate anti-cheat token
   * @returns {string} Anti-cheat token
   */
  generateAntiCheatToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate checkpoint hash
   * @param {string} sessionId - Session ID
   * @param {Object} checkpoint - Checkpoint data
   * @returns {string} Checkpoint hash
   */
  generateCheckpointHash(sessionId, checkpoint) {
    const data = `${sessionId}:${checkpoint.score}:${checkpoint.timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash user identifier for logging
   * @param {string} identifier - User identifier
   * @returns {string} Hashed identifier
   */
  hashIdentifier(identifier) {
    if (!identifier) return 'null';
    return crypto
      .createHash('sha256')
      .update(identifier)
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Clean up old sessions
   */
  cleanupOldSessions() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    let cleaned = 0;
    
    // Clean active sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.startTime > maxAge) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    }
    
    // Clean completed games
    for (const [sessionId, game] of this.completedGames.entries()) {
      if (now > game.validUntil) {
        this.completedGames.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old game sessions`);
    }
  }

  /**
   * Get session statistics for monitoring
   * @returns {Object} Session statistics
   */
  getStats() {
    return {
      activeSessions: this.activeSessions.size,
      completedGames: this.completedGames.size,
      totalSessions: this.activeSessions.size + this.completedGames.size
    };
  }
}

module.exports = new GameValidationService();