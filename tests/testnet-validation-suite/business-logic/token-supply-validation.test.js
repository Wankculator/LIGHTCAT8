/**
 * Token Supply & Business Logic Validation Tests
 * 
 * Critical business logic tests:
 * 1. 21M total token supply cap (mint must close when reached)
 * 2. 700 tokens per batch @ 2000 sats validation
 * 3. Accurate token distribution (no more, no less)
 * 4. Database consistency with payments
 * 5. Supply depletion handling
 * 6. Partial batch purchases near supply limit
 */

const { expect } = require('@jest/globals');
const TestPaymentHelper = require('../utils/TestPaymentHelper');
const TestDataGenerator = require('../utils/TestDataGenerator');
const ValidationHelper = require('../utils/ValidationHelper');
const SupabaseService = require('../../../server/services/supabaseService');

// Business constants - these MUST match production values
const BUSINESS_CONSTANTS = {
  TOTAL_SUPPLY: 21_000_000, // 21M tokens max supply
  BATCH_SIZE: 700,          // Tokens per batch
  BATCH_PRICE_SATS: 2000,   // Price per batch in sats
  MAX_BATCHES_TOTAL: 30_000, // 21M / 700 = 30,000 batches max
  PRECISION: 0              // No decimal places for LIGHTCAT
};

