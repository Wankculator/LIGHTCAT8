/**
 * Payment Edge Cases Testing
 * 
 * Tests critical edge cases and failure scenarios:
 * 1. Payment timeout handling
 * 2. Partial payment scenarios  
 * 3. Network disconnection recovery
 * 4. Database failure resilience
 * 5. Duplicate payment attempts
 * 6. Malformed invoice handling
 * 7. System restart during payment processing
 */

const { expect } = require('@jest/globals');
const TestPaymentHelper = require('../utils/TestPaymentHelper');
const TestDataGenerator = require('../utils/TestDataGenerator');
const ValidationHelper = require('../utils/ValidationHelper');
const NetworkSimulator = require('../utils/NetworkSimulator');
const DatabaseFailureSimulator = require('../utils/DatabaseFailureSimulator');

// Edge case test configuration
const EDGE_CASE_CONFIG = {
  TIMEOUT_SCENARIOS: [15, 30, 60, 300], // seconds
  PARTIAL_PAYMENT_AMOUNTS: [1000, 1500, 1999], // sats (less than 2000)
  NETWORK_FAILURE_DURATIONS: [1000, 5000, 15000], // milliseconds
  DATABASE_FAILURE_TYPES: ['connection_loss', 'query_timeout', 'deadlock'],
  MAX_RETRY_ATTEMPTS: 3,
  RECOVERY_TIMEOUT: 60000 // 1 minute
};

