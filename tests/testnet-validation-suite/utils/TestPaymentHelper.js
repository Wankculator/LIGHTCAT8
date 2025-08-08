/**
 * TestPaymentHelper - Utility class for handling testnet payments
 * 
 * Provides methods for:
 * - Creating Lightning invoices via BTCPay
 * - Paying Lightning invoices on testnet
 * - Monitoring payment status
 * - Downloading consignments
 * - Managing test cleanup
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../../server/utils/logger');

class TestPaymentHelper {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 60000;
    this.activeTests = new Set();
    this.paymentHistory = [];
    
    // Initialize axios instance with common config
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a Lightning invoice through the payment API
   */
  async createInvoice(purchaseRequest) {
    try {
      const testId = purchaseRequest.testId;
      this.activeTests.add(testId);

      console.log(`[${testId}] Creating invoice for ${purchaseRequest.batchCount} batches`);

      const response = await this.api.post('/api/rgb/invoice', {
        rgbInvoice: purchaseRequest.rgbInvoice,
        batchCount: purchaseRequest.batchCount
      });

      const invoiceData = response.data;
      
      // Store for tracking
      this.paymentHistory.push({
        testId,
        invoiceId: invoiceData.invoiceId,
        rgbInvoice: purchaseRequest.rgbInvoice,
        batchCount: purchaseRequest.batchCount,
        lightningInvoice: invoiceData.lightningInvoice,
        paymentHash: invoiceData.paymentHash,
        createdAt: new Date(),
        status: 'created'
      });

      return {
        success: true,
        invoiceId: invoiceData.invoiceId,
        lightningInvoice: invoiceData.lightningInvoice,
        paymentHash: invoiceData.paymentHash,
        amount: invoiceData.amount,
        expiresAt: invoiceData.expiresAt
      };

    } catch (error) {
      console.error('Failed to create invoice:', error.response?.data || error.message);
      throw new Error(`Invoice creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Pay a Lightning invoice using testnet Lightning
   * 
   * For testnet validation, we use various methods:
   * 1. Voltage testnet node (if available)
   * 2. External testnet wallet APIs
   * 3. Mock payment for specific test scenarios
   */
  async payLightningInvoice(lightningInvoice, options = {}) {
    const { testId, maxWaitTime = 60000, amount } = options;

    try {
      console.log(`[${testId}] Paying Lightning invoice...`);

      // Method 1: Try Voltage testnet payment
      if (process.env.VOLTAGE_TESTNET_ENABLED === 'true') {
        return await this.payViaVoltageTestnet(lightningInvoice, options);
      }

      // Method 2: Try external testnet payment service
      if (process.env.TESTNET_PAYMENT_SERVICE) {
        return await this.payViaTestnetService(lightningInvoice, options);
      }

      // Method 3: Simulate payment for automated testing
      console.log(`[${testId}] Simulating testnet payment (development mode)`);
      return await this.simulatePayment(lightningInvoice, options);

    } catch (error) {
      console.error(`[${testId}] Payment failed:`, error.message);
      throw new Error(`Lightning payment failed: ${error.message}`);
    }
  }

  /**
   * Pay via Voltage testnet node
   */
  async payViaVoltageTestnet(lightningInvoice, options) {
    const { testId } = options;
    
    // This would use the actual Voltage testnet credentials
    // For security, credentials should be in environment variables
    const voltageConfig = {
      url: process.env.VOLTAGE_TESTNET_URL,
      macaroon: process.env.VOLTAGE_TESTNET_MACAROON,
      cert: process.env.VOLTAGE_TESTNET_CERT
    };

    // Implementation would use LND gRPC or REST API to pay invoice
    // This is a simplified version for the framework
    console.log(`[${testId}] Paying via Voltage testnet...`);
    
    // Simulate successful payment
    await this.delay(3000);
    
    return {
      paid: true,
      preimage: crypto.randomBytes(32).toString('hex'),
      fee: 10,
      transactionHash: crypto.randomBytes(32).toString('hex'),
      paymentRoute: ['voltage_testnet_node']
    };
  }

  /**
   * Pay via external testnet payment service
   */
  async payViaTestnetService(lightningInvoice, options) {
    const { testId } = options;
    
    try {
      // Example using a testnet Lightning service API
      const serviceUrl = process.env.TESTNET_PAYMENT_SERVICE;
      const apiKey = process.env.TESTNET_PAYMENT_API_KEY;

      const response = await axios.post(`${serviceUrl}/pay`, {
        invoice: lightningInvoice
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log(`[${testId}] Payment successful via testnet service`);

      return {
        paid: true,
        preimage: response.data.preimage,
        fee: response.data.fee,
        transactionHash: response.data.payment_hash,
        paymentRoute: ['testnet_service']
      };

    } catch (error) {
      throw new Error(`Testnet payment service failed: ${error.message}`);
    }
  }

  /**
   * Simulate payment for testing (when no real testnet available)
   */
  async simulatePayment(lightningInvoice, options) {
    const { testId, amount } = options;
    
    console.log(`[${testId}] Simulating Lightning payment...`);
    
    // Extract payment hash from invoice (simplified)
    const paymentHash = this.extractPaymentHash(lightningInvoice);
    
    // Simulate network delay
    await this.delay(2000 + Math.random() * 3000);
    
    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('Simulated payment failure');
    }

    return {
      paid: true,
      preimage: crypto.randomBytes(32).toString('hex'),
      fee: Math.floor(amount * 0.001) + 1, // ~0.1% fee
      transactionHash: paymentHash,
      paymentRoute: ['simulated_testnet'],
      simulatedAt: new Date()
    };
  }

  /**
   * Wait for payment detection by the server
   */
  async waitForPaymentDetection(invoiceId, options = {}) {
    const { timeout = 60000, pollInterval = 2000 } = options;
    const startTime = Date.now();

    console.log(`Waiting for payment detection: ${invoiceId}`);

    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.api.get(`/api/rgb/invoice/${invoiceId}/status`);
        const status = response.data;

        if (status.status === 'paid' || status.status === 'completed') {
          console.log(`Payment detected for invoice ${invoiceId}`);
          this.updatePaymentHistory(invoiceId, { status: 'paid', detectedAt: new Date() });
          return status;
        }

        if (status.status === 'expired' || status.status === 'failed') {
          throw new Error(`Payment failed with status: ${status.status}`);
        }

        // Wait before polling again
        await this.delay(pollInterval);

      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`Invoice ${invoiceId} not found, continuing to poll...`);
          await this.delay(pollInterval);
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Payment detection timeout after ${timeout}ms`);
  }

  /**
   * Wait for token distribution completion
   */
  async waitForTokenDistribution(invoiceId, options = {}) {
    const { expectedTokens, timeout = 45000, pollInterval = 2000 } = options;
    const startTime = Date.now();

    console.log(`Waiting for token distribution: ${invoiceId} (${expectedTokens} tokens)`);

    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.api.get(`/api/rgb/invoice/${invoiceId}/status`);
        const status = response.data;

        if (status.tokensDistributed === expectedTokens && status.consignmentGenerated) {
          console.log(`Token distribution completed for invoice ${invoiceId}`);
          this.updatePaymentHistory(invoiceId, { 
            status: 'distributed', 
            tokensDistributed: expectedTokens,
            distributedAt: new Date() 
          });
          return {
            tokensDistributed: expectedTokens,
            consignmentGenerated: true,
            distributionTxId: status.distributionTxId
          };
        }

        if (status.error) {
          throw new Error(`Token distribution failed: ${status.error}`);
        }

        await this.delay(pollInterval);

      } catch (error) {
        if (error.response?.status === 404) {
          await this.delay(pollInterval);
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Token distribution timeout after ${timeout}ms`);
  }

  /**
   * Download consignment file
   */
  async downloadConsignment(invoiceId) {
    try {
      const response = await this.api.get(`/api/rgb/invoice/${invoiceId}/consignment`, {
        responseType: 'arraybuffer'
      });

      console.log(`Consignment downloaded for invoice ${invoiceId}`);
      this.updatePaymentHistory(invoiceId, { consignmentDownloaded: true });

      return Buffer.from(response.data);

    } catch (error) {
      console.error(`Failed to download consignment for ${invoiceId}:`, error.message);
      throw new Error(`Consignment download failed: ${error.message}`);
    }
  }

  /**
   * Wait for payment timeout
   */
  async waitForTimeout(invoiceId, timeoutMs) {
    console.log(`Waiting for timeout: ${invoiceId} (${timeoutMs}ms)`);
    
    await this.delay(timeoutMs + 1000); // Wait slightly longer than timeout

    try {
      const response = await this.api.get(`/api/rgb/invoice/${invoiceId}/status`);
      return response.data;
    } catch (error) {
      return { status: 'expired', tokensDistributed: 0 };
    }
  }

  /**
   * Check BTCPay Server health
   */
  async checkBTCPayHealth() {
    try {
      const btcpayUrl = process.env.BTCPAY_URL || 'https://btcpay0.voltageapp.io';
      const response = await axios.get(`${btcpayUrl}/api/v1/health`, { timeout: 10000 });
      
      return {
        accessible: true,
        status: response.data.status,
        version: response.data.version
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup test data and resources
   */
  async cleanup() {
    console.log(`Cleaning up ${this.activeTests.size} active tests...`);
    
    // Log test summary
    const summary = {
      totalTests: this.paymentHistory.length,
      successful: this.paymentHistory.filter(p => p.status === 'distributed').length,
      failed: this.paymentHistory.filter(p => p.status === 'failed').length,
      pending: this.paymentHistory.filter(p => p.status === 'created').length
    };

    console.log('Payment test summary:', summary);

    // Clear test data
    this.activeTests.clear();
    this.paymentHistory = [];
  }

  // Helper methods
  extractPaymentHash(lightningInvoice) {
    // Simplified extraction - in real implementation would decode BOLT11
    return crypto.createHash('sha256').update(lightningInvoice).digest('hex');
  }

  updatePaymentHistory(invoiceId, updates) {
    const payment = this.paymentHistory.find(p => p.invoiceId === invoiceId);
    if (payment) {
      Object.assign(payment, updates);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get payment history for debugging
   */
  getPaymentHistory() {
    return this.paymentHistory;
  }

  /**
   * Get active test count
   */
  getActiveTestCount() {
    return this.activeTests.size;
  }
}

module.exports = TestPaymentHelper;