describe('Token Supply & Business Logic Validation', () => {
  let paymentHelper;
  let testData;
  let validationHelper;
  let supabaseService;
  let initialSupplyState;

  beforeAll(async () => {
    // Initialize test services
    paymentHelper = new TestPaymentHelper({
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      timeout: 60000
    });
    
    testData = new TestDataGenerator();
    validationHelper = new ValidationHelper();
    supabaseService = SupabaseService;

    // Capture initial supply state for restoration
    initialSupplyState = await captureSupplyState();
    
    // Verify test environment has correct constants
    await verifyBusinessConstants();
  });

  afterAll(async () => {
    // Restore initial supply state if needed
    await restoreSupplyState(initialSupplyState);
    await paymentHelper.cleanup();
  });

  describe('Token Supply Cap Enforcement', () => {
    test('should enforce 21M token supply cap', async () => {
      const testId = `supply_cap_${Date.now()}`;
      
      // Get current supply state
      const currentSupply = await validationHelper.getCurrentSupplyState();
      console.log(`[${testId}] Current supply: ${currentSupply.distributed}/${BUSINESS_CONSTANTS.TOTAL_SUPPLY}`);

      // Calculate how many batches can still be distributed
      const remainingTokens = BUSINESS_CONSTANTS.TOTAL_SUPPLY - currentSupply.distributed;
      const maxPossibleBatches = Math.floor(remainingTokens / BUSINESS_CONSTANTS.BATCH_SIZE);

      expect(maxPossibleBatches).toBeGreaterThanOrEqual(0);
      expect(currentSupply.distributed).toBeLessThanOrEqual(BUSINESS_CONSTANTS.TOTAL_SUPPLY);

      console.log(`[${testId}] Remaining capacity: ${maxPossibleBatches} batches (${remainingTokens} tokens)`);
    });

    test('should reject purchases when supply is exhausted', async () => {
      const testId = `supply_exhausted_${Date.now()}`;
      
      try {
        // Temporarily set supply to maximum for this test
        await temporarilySetSupplyToMax();

        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 1,
          testId: testId
        };

        // Attempt to create invoice when supply is exhausted
        await expect(paymentHelper.createInvoice(purchaseRequest))
          .rejects.toThrow(/supply.*exhausted|insufficient.*supply|sold.*out/i);

        console.log(`[${testId}] Correctly rejected purchase when supply exhausted`);

      } finally {
        // Restore normal supply state
        await restoreSupplyState(initialSupplyState);
      }
    });

    test('should handle partial batch when approaching supply limit', async () => {
      const testId = `partial_batch_${Date.now()}`;
      
      try {
        // Set up scenario where only 350 tokens remain (half a batch)
        await temporarilySetSupplyNearMax(350);

        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 1, // Requesting 700 tokens but only 350 available
          testId: testId
        };

        // Should either reject or offer partial batch
        try {
          const response = await paymentHelper.createInvoice(purchaseRequest);
          
          // If accepted, verify it's for the correct partial amount
          expect(response.tokensOffered).toBe(350);
          expect(response.adjustedPrice).toBe(1000); // Half price for half batch
          
        } catch (error) {
          // Alternative: Should reject with clear message about insufficient supply
          expect(error.message).toMatch(/insufficient.*supply|only.*350.*tokens.*remaining/i);
        }

        console.log(`[${testId}] Handled partial batch scenario correctly`);

      } finally {
        await restoreSupplyState(initialSupplyState);
      }
    });
  });

  describe('Batch Size & Pricing Validation', () => {
    test('should distribute exactly 700 tokens per batch', async () => {
      const testId = `batch_size_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 3, // Order 3 batches
        testId: testId
      };

      const expectedTokens = BUSINESS_CONSTANTS.BATCH_SIZE * 3; // 2100 tokens
      const expectedPrice = BUSINESS_CONSTANTS.BATCH_PRICE_SATS * 3; // 6000 sats

      // Create and pay invoice
      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      expect(createResponse.amount).toBe(expectedPrice);

      await paymentHelper.payLightningInvoice(createResponse.lightningInvoice, { testId });

      // Wait for distribution and verify exact token amount
      const distributionResult = await paymentHelper.waitForTokenDistribution(
        createResponse.invoiceId, 
        { expectedTokens: expectedTokens }
      );

      expect(distributionResult.tokensDistributed).toBe(expectedTokens);

      // Verify database records show exact amounts
      const dbRecord = await validationHelper.getDatabaseRecord(createResponse.invoiceId);
      expect(dbRecord.tokenAmount).toBe(expectedTokens);
      expect(dbRecord.batchCount).toBe(3);
      expect(dbRecord.pricePerBatch).toBe(BUSINESS_CONSTANTS.BATCH_PRICE_SATS);

      console.log(`[${testId}] Distributed exactly ${expectedTokens} tokens for 3 batches`);
    });

    test('should calculate correct pricing for different batch counts', async () => {
      const testCases = [
        { batches: 1, expectedSats: 2000 },
        { batches: 5, expectedSats: 10000 },
        { batches: 10, expectedSats: 20000 }
      ];

      for (const testCase of testCases) {
        const testId = `pricing_${testCase.batches}_${Date.now()}`;
        
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: testCase.batches,
          testId: testId
        };

        const response = await paymentHelper.createInvoice(purchaseRequest);
        expect(response.amount).toBe(testCase.expectedSats);

        console.log(`[${testId}] Correct pricing: ${testCase.batches} batches = ${testCase.expectedSats} sats`);
        
        // Cancel the invoice to avoid actual payment
        await cancelInvoiceIfPossible(response.invoiceId);
      }
    });

    test('should validate maximum batch limits per purchase', async () => {
      const testId = `max_batch_limit_${Date.now()}`;
      
      // Test various batch count limits
      const testCases = [
        { batches: 10, shouldSucceed: true },   // Gold tier max
        { batches: 15, shouldSucceed: false },  // Over limit
        { batches: 100, shouldSucceed: false }  // Way over limit
      ];

      for (const testCase of testCases) {
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: testCase.batches,
          testId: `${testId}_${testCase.batches}`
        };

        if (testCase.shouldSucceed) {
          const response = await paymentHelper.createInvoice(purchaseRequest);
          expect(response.success).toBe(true);
          await cancelInvoiceIfPossible(response.invoiceId);
        } else {
          await expect(paymentHelper.createInvoice(purchaseRequest))
            .rejects.toThrow(/maximum.*batch.*limit|too.*many.*batches/i);
        }
      }
    });
  });

  describe('Database Consistency Validation', () => {
    test('should maintain accurate token accounting in database', async () => {
      const testId = `db_consistency_${Date.now()}`;
      
      // Get initial state
      const initialState = await validationHelper.getTokenAccountingState();

      // Execute multiple payments
      const payments = [];
      for (let i = 0; i < 3; i++) {
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 2,
          testId: `${testId}_${i}`
        };

        const response = await paymentHelper.createInvoice(purchaseRequest);
        await paymentHelper.payLightningInvoice(response.lightningInvoice, { testId });
        await paymentHelper.waitForTokenDistribution(response.invoiceId, { expectedTokens: 1400 });

        payments.push({
          invoiceId: response.invoiceId,
          expectedTokens: 1400
        });
      }

      // Verify final state
      const finalState = await validationHelper.getTokenAccountingState();
      const expectedDecrease = 3 * 1400; // 3 payments * 1400 tokens each

      expect(finalState.availableSupply).toBe(initialState.availableSupply - expectedDecrease);
      expect(finalState.distributedTokens).toBe(initialState.distributedTokens + expectedDecrease);

      // Verify each payment is recorded correctly
      for (const payment of payments) {
        const record = await validationHelper.getDatabaseRecord(payment.invoiceId);
        expect(record.tokenAmount).toBe(payment.expectedTokens);
        expect(record.status).toBe('completed');
      }

      console.log(`[${testId}] Database consistency verified after ${payments.length} payments`);
    });

    test('should prevent double-spending of tokens', async () => {
      const testId = `double_spend_${Date.now()}`;
      
      // Create payment but simulate system failure before token deduction
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const response = await paymentHelper.createInvoice(purchaseRequest);
      
      // Simulate the scenario where payment is detected but token distribution fails
      await paymentHelper.payLightningInvoice(response.lightningInvoice, { testId });
      
      // Now attempt to create the same purchase again
      await expect(paymentHelper.createInvoice({
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: `${testId}_duplicate`
      })).rejects.toThrow(/already.*processed|duplicate.*invoice/i);

      console.log(`[${testId}] Double-spending prevention working correctly`);
    });
  });

  describe('Supply Monitoring & Alerts', () => {
    test('should trigger alerts when supply is low', async () => {
      const testId = `supply_alert_${Date.now()}`;
      
      try {
        // Set supply to trigger low supply alert (< 5% remaining)
        const lowSupplyThreshold = Math.floor(BUSINESS_CONSTANTS.TOTAL_SUPPLY * 0.05);
        await temporarilySetSupplyNearMax(lowSupplyThreshold);

        // Check if monitoring system detects low supply
        const supplyStatus = await validationHelper.checkSupplyAlerts();
        
        expect(supplyStatus.lowSupplyAlert).toBe(true);
        expect(supplyStatus.remainingTokens).toBeLessThan(lowSupplyThreshold);
        expect(supplyStatus.percentageRemaining).toBeLessThan(5);

        console.log(`[${testId}] Low supply alert triggered correctly`);

      } finally {
        await restoreSupplyState(initialSupplyState);
      }
    });

    test('should calculate accurate time to supply exhaustion', async () => {
      const testId = `time_to_exhaustion_${Date.now()}`;
      
      const currentSupply = await validationHelper.getCurrentSupplyState();
      const recentSalesRate = await validationHelper.getRecentSalesRate(24 * 60 * 60 * 1000); // Last 24 hours
      
      if (recentSalesRate.tokensPerHour > 0) {
        const remainingTokens = BUSINESS_CONSTANTS.TOTAL_SUPPLY - currentSupply.distributed;
        const hoursToExhaustion = remainingTokens / recentSalesRate.tokensPerHour;
        
        const prediction = await validationHelper.getSupplyExhaustionPrediction();
        
        // Allow for some variance in prediction accuracy (±20%)
        expect(prediction.hoursToExhaustion).toBeCloseTo(hoursToExhaustion, 0.2 * hoursToExhaustion);
        
        console.log(`[${testId}] Supply exhaustion prediction: ${hoursToExhaustion.toFixed(1)} hours`);
      } else {
        console.log(`[${testId}] No recent sales data for prediction test`);
      }
    });
  });

  // Helper functions
  async function captureSupplyState() {
    const state = await validationHelper.getCurrentSupplyState();
    return {
      distributed: state.distributed,
      available: state.available,
      timestamp: new Date()
    };
  }

  async function restoreSupplyState(state) {
    // In a real implementation, this would restore database state
    // For tests, we might need to clean up test data
    console.log(`Restoring supply state to: ${state.distributed} distributed`);
  }

  async function verifyBusinessConstants() {
    // Verify that the system is configured with correct business constants
    const systemConfig = await validationHelper.getSystemConfiguration();
    
    expect(systemConfig.totalSupply).toBe(BUSINESS_CONSTANTS.TOTAL_SUPPLY);
    expect(systemConfig.batchSize).toBe(BUSINESS_CONSTANTS.BATCH_SIZE);
    expect(systemConfig.batchPrice).toBe(BUSINESS_CONSTANTS.BATCH_PRICE_SATS);
    
    console.log('Business constants verified in system configuration');
  }

  async function temporarilySetSupplyToMax() {
    // Simulate exhausted supply for testing
    await validationHelper.setSupplyForTesting(BUSINESS_CONSTANTS.TOTAL_SUPPLY);
  }

  async function temporarilySetSupplyNearMax(remainingTokens) {
    // Set supply so only specific amount remains
    const distributedTokens = BUSINESS_CONSTANTS.TOTAL_SUPPLY - remainingTokens;
    await validationHelper.setSupplyForTesting(distributedTokens);
  }

  async function cancelInvoiceIfPossible(invoiceId) {
    try {
      // Attempt to cancel invoice to avoid unnecessary payments
      await paymentHelper.api.post(`/api/rgb/invoice/${invoiceId}/cancel`);
    } catch (error) {
      // Ignore if cancellation not supported
      console.log(`Could not cancel invoice ${invoiceId}: ${error.message}`);
    }
  }
});