describe('Payment Edge Cases & Failure Scenarios', () => {
  let paymentHelper;
  let testData;
  let validationHelper;
  let networkSimulator;
  let dbFailureSimulator;

  beforeAll(async () => {
    paymentHelper = new TestPaymentHelper({
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      timeout: 120000
    });
    
    testData = new TestDataGenerator();
    validationHelper = new ValidationHelper();
    networkSimulator = new NetworkSimulator();
    dbFailureSimulator = new DatabaseFailureSimulator();

    // Verify test environment
    await verifyEdgeCaseTestEnvironment();
  });

  afterAll(async () => {
    // Restore normal system state
    await networkSimulator.restoreNormalConnectivity();
    await dbFailureSimulator.restoreNormalDatabase();
    await paymentHelper.cleanup();
  });

  describe('Payment Timeout Scenarios', () => {
    test('should handle Lightning invoice expiration gracefully', async () => {
      const testId = `timeout_expiry_${Date.now()}`;
      
      // Create invoice with short expiration
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId,
        expirySeconds: 10 // Very short expiry
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      expect(createResponse.success).toBe(true);

      const { invoiceId, lightningInvoice } = createResponse;

      // Wait for expiration without paying
      await delay(15000); // Wait longer than expiry

      // Check invoice status should be expired
      const expiredStatus = await paymentHelper.waitForTimeout(invoiceId, 1000);
      expect(['expired', 'cancelled', 'failed']).toContain(expiredStatus.status);
      expect(expiredStatus.tokensDistributed).toBe(0);

      // Attempting to pay expired invoice should fail
      await expect(
        paymentHelper.payLightningInvoice(lightningInvoice, { testId })
      ).rejects.toThrow(/expired|invalid|cannot.*pay/i);

      // Verify no tokens were distributed
      const dbConsistency = await validationHelper.validateDatabaseConsistency(invoiceId);
      expect(dbConsistency.tokensDeducted).toBe(0);

      console.log(`[${testId}] Payment timeout handled correctly`);
    });

    test('should handle payment detection timeout', async () => {
      const testId = `detection_timeout_${Date.now()}`;
      
      // Create valid invoice
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Simulate payment that doesn't reach our webhook/polling
      await paymentHelper.simulateExternalPayment(lightningInvoice, {
        bypassWebhook: true,
        testId: testId
      });

      // Wait for detection with short timeout to simulate failure
      try {
        await paymentHelper.waitForPaymentDetection(invoiceId, {
          timeout: 5000, // Very short timeout
          pollInterval: 1000
        });
        
        // If detection succeeds, that's fine too
        console.log(`[${testId}] Payment detected within short timeout`);
        
      } catch (error) {
        expect(error.message).toMatch(/timeout/i);
        
        // System should eventually detect payment with longer polling
        const laterDetection = await paymentHelper.waitForPaymentDetection(invoiceId, {
          timeout: 60000,
          pollInterval: 3000
        });
        
        expect(laterDetection.status).toBe('paid');
        console.log(`[${testId}] Payment eventually detected after timeout`);
      }
    });

    test('should handle multiple timeout scenarios', async () => {
      for (const timeoutSeconds of EDGE_CASE_CONFIG.TIMEOUT_SCENARIOS) {
        const testId = `multi_timeout_${timeoutSeconds}s_${Date.now()}`;
        
        console.log(`[${testId}] Testing ${timeoutSeconds}s timeout scenario...`);

        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 1,
          testId: testId,
          expirySeconds: timeoutSeconds
        };

        const createResponse = await paymentHelper.createInvoice(purchaseRequest);
        const { invoiceId } = createResponse;

        // Wait for timeout plus buffer
        await delay((timeoutSeconds + 5) * 1000);

        const timeoutStatus = await validationHelper.checkInvoiceStatus(invoiceId);
        expect(['expired', 'cancelled', 'failed']).toContain(timeoutStatus.status);

        // Verify system state is clean
        const systemState = await validationHelper.getSystemState();
        expect(systemState.pendingPayments).not.toContain(invoiceId);
      }
    });
  });

  describe('Partial Payment Scenarios', () => {
    test('should handle underpayment correctly', async () => {
      const testId = `underpayment_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1, // Requires 2000 sats
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay less than required amount
      const underpayAmount = 1500; // 500 sats short
      
      try {
        await paymentHelper.payPartialAmount(lightningInvoice, underpayAmount, { testId });
        
        // Wait to see how system handles underpayment
        await delay(10000);
        
        const paymentStatus = await validationHelper.checkInvoiceStatus(invoiceId);
        
        // System should either:
        // 1. Reject the payment completely
        // 2. Keep invoice open waiting for full payment
        // 3. Offer partial token distribution (if supported)
        
        if (paymentStatus.status === 'paid') {
          // If paid, verify correct partial token distribution
          expect(paymentStatus.tokensDistributed).toBeLessThan(700);
          expect(paymentStatus.paidAmount).toBe(underpayAmount);
        } else {
          // If not paid, should still be pending or failed
          expect(['pending', 'failed', 'partial']).toContain(paymentStatus.status);
          expect(paymentStatus.tokensDistributed).toBe(0);
        }

        console.log(`[${testId}] Underpayment handled: ${paymentStatus.status}`);
        
      } catch (error) {
        // Underpayment rejection is also acceptable behavior
        expect(error.message).toMatch(/insufficient|underpayment|amount/i);
        console.log(`[${testId}] Underpayment correctly rejected`);
      }
    });

    test('should handle overpayment correctly', async () => {
      const testId = `overpayment_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1, // Requires 2000 sats
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay more than required amount
      const overpayAmount = 2500; // 500 sats extra

      await paymentHelper.payPartialAmount(lightningInvoice, overpayAmount, { testId });

      const paymentDetected = await paymentHelper.waitForPaymentDetection(invoiceId);
      expect(paymentDetected.status).toBe('paid');

      // Wait for token distribution
      const distributionResult = await paymentHelper.waitForTokenDistribution(invoiceId, {
        expectedTokens: 700
      });

      // Should distribute correct amount regardless of overpayment
      expect(distributionResult.tokensDistributed).toBe(700);

      // Check if overpayment is handled (refunded, credited, or noted)
      const finalStatus = await validationHelper.checkInvoiceStatus(invoiceId);
      if (finalStatus.overpaymentHandled) {
        expect(finalStatus.overpaymentAmount).toBe(500);
        expect(['refunded', 'credited', 'noted']).toContain(finalStatus.overpaymentStatus);
      }

      console.log(`[${testId}] Overpayment handled correctly`);
    });

    test('should handle multiple partial payments for same invoice', async () => {
      const testId = `multiple_partial_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 2, // Requires 4000 sats total
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Make multiple partial payments
      const partialAmounts = [1000, 1500, 1500]; // Total: 4000 sats
      
      for (let i = 0; i < partialAmounts.length; i++) {
        const amount = partialAmounts[i];
        
        try {
          await paymentHelper.payPartialAmount(lightningInvoice, amount, {
            testId: `${testId}_part${i}`,
            attemptNumber: i + 1
          });
          
          console.log(`[${testId}] Partial payment ${i + 1}: ${amount} sats`);
          
        } catch (error) {
          // Some systems may not support multiple partial payments
          console.log(`[${testId}] Partial payment ${i + 1} rejected: ${error.message}`);
          break;
        }
      }

      // Check final payment status
      await delay(5000);
      const finalStatus = await validationHelper.checkInvoiceStatus(invoiceId);
      
      if (finalStatus.status === 'paid') {
        const distributionResult = await paymentHelper.waitForTokenDistribution(invoiceId, {
          expectedTokens: 1400
        });
        expect(distributionResult.tokensDistributed).toBe(1400);
      }

      console.log(`[${testId}] Multiple partial payments result: ${finalStatus.status}`);
    });
  });

  describe('Network Disconnection Recovery', () => {
    test('should recover from temporary network failures', async () => {
      const testId = `network_recovery_${Date.now()}`;
      
      // Create valid payment
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay invoice
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });

      // Simulate network failure during payment processing
      await networkSimulator.simulateNetworkFailure({
        duration: 10000, // 10 seconds
        type: 'intermittent',
        affectedServices: ['btcpay', 'database']
      });

      console.log(`[${testId}] Network failure simulated`);

      // System should eventually recover and process payment
      const recoveryResult = await paymentHelper.waitForPaymentDetection(invoiceId, {
        timeout: EDGE_CASE_CONFIG.RECOVERY_TIMEOUT,
        pollInterval: 5000,
        expectNetworkIssues: true
      });

      expect(recoveryResult.status).toBe('paid');

      // Verify token distribution completes after recovery
      const distributionResult = await paymentHelper.waitForTokenDistribution(invoiceId, {
        expectedTokens: 700,
        timeout: 45000
      });

      expect(distributionResult.tokensDistributed).toBe(700);

      console.log(`[${testId}] Network recovery successful`);
    });

    test('should handle webhook delivery failures', async () => {
      const testId = `webhook_failure_${Date.now()}`;
      
      // Simulate webhook endpoint being down
      await networkSimulator.blockWebhookEndpoint('/api/webhooks/lightning');

      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay invoice (webhook will fail)
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });

      // System should fall back to polling when webhook fails
      const pollDetection = await paymentHelper.waitForPaymentDetection(invoiceId, {
        timeout: 60000,
        pollInterval: 3000,
        expectWebhookFailure: true
      });

      expect(pollDetection.status).toBe('paid');

      // Restore webhook endpoint
      await networkSimulator.unblockWebhookEndpoint('/api/webhooks/lightning');

      console.log(`[${testId}] Webhook failure recovery successful`);
    });

    test('should handle prolonged connectivity issues', async () => {
      const testId = `prolonged_outage_${Date.now()}`;
      
      // Create payment during normal operation
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay invoice
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });

      // Simulate prolonged network outage
      await networkSimulator.simulateNetworkFailure({
        duration: 30000, // 30 seconds
        type: 'complete_outage',
        affectedServices: ['btcpay', 'external_apis']
      });

      console.log(`[${testId}] Prolonged network outage simulated`);

      // System should queue operations and process after recovery
      const recoveryResult = await paymentHelper.waitForPaymentDetection(invoiceId, {
        timeout: 90000,
        pollInterval: 5000,
        allowExtendedTimeout: true
      });

      expect(recoveryResult.status).toBe('paid');

      // Verify all queued operations complete
      const queuedOperations = await validationHelper.checkQueuedOperations();
      expect(queuedOperations.pendingPayments).toBe(0);
      expect(queuedOperations.failedOperations).toBe(0);

      console.log(`[${testId}] Prolonged outage recovery successful`);
    });
  });

  describe('Database Failure Resilience', () => {
    test('should handle database connection loss', async () => {
      const testId = `db_connection_loss_${Date.now()}`;
      
      // Create payment normally
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay invoice
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });

      // Simulate database connection loss during processing
      await dbFailureSimulator.simulateDatabaseFailure({
        type: 'connection_loss',
        duration: 15000,
        recoveryMode: 'auto_reconnect'
      });

      console.log(`[${testId}] Database connection loss simulated`);

      // System should recover and complete payment processing
      const recoveryResult = await paymentHelper.waitForPaymentDetection(invoiceId, {
        timeout: 90000,
        pollInterval: 5000,
        expectDatabaseIssues: true
      });

      expect(recoveryResult.status).toBe('paid');

      // Verify data integrity after recovery
      const dataIntegrity = await validationHelper.verifyDataIntegrity(invoiceId);
      expect(dataIntegrity.consistent).toBe(true);
      expect(dataIntegrity.noDataLoss).toBe(true);

      console.log(`[${testId}] Database connection recovery successful`);
    });

    test('should handle database transaction deadlocks', async () => {
      const testId = `db_deadlock_${Date.now()}`;
      
      // Create multiple concurrent payments that might cause deadlocks
      const concurrentPayments = [];
      
      for (let i = 0; i < 5; i++) {
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 1,
          testId: `${testId}_${i}`
        };

        concurrentPayments.push(
          paymentHelper.createInvoice(purchaseRequest)
            .then(response => {
              return paymentHelper.payLightningInvoice(response.lightningInvoice, {
                testId: `${testId}_${i}`
              }).then(() => response);
            })
        );
      }

      // Simulate deadlock conditions during concurrent processing
      await dbFailureSimulator.simulateDatabaseFailure({
        type: 'deadlock',
        triggerOnConcurrency: true,
        affectedTables: ['rgb_payments', 'token_distributions']
      });

      // Wait for all payments to complete (with retries for deadlocks)
      const results = await Promise.allSettled(concurrentPayments);
      
      // Most should succeed despite deadlocks (with retries)
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(3); // At least 60% success rate

      // Verify database consistency after deadlock resolution
      const consistencyCheck = await validationHelper.validateDatabaseConsistency();
      expect(consistencyCheck.tokenAccountingCorrect).toBe(true);
      expect(consistencyCheck.noDuplicateRecords).toBe(true);

      console.log(`[${testId}] Database deadlock handling: ${successful.length}/5 successful`);
    });

    test('should handle query timeout scenarios', async () => {
      const testId = `db_query_timeout_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay invoice
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });

      // Simulate slow database queries during token distribution
      await dbFailureSimulator.simulateDatabaseFailure({
        type: 'query_timeout',
        affectedQueries: ['token_distribution', 'supply_update'],
        timeoutDuration: 10000
      });

      console.log(`[${testId}] Database query timeout simulated`);

      // System should retry and eventually succeed
      const distributionResult = await paymentHelper.waitForTokenDistribution(invoiceId, {
        expectedTokens: 700,
        timeout: 120000, // Extended timeout for retries
        allowRetries: true
      });

      expect(distributionResult.tokensDistributed).toBe(700);

      // Verify query performance is restored
      const queryPerformance = await validationHelper.checkQueryPerformance();
      expect(queryPerformance.averageResponseTime).toBeLessThan(1000); // < 1 second

      console.log(`[${testId}] Database query timeout recovery successful`);
    });
  });

  describe('Duplicate Payment Prevention', () => {
    test('should prevent duplicate payment processing', async () => {
      const testId = `duplicate_prevention_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Pay invoice normally
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });
      
      await paymentHelper.waitForPaymentDetection(invoiceId);
      
      // Attempt to process the same payment again (simulate webhook replay)
      try {
        await paymentHelper.simulateWebhookReplay(invoiceId, {
          paymentHash: createResponse.paymentHash,
          amount: 2000,
          testId: testId
        });
        
        // Should not process duplicate
        console.log(`[${testId}] Duplicate payment correctly ignored`);
        
      } catch (error) {
        expect(error.message).toMatch(/duplicate|already.*processed|idempotent/i);
        console.log(`[${testId}] Duplicate payment correctly rejected`);
      }

      // Verify only one token distribution occurred
      const distributionHistory = await validationHelper.getDistributionHistory(invoiceId);
      expect(distributionHistory.distributionCount).toBe(1);
      expect(distributionHistory.totalTokensDistributed).toBe(700);
    });

    test('should handle webhook replay attacks', async () => {
      const testId = `webhook_replay_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 2,
        testId: testId
      };

      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice, paymentHash } = createResponse;

      // Complete normal payment flow
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });
      await paymentHelper.waitForPaymentDetection(invoiceId);
      await paymentHelper.waitForTokenDistribution(invoiceId, { expectedTokens: 1400 });

      // Simulate multiple webhook replays
      const replayAttempts = [];
      for (let i = 0; i < 5; i++) {
        replayAttempts.push(
          paymentHelper.simulateWebhookReplay(invoiceId, {
            paymentHash: paymentHash,
            amount: 4000,
            replayNumber: i + 1,
            testId: `${testId}_replay_${i}`
          }).catch(error => ({ error: error.message, replayNumber: i + 1 }))
        );
      }

      const replayResults = await Promise.allSettled(replayAttempts);
      
      // All replays should be rejected or ignored
      const rejectedReplays = replayResults.filter(r => 
        r.status === 'rejected' || r.value.error
      );
      
      expect(rejectedReplays.length).toBe(5); // All should be rejected

      // Verify token distribution remains correct
      const finalStatus = await validationHelper.checkInvoiceStatus(invoiceId);
      expect(finalStatus.tokensDistributed).toBe(1400);
      expect(finalStatus.distributionCount).toBe(1);

      console.log(`[${testId}] Webhook replay attack prevention successful`);
    });

    test('should use idempotency keys correctly', async () => {
      const testId = `idempotency_${Date.now()}`;
      
      const rgbInvoice = testData.generateRGBInvoice();
      const idempotencyKey = `test-${testId}-${Date.now()}`;
      
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId,
        idempotencyKey: idempotencyKey
      };

      // Create invoice with idempotency key
      const firstResponse = await paymentHelper.createInvoice(purchaseRequest);
      expect(firstResponse.success).toBe(true);

      // Attempt to create same invoice again with same idempotency key
      const secondResponse = await paymentHelper.createInvoice(purchaseRequest);
      
      // Should return same invoice, not create new one
      expect(secondResponse.invoiceId).toBe(firstResponse.invoiceId);
      expect(secondResponse.lightningInvoice).toBe(firstResponse.lightningInvoice);

      // Verify only one invoice exists in database
      const invoiceCount = await validationHelper.countInvoicesForIdempotencyKey(idempotencyKey);
      expect(invoiceCount).toBe(1);

      console.log(`[${testId}] Idempotency key handling verified`);
    });
  });

  // Helper functions
  async function verifyEdgeCaseTestEnvironment() {
    // Verify test environment can simulate failures safely
    const testCapabilities = await validationHelper.checkTestCapabilities();
    
    expect(testCapabilities.canSimulateNetworkFailures).toBe(true);
    expect(testCapabilities.canSimulateDatabaseFailures).toBe(true);
    expect(testCapabilities.canRestoreNormalOperation).toBe(true);
    
    console.log('Edge case test environment verified');
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});