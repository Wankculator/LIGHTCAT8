// RGB Protocol Complete Integration Service
// Handles automated token distribution for LIGHTCAT

const { exec } = require('child_process');
const util = require('util');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../utils/logger');
const supabaseService = require('./supabaseService');
const emailService = require('./emailService');

const execAsync = util.promisify(exec);

class RGBIntegrationService {
  constructor() {
    this.assetId = process.env.RGB_ASSET_ID || 'rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gj-UKIY7Po';
    this.nodeStatus = 'initializing';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.distributionQueue = [];
    this.processingDistribution = false;
    
    // Token tracking
    this.totalSupply = 21000000;
    this.distributedTokens = 0;
    this.reservedTokens = 1470000; // 7% team allocation
    this.availableForSale = 19530000; // 93% public sale
    
    // Initialize on startup
    this.initialize();
  }

  async initialize() {
    try {
      logger.info('Initializing RGB Integration Service...');
      
      // Check RGB node status
      const nodeReady = await this.checkNodeStatus();
      if (!nodeReady) {
        logger.warn('RGB node not ready, running in mock mode');
        this.mockMode = true;
        this.nodeStatus = 'mock';
        return;
      }
      
      // Load distribution state
      await this.loadDistributionState();
      
      // Start distribution processor
      this.startDistributionProcessor();
      
      this.nodeStatus = 'ready';
      logger.info('RGB Integration Service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize RGB Integration:', error);
      this.mockMode = true;
      this.nodeStatus = 'error';
    }
  }

  async checkNodeStatus() {
    try {
      // Check if RGB CLI is available
      const { stdout } = await execAsync('which rgb-cli');
      if (!stdout.trim()) {
        return false;
      }
      
      // Check if node is running
      const { stdout: nodeInfo } = await execAsync('rgb-cli node status');
      return nodeInfo.includes('running');
      
    } catch (error) {
      logger.debug('RGB node check failed:', error.message);
      return false;
    }
  }

  async loadDistributionState() {
    try {
      // Get distributed token count from database
      const stats = await supabaseService.query(
        'sales_stats',
        { select: '*', single: true }
      );
      
      if (stats) {
        this.distributedTokens = (stats.batches_sold || 0) * 700;
        logger.info(`Loaded distribution state: ${this.distributedTokens} tokens distributed`);
      }
      
    } catch (error) {
      logger.error('Failed to load distribution state:', error);
    }
  }

  /**
   * Process token distribution after payment
   */
  async distributeTokens(paymentData) {
    const {
      invoiceId,
      rgbInvoice,
      batchCount,
      walletAddress,
      email
    } = paymentData;
    
    try {
      logger.info('Processing token distribution:', {
        invoiceId,
        batches: batchCount,
        tokens: batchCount * 700
      });
      
      // Add to distribution queue
      this.distributionQueue.push({
        ...paymentData,
        timestamp: new Date(),
        status: 'pending'
      });
      
      // Process immediately if not already processing
      if (!this.processingDistribution) {
        this.processDistributionQueue();
      }
      
      return {
        success: true,
        message: 'Distribution queued',
        queuePosition: this.distributionQueue.length
      };
      
    } catch (error) {
      logger.error('Failed to queue distribution:', error);
      throw error;
    }
  }

