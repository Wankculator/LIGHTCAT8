/**
 * Full Payment Flow Testnet Validation
 * 
 * Tests the complete payment journey on Bitcoin testnet:
 * 1. User submits RGB invoice
 * 2. BTCPay creates Lightning invoice
 * 3. User pays Lightning invoice
 * 4. System detects payment
 * 5. RGB tokens are distributed
 * 6. Consignment file is generated
 * 7. User downloads consignment
 */

const { expect } = require('@jest/globals');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Test utilities
const TestPaymentHelper = require('../utils/TestPaymentHelper');
const TestDataGenerator = require('../utils/TestDataGenerator');
const ValidationHelper = require('../utils/ValidationHelper');

// Services under test
const BTCPayService = require('../../../server/services/btcpayService');
const RGBService = require('../../../server/services/rgbService');
const LightningService = require('../../../server/services/lightningService');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  UI_URL: process.env.TEST_UI_URL || 'http://localhost:8082',
  TIMEOUT: 120000, // 2 minutes for full flow
  PAYMENT_TIMEOUT: 90000, // 90 seconds for payment
  BATCH_SIZE: 700,
  BATCH_PRICE_SATS: 2000,
  MAX_RETRIES: 5,
  RETRY_DELAY: 3000
};

describe('Full Payment Flow - Testnet Integration', () => {
  let paymentHelper;
  let testData;
  let validationHelper;

  beforeAll(async () => {
    // Initialize test helpers
    paymentHelper = new TestPaymentHelper({
      baseUrl: TEST_CONFIG.BASE_URL,
      timeout: TEST_CONFIG.TIMEOUT
    });
    
    testData = new TestDataGenerator();
    validationHelper = new ValidationHelper();

    // Verify test environment is ready
    await verifyTestEnvironment();
  });

  afterAll(async () => {
    // Cleanup test data
    await paymentHelper.cleanup();
  });

  describe('Single Batch Purchase Flow', () => {
    test('should complete full payment flow for 1 batch', async () => {
      const testId = `single_batch_${Date.now()}`;
      
      try {
        // Step 1: Generate valid RGB invoice
        const rgbInvoice = testData.generateRGBInvoice();
        console.log(`[${testId}] Generated RGB invoice: ${rgbInvoice.substring(0, 30)}...`);

        // Step 2: Create purchase request
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 1,
          testId: testId
        };

        const createInvoiceResponse = await paymentHelper.createInvoice(purchaseRequest);
        expect(createInvoiceResponse.success).toBe(true);
        expect(createInvoiceResponse.lightningInvoice).toBeDefined();
        expect(createInvoiceResponse.invoiceId).toBeDefined();

        const { lightningInvoice, invoiceId, paymentHash } = createInvoiceResponse;
        console.log(`[${testId}] Lightning invoice created: ${invoiceId}`);

        // Step 3: Validate Lightning invoice
        const invoiceValidation = await validationHelper.validateLightningInvoice(lightningInvoice);
        expect(invoiceValidation.valid).toBe(true);
        expect(invoiceValidation.amount).toBe(TEST_CONFIG.BATCH_PRICE_SATS);

        // Step 4: Simulate payment (using testnet Lightning payment)
        const paymentResult = await paymentHelper.payLightningInvoice(lightningInvoice, {
          testId: testId,
          maxWaitTime: TEST_CONFIG.PAYMENT_TIMEOUT
        });

        expect(paymentResult.paid).toBe(true);
        expect(paymentResult.preimage).toBeDefined();
        console.log(`[${testId}] Payment completed: ${paymentResult.transactionHash}`);

        // Step 5: Wait for payment detection
        const paymentDetected = await paymentHelper.waitForPaymentDetection(invoiceId, {
          timeout: 60000,
          pollInterval: 2000
        });

        expect(paymentDetected.status).toBe('paid');
        expect(paymentDetected.amount).toBe(TEST_CONFIG.BATCH_PRICE_SATS);

        // Step 6: Verify token distribution
        const distributionResult = await paymentHelper.waitForTokenDistribution(invoiceId, {
          expectedTokens: TEST_CONFIG.BATCH_SIZE,
          timeout: 30000
        });

        expect(distributionResult.tokensDistributed).toBe(TEST_CONFIG.BATCH_SIZE);
        expect(distributionResult.consignmentGenerated).toBe(true);

        // Step 7: Download and validate consignment
        const consignmentData = await paymentHelper.downloadConsignment(invoiceId);
        expect(consignmentData).toBeDefined();
        expect(consignmentData.length).toBeGreaterThan(100); // Valid consignment should be substantial

        const consignmentValidation = await validationHelper.validateConsignment(consignmentData, {
          expectedAmount: TEST_CONFIG.BATCH_SIZE,
          expectedRecipient: rgbInvoice
        });

        expect(consignmentValidation.valid).toBe(true);
        expect(consignmentValidation.amount).toBe(TEST_CONFIG.BATCH_SIZE);

        // Step 8: Verify database consistency
        const dbValidation = await validationHelper.validateDatabaseConsistency(invoiceId);
        expect(dbValidation.paymentRecorded).toBe(true);
        expect(dbValidation.tokensDeducted).toBe(TEST_CONFIG.BATCH_SIZE);
        expect(dbValidation.consignmentStored).toBe(true);

        console.log(`[${testId}] Full payment flow completed successfully`);

      } catch (error) {
        console.error(`[${testId}] Payment flow failed:`, error);
        
        // Log detailed error information for debugging
        await logTestFailure(testId, error, {
          rgbInvoice,
          purchaseRequest,
          currentStep: error.currentStep || 'unknown'
        });
        
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT);

    test('should complete full payment flow for maximum batches (10)', async () => {
      const testId = `max_batch_${Date.now()}`;
      
      try {
        // Generate RGB invoice
        const rgbInvoice = testData.generateRGBInvoice();
        
        // Create purchase for maximum batches
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 10,
          testId: testId
        };

        const expectedTokens = TEST_CONFIG.BATCH_SIZE * 10;
        const expectedAmount = TEST_CONFIG.BATCH_PRICE_SATS * 10;

        // Create invoice
        const createInvoiceResponse = await paymentHelper.createInvoice(purchaseRequest);
        expect(createInvoiceResponse.success).toBe(true);

        const { lightningInvoice, invoiceId } = createInvoiceResponse;

        // Validate invoice amount
        const invoiceValidation = await validationHelper.validateLightningInvoice(lightningInvoice);
        expect(invoiceValidation.amount).toBe(expectedAmount);

        // Pay invoice
        const paymentResult = await paymentHelper.payLightningInvoice(lightningInvoice, {
          testId: testId,
          amount: expectedAmount
        });
        expect(paymentResult.paid).toBe(true);

        // Wait for payment detection and token distribution
        await paymentHelper.waitForPaymentDetection(invoiceId);
        const distributionResult = await paymentHelper.waitForTokenDistribution(invoiceId, {
          expectedTokens: expectedTokens,
          timeout: 45000 // Larger batches may take longer
        });

        expect(distributionResult.tokensDistributed).toBe(expectedTokens);

        // Validate consignment for large batch
        const consignmentData = await paymentHelper.downloadConsignment(invoiceId);
        const consignmentValidation = await validationHelper.validateConsignment(consignmentData, {
          expectedAmount: expectedTokens,
          expectedRecipient: rgbInvoice
        });

        expect(consignmentValidation.valid).toBe(true);
        expect(consignmentValidation.amount).toBe(expectedTokens);

        console.log(`[${testId}] Maximum batch payment flow completed successfully`);

      } catch (error) {
        console.error(`[${testId}] Maximum batch payment flow failed:`, error);
        await logTestFailure(testId, error);
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT * 2); // Double timeout for large batches
  });

  describe('Multiple Concurrent Payments', () => {
    test('should handle 5 concurrent payments without conflicts', async () => {
      const testId = `concurrent_5_${Date.now()}`;
      const concurrentCount = 5;
      
      try {
        console.log(`[${testId}] Starting ${concurrentCount} concurrent payments`);

        // Create concurrent payment promises
        const paymentPromises = Array.from({ length: concurrentCount }, (_, index) => {
          return executeConcurrentPayment(`${testId}_${index}`, 1);
        });

        // Execute all payments concurrently
        const results = await Promise.allSettled(paymentPromises);

        // Verify all payments succeeded
        const successfulPayments = results.filter(r => r.status === 'fulfilled');
        expect(successfulPayments.length).toBe(concurrentCount);

        // Verify no duplicate token distributions
        const tokenDistributions = results.map(r => r.value?.tokensDistributed || 0);
        const totalTokens = tokenDistributions.reduce((sum, tokens) => sum + tokens, 0);
        expect(totalTokens).toBe(TEST_CONFIG.BATCH_SIZE * concurrentCount);

        // Verify database consistency
        const dbConsistency = await validationHelper.validateOverallDatabaseConsistency();
        expect(dbConsistency.tokenAccountingCorrect).toBe(true);
        expect(dbConsistency.noDoubleSpending).toBe(true);

        console.log(`[${testId}] All ${concurrentCount} concurrent payments completed successfully`);

      } catch (error) {
        console.error(`[${testId}] Concurrent payments test failed:`, error);
        await logTestFailure(testId, error);
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT * 3);
  });

  describe('Payment Validation & Error Handling', () => {
    test('should reject invalid RGB invoices', async () => {
      const invalidInvoices = [
        'invalid-rgb-invoice',
        'rgb:invalid-base64-data',
        'bitcoin:bc1qtest',
        '',
        null,
        'rgb:' + 'x'.repeat(1000) // Too long
      ];

      for (const invalidInvoice of invalidInvoices) {
        const purchaseRequest = {
          rgbInvoice: invalidInvoice,
          batchCount: 1,
          testId: `invalid_${Date.now()}`
        };

        await expect(paymentHelper.createInvoice(purchaseRequest))
          .rejects.toThrow(/invalid.*rgb.*invoice/i);
      }
    });

    test('should handle payment timeout gracefully', async () => {
      const testId = `timeout_${Date.now()}`;
      
      // Create valid invoice but don't pay it
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createInvoiceResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId } = createInvoiceResponse;

      // Wait for timeout (shorter timeout for test)
      const timeoutResult = await paymentHelper.waitForTimeout(invoiceId, 10000);
      expect(timeoutResult.status).toBe('expired');
      expect(timeoutResult.tokensDistributed).toBe(0);

      // Verify no tokens were distributed
      const dbValidation = await validationHelper.validateDatabaseConsistency(invoiceId);
      expect(dbValidation.tokensDeducted).toBe(0);
    });
  });

  // Helper functions
  async function verifyTestEnvironment() {
    // Check API connectivity
    try {
      const healthResponse = await axios.get(`${TEST_CONFIG.BASE_URL}/api/health`);
      expect(healthResponse.status).toBe(200);
    } catch (error) {
      throw new Error(`Test API not accessible: ${error.message}`);
    }

    // Check BTCPay Server connectivity
    const btcpayHealth = await paymentHelper.checkBTCPayHealth();
    expect(btcpayHealth.accessible).toBe(true);

    // Check database connectivity
    const dbHealth = await validationHelper.checkDatabaseHealth();
    expect(dbHealth.connected).toBe(true);

    console.log('Test environment verified successfully');
  }

  async function executeConcurrentPayment(testId, batchCount) {
    const rgbInvoice = testData.generateRGBInvoice();
    const purchaseRequest = {
      rgbInvoice: rgbInvoice,
      batchCount: batchCount,
      testId: testId
    };

    // Create invoice
    const createResponse = await paymentHelper.createInvoice(purchaseRequest);
    const { lightningInvoice, invoiceId } = createResponse;

    // Pay invoice
    await paymentHelper.payLightningInvoice(lightningInvoice, { testId });

    // Wait for completion
    await paymentHelper.waitForPaymentDetection(invoiceId);
    const distributionResult = await paymentHelper.waitForTokenDistribution(invoiceId, {
      expectedTokens: TEST_CONFIG.BATCH_SIZE * batchCount
    });

    return distributionResult;
  }

  async function logTestFailure(testId, error, context = {}) {
    const logDir = path.join(__dirname, '..', 'logs');
    await fs.mkdir(logDir, { recursive: true });

    const logFile = path.join(logDir, `failure_${testId}.json`);
    const logData = {
      testId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      },
      context,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        baseUrl: TEST_CONFIG.BASE_URL
      }
    };

    await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
    console.log(`Test failure logged to: ${logFile}`);
  }
});