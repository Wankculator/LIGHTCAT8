const express = require('express');
const router = express.Router();
const gameValidationService = require('../services/gameValidationService');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Rate limiting for game endpoints
const gameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: 'Too many game requests from this IP'
});

const gameStartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 new games per minute
  message: 'Too many new games started. Please wait before starting another game.'
});

/**
 * Start a new game session
 */
router.post('/start', gameStartLimiter, async (req, res) => {
  try {
    const userIdentifier = req.ip || req.connection.remoteAddress;
    
    // Create game session
    const session = gameValidationService.createGameSession(userIdentifier);
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      seed: session.seed,
      antiCheatToken: session.antiCheatToken,
      timestamp: Date.now()
    });
    
  } catch (error) {
    logger.error('Failed to start game session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start game session'
    });
  }
});

/**
 * Record game checkpoint
 */
router.post('/checkpoint', gameLimiter, async (req, res) => {
  try {
    const { sessionId, score, position, collectibles, antiCheatToken } = req.body;
    
    if (!sessionId || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and score are required'
      });
    }
    
    // Record checkpoint
    const success = gameValidationService.recordCheckpoint(sessionId, {
      score,
      position,
      collectibles,
      antiCheatToken,
      timestamp: Date.now()
    });
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game session'
      });
    }
    
    res.json({
      success: true,
      timestamp: Date.now()
    });
    
  } catch (error) {
    logger.error('Failed to record checkpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record checkpoint'
    });
  }
});

/**
 * Complete game and get tier
 */
router.post('/complete', gameLimiter, async (req, res) => {
  try {
    const { sessionId, finalScore, antiCheatToken } = req.body;
    
    if (!sessionId || finalScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and final score are required'
      });
    }
    
    // Complete game session
    const result = gameValidationService.completeGameSession(sessionId, {
      score: finalScore,
      antiCheatToken
    });
    
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      score: result.score,
      tier: result.tier,
      sessionId: result.sessionId,
      message: result.tier ? 
        `Congratulations! You unlocked ${result.tier} tier with a score of ${result.score}!` :
        'Score too low to unlock purchasing. Need at least 11 points for Bronze tier.'
    });
    
  } catch (error) {
    logger.error('Failed to complete game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete game'
    });
  }
});

/**
 * Verify game session (for debugging)
 */
router.get('/verify/:sessionId', gameLimiter, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userIdentifier = req.ip || req.connection.remoteAddress;
    
    const verification = gameValidationService.verifyGameForPurchase(
      sessionId,
      userIdentifier
    );
    
    res.json({
      success: verification.isValid,
      ...verification
    });
    
  } catch (error) {
    logger.error('Failed to verify game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify game session'
    });
  }
});

/**
 * Get game statistics (admin)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = gameValidationService.getStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    logger.error('Failed to get game stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

module.exports = router;