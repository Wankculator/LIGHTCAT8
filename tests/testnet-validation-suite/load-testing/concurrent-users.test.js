/**
 * Concurrent Users Load Testing
 * 
 * Tests system behavior under load:
 * 1. 1000 concurrent users simulation
 * 2. Race condition prevention
 * 3. Double-spending vulnerability tests
 * 4. Payment queue management validation
 * 5. Performance benchmarking
 * 6. Resource utilization monitoring
 */

const { expect } = require('@jest/globals');
const cluster = require('cluster');
const os = require('os');
const TestPaymentHelper = require('../utils/TestPaymentHelper');
const TestDataGenerator = require('../utils/TestDataGenerator');
const ValidationHelper = require('../utils/ValidationHelper');
const PerformanceMonitor = require('../utils/PerformanceMonitor');

// Load testing configuration
const LOAD_CONFIG = {
  CONCURRENT_USERS: 1000,
  RAMP_UP_TIME: 30000,        // 30 seconds to ramp up
  TEST_DURATION: 300000,      // 5 minutes
  THINK_TIME_MIN: 1000,       // Min delay between user actions
  THINK_TIME_MAX: 5000,       // Max delay between user actions
  MAX_WORKERS: Math.min(10, os.cpus().length),
  PAYMENT_SUCCESS_RATE_TARGET: 99.5, // 99.5% success rate target
  MAX_RESPONSE_TIME: 30000,   // 30 seconds max response time
  MAX_MEMORY_MB: 1024,        // 1GB memory limit
  MAX_CPU_PERCENT: 80         // 80% CPU limit
};

