// Database Middleware
// Injects database service into request object for all routes

const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * Middleware to inject database service into request
 */
function injectDatabaseService(req, res, next) {
  // Attach database service to request
  req.databaseService = databaseService;
  
  // Log database health on first request
  if (!global.dbHealthChecked) {
    global.dbHealthChecked = true;
    databaseService.healthCheck()
      .then(health => {
        logger.info('Database service health:', health);
      })
      .catch(err => {
        logger.error('Database health check failed:', err);
      });
  }
  
  next();
}

module.exports = {
  injectDatabaseService
};