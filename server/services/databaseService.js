// Database Service Wrapper
// Provides a consistent interface for database operations
// Wraps SupabaseService to match the expected API in controllers

const supabaseService = require('./supabaseService');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.supabase = supabaseService;
  }

  // Purchase Management
  async createPurchase(purchaseData) {
    return this.supabase.createPurchase(purchaseData);
  }

  async getPurchase(invoiceId) {
    // The controller uses invoice_id as the identifier
    return this.supabase.getPurchaseByOrderId(invoiceId);
  }

  async updatePurchase(invoiceId, updates) {
    return this.supabase.updatePurchaseStatus(invoiceId, updates);
  }

  async getPurchasesByWallet(walletAddress) {
    return this.supabase.getWalletPurchaseHistory(walletAddress);
  }

  // Sales Statistics
  async getSalesStats() {
    try {
      // Get purchase stats from Supabase
      const stats = await this.supabase.getPurchaseStats();
      
      // Transform to expected format
      return {
        batches_sold: stats.batches_sold || 0,
        tokens_sold: stats.tokens_sold || 0,
        unique_wallets: stats.unique_buyers || 0,
        total_sats: stats.total_sats_received || 0,
        last_sale_at: stats.last_sale_time || null
      };
    } catch (error) {
      logger.error('Error fetching sales stats:', error);
      // Return default stats if error
      return {
        batches_sold: 0,
        tokens_sold: 0,
        unique_wallets: 0,
        total_sats: 0,
        last_sale_at: null
      };
    }
  }

  async updateSalesStats(updates) {
    // Since Supabase doesn't have updateSalesStats, we'll need to handle this differently
    // For now, log the update attempt
    logger.info('Sales stats update requested:', updates);
    // In production, this would update a sales_stats table
    return true;
  }

  // Game Scores
  async saveGameScore(walletAddress, score, tier, maxBatches, metadata) {
    return this.supabase.saveGameScore(walletAddress, score, tier, maxBatches, metadata);
  }

  async getTopScores(limit = 10) {
    return this.supabase.getTopScores(limit);
  }

  // Wallet Management
  async checkWalletPurchaseLimit(walletAddress, requestedBatches) {
    return this.supabase.checkWalletPurchaseLimit(walletAddress, requestedBatches);
  }

  async findOrCreateUser(walletAddress) {
    return this.supabase.findOrCreateUser(walletAddress);
  }

  // Health Check
  async healthCheck() {
    return this.supabase.healthCheck();
  }
}

// Export singleton instance
module.exports = new DatabaseService();