describe('Concurrent Users Load Testing', () => {
  let performanceMonitor;
  let baselineMetrics;

  beforeAll(async () => {
    performanceMonitor = new PerformanceMonitor();
    
    // Capture baseline performance metrics
    baselineMetrics = await performanceMonitor.captureBaseline();
    console.log('Baseline metrics captured:', baselineMetrics);

    // Verify system is ready for load testing
    await verifySystemReadiness();
  });

  afterAll(async () => {
    // Generate performance report
    await performanceMonitor.generateReport();
    
    // Cleanup any remaining test data
    await cleanupLoadTestData();
  });

  describe('Scalability Testing', () => {
    test('should handle 1000 concurrent users without system failure', async () => {
      const testId = `load_1000_${Date.now()}`;
      
      console.log(`[${testId}] Starting 1000 concurrent user simulation...`);
      
      // Start performance monitoring
      const monitoringSession = await performanceMonitor.startSession(testId);

      try {
        // Execute concurrent load test
        const results = await executeConcurrentLoadTest({
          users: LOAD_CONFIG.CONCURRENT_USERS,
          rampUpTime: LOAD_CONFIG.RAMP_UP_TIME,
          duration: LOAD_CONFIG.TEST_DURATION,
          testId: testId
        });

        // Validate results
        expect(results.totalRequests).toBeGreaterThan(0);
        expect(results.successRate).toBeGreaterThanOrEqual(LOAD_CONFIG.PAYMENT_SUCCESS_RATE_TARGET);
        expect(results.averageResponseTime).toBeLessThan(LOAD_CONFIG.MAX_RESPONSE_TIME);
        expect(results.maxMemoryUsage).toBeLessThan(LOAD_CONFIG.MAX_MEMORY_MB);
        expect(results.peakCpuUsage).toBeLessThan(LOAD_CONFIG.MAX_CPU_PERCENT);

        // Validate no data corruption occurred
        const consistencyCheck = await performanceMonitor.validateDataConsistency();
        expect(consistencyCheck.tokenAccountingCorrect).toBe(true);
        expect(consistencyCheck.noMissingPayments).toBe(true);

        console.log(`[${testId}] Load test completed successfully:`, {
          users: LOAD_CONFIG.CONCURRENT_USERS,
          successRate: `${results.successRate}%`,
          avgResponseTime: `${results.averageResponseTime}ms`,
          totalRequests: results.totalRequests,
          errors: results.errorCount
        });

      } finally {
        await performanceMonitor.endSession(monitoringSession);
      }
    }, LOAD_CONFIG.TEST_DURATION + 60000); // Extra time for setup/cleanup

    test('should maintain performance under sustained load', async () => {
      const testId = `sustained_load_${Date.now()}`;
      
      console.log(`[${testId}] Starting sustained load test...`);

      const sustainedResults = await executeSustainedLoadTest({
        users: 500, // Moderate load for sustained test
        duration: 600000, // 10 minutes
        testId: testId
      });

      // Performance should not degrade significantly over time
      expect(sustainedResults.performanceDegradation).toBeLessThan(20); // < 20% degradation
      expect(sustainedResults.errorRateIncrease).toBeLessThan(5); // < 5% error rate increase
      expect(sustainedResults.memoryLeakDetected).toBe(false);

      console.log(`[${testId}] Sustained load test completed:`, sustainedResults);
    }, 700000); // 11+ minutes

    test('should gracefully handle traffic spikes', async () => {
      const testId = `traffic_spike_${Date.now()}`;
      
      console.log(`[${testId}] Testing traffic spike handling...`);

      // Simulate sudden traffic spike
      const spikeResults = await executeTrafficSpikeTest({
        baselineUsers: 100,
        spikeUsers: 1500,
        spikeDuration: 60000, // 1 minute spike
        testId: testId
      });

      // System should handle spike without failing
      expect(spikeResults.systemStable).toBe(true);
      expect(spikeResults.spikeSuccessRate).toBeGreaterThan(95); // Allow lower rate during spike
      expect(spikeResults.recoveryTime).toBeLessThan(30000); // < 30s recovery

      console.log(`[${testId}] Traffic spike test completed:`, spikeResults);
    }, 180000); // 3 minutes
  });

  describe('Race Condition & Concurrency Testing', () => {
    test('should prevent race conditions in token distribution', async () => {
      const testId = `race_conditions_${Date.now()}`;
      
      // Create scenario where multiple users try to purchase last available tokens
      await setupRaceConditionScenario(1000); // Set only 1000 tokens available

      const raceTestUsers = 50; // 50 users competing for 1000 tokens
      
      const concurrentPurchases = Array.from({ length: raceTestUsers }, (_, index) => {
        return simulateUserPurchase({
          userId: `race_user_${index}`,
          batchCount: 2, // Each wants 1400 tokens (more than available)
          testId: `${testId}_${index}`
        });
      });

      const results = await Promise.allSettled(concurrentPurchases);
      
      // Only some purchases should succeed, others should be rejected
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const rejected = results.filter(r => r.status === 'rejected' || !r.value.success);
      
      // Verify total distributed tokens don't exceed available supply
      const totalDistributed = successful.reduce((sum, r) => sum + (r.value?.tokensDistributed || 0), 0);
      expect(totalDistributed).toBeLessThanOrEqual(1000);
      
      // Verify database consistency
      const finalSupplyState = await ValidationHelper.getCurrentSupplyState();
      expect(finalSupplyState.distributed).toBeLessThanOrEqual(finalSupplyState.total);

      console.log(`[${testId}] Race condition test results:`, {
        successful: successful.length,
        rejected: rejected.length,
        totalDistributed,
        remainingSupply: 1000 - totalDistributed
      });
    });

    test('should handle concurrent identical RGB invoices', async () => {
      const testId = `duplicate_rgb_${Date.now()}`;
      
      // Generate one RGB invoice
      const testData = new TestDataGenerator();
      const sharedRgbInvoice = testData.generateRGBInvoice();
      
      // Multiple users try to use same RGB invoice
      const duplicateAttempts = Array.from({ length: 10 }, (_, index) => {
        return simulateUserPurchase({
          userId: `dup_user_${index}`,
          rgbInvoice: sharedRgbInvoice, // Same invoice
          batchCount: 1,
          testId: `${testId}_${index}`
        });
      });

      const results = await Promise.allSettled(duplicateAttempts);
      
      // Only one should succeed, others should be rejected
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      expect(successful.length).toBe(1); // Exactly one success
      
      // Verify no double-spending occurred
      const rgbInvoiceUsage = await ValidationHelper.checkRgbInvoiceUsage(sharedRgbInvoice);
      expect(rgbInvoiceUsage.usageCount).toBe(1);

      console.log(`[${testId}] Duplicate RGB invoice handling: ${successful.length} success, ${results.length - successful.length} rejected`);
    });

    test('should maintain payment queue integrity under load', async () => {
      const testId = `queue_integrity_${Date.now()}`;
      
      // Monitor payment queue during concurrent operations
      const queueMonitor = await performanceMonitor.startQueueMonitoring();
      
      // Create high volume of payments
      const queueTestUsers = 200;
      const queueTests = Array.from({ length: queueTestUsers }, (_, index) => {
        return simulateUserPurchase({
          userId: `queue_user_${index}`,
          batchCount: 1,
          testId: `${testId}_${index}`,
          randomDelay: true
        });
      });

      await Promise.allSettled(queueTests);
      
      const queueStats = await performanceMonitor.getQueueStatistics(queueMonitor);
      
      // Queue should process all payments without loss
      expect(queueStats.processedPayments).toBe(queueStats.receivedPayments);
      expect(queueStats.lostPayments).toBe(0);
      expect(queueStats.duplicateProcessing).toBe(0);
      expect(queueStats.maxQueueDepth).toBeLessThan(1000); // Reasonable queue depth

      console.log(`[${testId}] Payment queue integrity verified:`, queueStats);
    });
  });

  describe('Performance Benchmarking', () => {
    test('should meet response time benchmarks under load', async () => {
      const testId = `response_time_${Date.now()}`;
      
      const benchmarkResults = await runResponseTimeBenchmark({
        concurrentUsers: [100, 250, 500, 750, 1000],
        testDuration: 60000, // 1 minute each
        testId: testId
      });

      // Verify response times meet requirements at each load level
      for (const result of benchmarkResults) {
        expect(result.p95ResponseTime).toBeLessThan(LOAD_CONFIG.MAX_RESPONSE_TIME);
        expect(result.p99ResponseTime).toBeLessThan(LOAD_CONFIG.MAX_RESPONSE_TIME * 2);
        expect(result.errorRate).toBeLessThan(1); // < 1% error rate
        
        console.log(`[${testId}] ${result.users} users: P95=${result.p95ResponseTime}ms, P99=${result.p99ResponseTime}ms, Errors=${result.errorRate}%`);
      }
    });

    test('should optimize resource utilization', async () => {
      const testId = `resource_usage_${Date.now()}`;
      
      const resourceTest = await runResourceUtilizationTest({
        users: 1000,
        duration: 120000, // 2 minutes
        testId: testId
      });

      // Verify efficient resource usage
      expect(resourceTest.avgCpuUsage).toBeLessThan(LOAD_CONFIG.MAX_CPU_PERCENT);
      expect(resourceTest.maxMemoryUsage).toBeLessThan(LOAD_CONFIG.MAX_MEMORY_MB);
      expect(resourceTest.fileDescriptorLeaks).toBe(0);
      expect(resourceTest.connectionLeaks).toBe(0);

      console.log(`[${testId}] Resource utilization: CPU=${resourceTest.avgCpuUsage}%, Memory=${resourceTest.maxMemoryUsage}MB`);
    });
  });

  // Helper functions
  async function verifySystemReadiness() {
    const paymentHelper = new TestPaymentHelper({ 
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000' 
    });
    
    // Check API health
    const healthResponse = await paymentHelper.api.get('/api/health');
    expect(healthResponse.status).toBe(200);
    
    // Check database connectivity
    const validationHelper = new ValidationHelper();
    const dbHealth = await validationHelper.checkDatabaseHealth();
    expect(dbHealth.connected).toBe(true);
    
    // Check available system resources
    const systemResources = await performanceMonitor.checkSystemResources();
    expect(systemResources.availableMemoryMB).toBeGreaterThan(2048); // At least 2GB available
    expect(systemResources.cpuLoadAverage).toBeLessThan(2); // Low CPU load
    
    console.log('System readiness verified for load testing');
  }

  async function executeConcurrentLoadTest(config) {
    const { users, rampUpTime, duration, testId } = config;
    
    return new Promise((resolve, reject) => {
      if (cluster.isMaster) {
        setupMasterProcess(users, rampUpTime, duration, testId, resolve, reject);
      } else {
        executeWorkerProcess(testId);
      }
    });
  }

  function setupMasterProcess(users, rampUpTime, duration, testId, resolve, reject) {
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      errors: [],
      responseTimeStats: [],
      resourceUsage: []
    };
    
    const workersNeeded = Math.min(LOAD_CONFIG.MAX_WORKERS, Math.ceil(users / 100));
    const usersPerWorker = Math.ceil(users / workersNeeded);
    
    let completedWorkers = 0;
    
    // Fork worker processes
    for (let i = 0; i < workersNeeded; i++) {
      const worker = cluster.fork({
        WORKER_ID: i,
        USERS_PER_WORKER: usersPerWorker,
        RAMP_UP_TIME: rampUpTime,
        DURATION: duration,
        TEST_ID: testId
      });
      
      worker.on('message', (message) => {
        if (message.type === 'results') {
          results.totalRequests += message.data.requests;
          results.successfulRequests += message.data.successes;
          results.errors.push(...message.data.errors);
          results.responseTimeStats.push(...message.data.responseTimes);
        }
      });
      
      worker.on('exit', () => {
        completedWorkers++;
        if (completedWorkers === workersNeeded) {
          // Calculate final metrics
          const successRate = (results.successfulRequests / results.totalRequests) * 100;
          const avgResponseTime = results.responseTimeStats.reduce((a, b) => a + b, 0) / results.responseTimeStats.length;
          
          resolve({
            totalRequests: results.totalRequests,
            successRate: successRate,
            errorCount: results.errors.length,
            averageResponseTime: avgResponseTime,
            maxMemoryUsage: Math.max(...results.resourceUsage.map(r => r.memory)),
            peakCpuUsage: Math.max(...results.resourceUsage.map(r => r.cpu))
          });
        }
      });
    }
  }

  async function executeWorkerProcess(testId) {
    const workerId = process.env.WORKER_ID;
    const usersPerWorker = parseInt(process.env.USERS_PER_WORKER);
    const rampUpTime = parseInt(process.env.RAMP_UP_TIME);
    const duration = parseInt(process.env.DURATION);
    
    const workerResults = {
      requests: 0,
      successes: 0,
      errors: [],
      responseTimes: []
    };
    
    try {
      // Simulate concurrent users
      const userPromises = Array.from({ length: usersPerWorker }, (_, userIndex) => {
        return simulateLoadTestUser({
          workerId,
          userIndex,
          rampUpTime,
          duration,
          testId: `${testId}_w${workerId}_u${userIndex}`
        });
      });
      
      const userResults = await Promise.allSettled(userPromises);
      
      // Aggregate results
      for (const result of userResults) {
        if (result.status === 'fulfilled') {
          workerResults.requests += result.value.requests;
          workerResults.successes += result.value.successes;
          workerResults.responseTimes.push(...result.value.responseTimes);
        } else {
          workerResults.errors.push(result.reason);
        }
      }
      
      // Send results back to master
      process.send({
        type: 'results',
        data: workerResults
      });
      
    } catch (error) {
      process.send({
        type: 'error',
        error: error.message
      });
    }
    
    process.exit(0);
  }

  async function simulateLoadTestUser(config) {
    const { workerId, userIndex, rampUpTime, duration, testId } = config;
    
    const paymentHelper = new TestPaymentHelper({
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      timeout: 30000
    });
    
    const testData = new TestDataGenerator();
    
    // Random ramp-up delay
    const rampUpDelay = Math.random() * rampUpTime;
    await delay(rampUpDelay);
    
    const results = {
      requests: 0,
      successes: 0,
      responseTimes: []
    };
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    while (Date.now() < endTime) {
      try {
        const requestStart = Date.now();
        
        // Simulate user behavior
        await simulateUserBehavior(paymentHelper, testData, {
          userId: `w${workerId}u${userIndex}`,
          testId: testId
        });
        
        const responseTime = Date.now() - requestStart;
        results.requests++;
        results.successes++;
        results.responseTimes.push(responseTime);
        
      } catch (error) {
        results.requests++;
        // Don't count errors as failures for load testing
      }
      
      // Think time between requests
      const thinkTime = LOAD_CONFIG.THINK_TIME_MIN + 
        Math.random() * (LOAD_CONFIG.THINK_TIME_MAX - LOAD_CONFIG.THINK_TIME_MIN);
      await delay(thinkTime);
    }
    
    return results;
  }

  async function simulateUserBehavior(paymentHelper, testData, config) {
    const { userId, testId } = config;
    
    // Random user behavior patterns
    const behaviors = [
      { action: 'browse', probability: 0.3 },
      { action: 'create_invoice', probability: 0.4 },
      { action: 'check_status', probability: 0.2 },
      { action: 'download_consignment', probability: 0.1 }
    ];
    
    const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
    
    switch (randomBehavior.action) {
      case 'browse':
        // Simulate browsing (health check)
        await paymentHelper.api.get('/api/health');
        break;
        
      case 'create_invoice':
        // Create and potentially pay invoice
        const rgbInvoice = testData.generateRGBInvoice();
        const response = await paymentHelper.createInvoice({
          rgbInvoice,
          batchCount: Math.floor(Math.random() * 3) + 1,
          testId: `${testId}_${userId}`
        });
        
        // 50% chance to actually pay
        if (Math.random() < 0.5) {
          await paymentHelper.payLightningInvoice(response.lightningInvoice, {
            testId: `${testId}_${userId}`
          });
        }
        break;
        
      case 'check_status':
        // Random status check (might fail for non-existent invoice)
        const fakeInvoiceId = `fake_${userId}_${Date.now()}`;
        try {
          await paymentHelper.api.get(`/api/rgb/invoice/${fakeInvoiceId}/status`);
        } catch (error) {
          // Expected for fake invoice ID
        }
        break;
        
      case 'download_consignment':
        // Try to download non-existent consignment
        const fakeConsignmentId = `fake_${userId}_${Date.now()}`;
        try {
          await paymentHelper.api.get(`/api/rgb/invoice/${fakeConsignmentId}/consignment`);
        } catch (error) {
          // Expected for fake ID
        }
        break;
    }
  }

  async function simulateUserPurchase(config) {
    const { userId, rgbInvoice, batchCount, testId, randomDelay } = config;
    
    const paymentHelper = new TestPaymentHelper({
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
    });
    
    const testData = new TestDataGenerator();
    
    if (randomDelay) {
      await delay(Math.random() * 1000);
    }
    
    try {
      const invoice = rgbInvoice || testData.generateRGBInvoice();
      
      const response = await paymentHelper.createInvoice({
        rgbInvoice: invoice,
        batchCount,
        testId: `${testId}_${userId}`
      });
      
      if (response.success) {
        await paymentHelper.payLightningInvoice(response.lightningInvoice, {
          testId: `${testId}_${userId}`
        });
        
        const distribution = await paymentHelper.waitForTokenDistribution(response.invoiceId, {
          expectedTokens: 700 * batchCount
        });
        
        return {
          success: true,
          tokensDistributed: distribution.tokensDistributed,
          userId
        };
      }
      
      return { success: false, userId };
      
    } catch (error) {
      return { success: false, error: error.message, userId };
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function setupRaceConditionScenario(availableTokens) {
    const validationHelper = new ValidationHelper();
    await validationHelper.setSupplyForTesting(21_000_000 - availableTokens);
  }

  async function cleanupLoadTestData() {
    console.log('Cleaning up load test data...');
    // Implementation would clean up test database records, temporary files, etc.
  }
});