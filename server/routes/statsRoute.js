// Stats endpoint that always returns 200 with JSON (never 404)
const express = require('express');
const router = express.Router();

// In-memory cache for stats
let cachedStats = null;
let cachedAt = 0;
const STATS_TTL_MS = Number(process.env.STATS_TTL_MS || 15000);

// Default stats structure
const getDefaultStats = () => ({
  uptimeSec: Math.floor(process.uptime()),
  remainingBatches: Number(process.env.DEFAULT_REMAINING || 23700),
  tier: process.env.DEFAULT_TIER || 'bronze',
  mintedToday: 0,
  totalMinted: 0,
  health: 'ok'
});

router.get('/stats', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached stats if still valid
    if (cachedStats && now - cachedAt < STATS_TTL_MS) {
      return res.json(cachedStats);
    }

    // TODO: Replace with real database query when available
    // For now, return default stats
    const stats = getDefaultStats();
    
    // Cache the stats
    cachedStats = stats;
    cachedAt = now;
    
    // Always return 200 with JSON
    res.json(stats);
  } catch (error) {
    console.error('[stats] Error fetching stats:', error);
    
    // Even on error, return 200 with degraded stats
    res.status(200).json({
      ...getDefaultStats(),
      health: 'degraded'
    });
  }
});

module.exports = router;