  /**
   * Process distribution queue
   */
  async processDistributionQueue() {
    if (this.processingDistribution || this.distributionQueue.length === 0) {
      return;
    }
    
    this.processingDistribution = true;
    
    while (this.distributionQueue.length > 0) {
      const distribution = this.distributionQueue.shift();
      
      try {
        // Generate consignment
        const consignment = await this.generateConsignment(distribution);
        
        // Update database
        await this.updateDistributionRecord(distribution.invoiceId, {
          status: 'completed',
          consignment_file: consignment,
          distributed_at: new Date()
        });
        
        // Send notification
        if (distribution.email) {
          await this.sendDistributionEmail(distribution.email, {
            invoiceId: distribution.invoiceId,
            tokens: distribution.batchCount * 700,
            consignment
          });
        }
        
        // Update token count
        this.distributedTokens += distribution.batchCount * 700;
        
        logger.info('Distribution completed:', {
          invoiceId: distribution.invoiceId,
          tokens: distribution.batchCount * 700,
          totalDistributed: this.distributedTokens
        });
        
      } catch (error) {
        logger.error('Distribution failed:', error);
        
        // Mark as failed
        distribution.status = 'failed';
        distribution.error = error.message;
        distribution.retryCount = (distribution.retryCount || 0) + 1;
        
        // Retry up to 3 times
        if (distribution.retryCount < 3) {
          this.distributionQueue.push(distribution);
          logger.info('Distribution retry queued:', distribution.invoiceId);
        } else {
          await this.handleDistributionFailure(distribution);
        }
      }
      
      // Small delay between distributions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.processingDistribution = false;
  }

  /**
   * Generate RGB consignment
   */
  async generateConsignment(distribution) {
    const { rgbInvoice, batchCount, invoiceId } = distribution;
    const tokenAmount = batchCount * 700;
    
    if (this.mockMode) {
      return this.generateMockConsignment(distribution);
    }
    
    try {
      // Create transfer command
      const command = `rgb-cli transfer create \
        --asset "${this.assetId}" \
        --amount ${tokenAmount} \
        --recipient "${rgbInvoice}" \
        --fee-rate 5 \
        --output base64`;
      
      logger.debug('Executing RGB transfer:', { invoiceId, amount: tokenAmount });
      
      // Execute transfer
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000 // 30 second timeout
      });
      
      if (stderr) {
        throw new Error(`RGB transfer error: ${stderr}`);
      }
      
      // Extract consignment from output
      const consignment = stdout.trim();
      
      if (!consignment || consignment.length < 100) {
        throw new Error('Invalid consignment generated');
      }
      
      // Log successful transfer
      await this.logTransfer({
        invoiceId,
        rgbInvoice,
        tokenAmount,
        consignmentHash: crypto.createHash('sha256').update(consignment).digest('hex'),
        timestamp: new Date()
      });
      
      return consignment;
      
    } catch (error) {
      logger.error('Consignment generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate mock consignment for testing
   */
  generateMockConsignment(distribution) {
    const { invoiceId, batchCount } = distribution;
    
    // Create realistic mock consignment
    const header = 'RGB20';
    const version = '01';
    const assetId = this.assetId.replace('rgb:', '');
    const amount = (batchCount * 700).toString(16).padStart(16, '0');
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now().toString(16);
    
    const mockData = `${header}${version}${assetId}${amount}${nonce}${timestamp}`;
    const mockConsignment = Buffer.from(mockData).toString('base64');
    
    logger.info('Generated mock consignment:', {
      invoiceId,
      tokens: batchCount * 700,
      length: mockConsignment.length
    });
    
    return mockConsignment;
  }

  /**
   * Update distribution record
   */
  async updateDistributionRecord(invoiceId, updates) {
    try {
      await supabaseService.update('purchases', invoiceId, updates);
    } catch (error) {
      logger.error('Failed to update distribution record:', error);
      throw error;
    }
  }

  /**
   * Send distribution email
   */
  async sendDistributionEmail(email, data) {
    try {
      await emailService.sendTemplate(email, 'token-distribution', {
        subject: 'Your LIGHTCAT Tokens Are Ready!',
        invoiceId: data.invoiceId,
        tokenAmount: data.tokens,
        downloadUrl: `${process.env.CLIENT_URL}/api/rgb/download/${data.invoiceId}`,
        consignmentPreview: data.consignment.substring(0, 50) + '...'
      });
    } catch (error) {
      logger.error('Failed to send distribution email:', error);
      // Don't throw - email failure shouldn't stop distribution
    }
  }

  /**
   * Handle distribution failure
   */
  async handleDistributionFailure(distribution) {
    logger.error('Distribution permanently failed:', {
      invoiceId: distribution.invoiceId,
      error: distribution.error,
      attempts: distribution.retryCount
    });
    
    // Update database
    await this.updateDistributionRecord(distribution.invoiceId, {
      status: 'failed',
      error_message: distribution.error,
      failed_at: new Date()
    });
    
    // Notify admin
    await emailService.sendAdminAlert('Distribution Failed', {
      invoiceId: distribution.invoiceId,
      error: distribution.error,
      customerEmail: distribution.email,
      tokens: distribution.batchCount * 700
    });
  }

  /**
   * Log transfer for audit
   */
  async logTransfer(transferData) {
    try {
      // Log to database
      await supabaseService.insert('rgb_transfers', {
        invoice_id: transferData.invoiceId,
        recipient_invoice: transferData.rgbInvoice.substring(0, 50),
        token_amount: transferData.tokenAmount,
        consignment_hash: transferData.consignmentHash,
        created_at: transferData.timestamp
      });
      
      // Log to file for backup
      const logEntry = JSON.stringify({
        ...transferData,
        rgbInvoice: transferData.rgbInvoice.substring(0, 50) + '...'
      }) + '\n';
      
      const logFile = path.join(__dirname, '../../logs/rgb-transfers.log');
      await fs.appendFile(logFile, logEntry);
      
    } catch (error) {
      logger.error('Failed to log transfer:', error);
      // Don't throw - logging failure shouldn't stop distribution
    }
  }

  /**
   * Start distribution processor
   */
  startDistributionProcessor() {
    // Process queue every 5 seconds
    setInterval(() => {
      if (this.distributionQueue.length > 0) {
        this.processDistributionQueue();
      }
    }, 5000);
    
    logger.info('Distribution processor started');
  }

  /**
   * Get distribution statistics
   */
  async getDistributionStats() {
    return {
      nodeStatus: this.nodeStatus,
      mockMode: this.mockMode,
      totalSupply: this.totalSupply,
      distributedTokens: this.distributedTokens,
      availableTokens: this.availableForSale - this.distributedTokens,
      queueLength: this.distributionQueue.length,
      processingActive: this.processingDistribution,
      percentDistributed: ((this.distributedTokens / this.availableForSale) * 100).toFixed(2)
    };
  }

  /**
   * Validate RGB invoice
   */
  validateRGBInvoice(invoice) {
    if (!invoice || typeof invoice !== 'string') {
      return { valid: false, error: 'Invalid invoice format' };
    }
    
    if (!invoice.startsWith('rgb:')) {
      return { valid: false, error: 'Invoice must start with rgb:' };
    }
    
    if (!invoice.includes('utxob:')) {
      return { valid: false, error: 'Invalid RGB invoice structure' };
    }
    
    // Check minimum length
    if (invoice.length < 100) {
      return { valid: false, error: 'Invoice too short' };
    }
    
    return { valid: true };
  }

  /**
   * Emergency stop distribution
   */
  async emergencyStop() {
    logger.warn('Emergency stop activated for RGB distribution');
    this.distributionQueue = [];
    this.processingDistribution = false;
    this.nodeStatus = 'stopped';
  }

  /**
   * Resume distribution
   */
  async resumeDistribution() {
    logger.info('Resuming RGB distribution');
    await this.initialize();
  }
}

// Export singleton
module.exports = new RGBIntegrationService();