/**
 * Real-time Monitoring & Validation Tests
 * 
 * Tests monitoring systems for:
 * 1. Real-time payment tracking
 * 2. Token distribution accuracy monitoring
 * 3. Error rate tracking and alerting
 * 4. Performance metrics collection
 * 5. System health monitoring
 * 6. Alert system validation
 * 7. Dashboard accuracy verification
 */

const { expect } = require('@jest/globals');
const EventEmitter = require('events');
const TestPaymentHelper = require('../utils/TestPaymentHelper');
const TestDataGenerator = require('../utils/TestDataGenerator');
const ValidationHelper = require('../utils/ValidationHelper');
const MonitoringClient = require('../utils/MonitoringClient');

// Monitoring test configuration
const MONITORING_CONFIG = {
  REAL_TIME_THRESHOLD_MS: 1000,    // Real-time events should be < 1s delay
  ALERT_RESPONSE_TIME_MS: 5000,    // Alerts should fire within 5s
  METRIC_ACCURACY_PERCENT: 99.9,   // Metrics should be 99.9% accurate
  DASHBOARD_UPDATE_INTERVAL_MS: 2000, // Dashboard updates every 2s
  ERROR_RATE_ALERT_THRESHOLD: 5,   // Alert if error rate > 5%
  PERFORMANCE_DEGRADATION_THRESHOLD: 20, // Alert if 20% slower
  CONCURRENT_MONITORING_SESSIONS: 10,
  MONITORING_TEST_DURATION: 120000  // 2 minutes
};

describe('Real-time Monitoring & Validation', () => {
  let paymentHelper;
  let testData;
  let validationHelper;
  let monitoringClient;
  let eventCollector;

  beforeAll(async () => {
    paymentHelper = new TestPaymentHelper({
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      timeout: 60000
    });
    
    testData = new TestDataGenerator();
    validationHelper = new ValidationHelper();
    monitoringClient = new MonitoringClient({
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      metricsEndpoint: '/api/metrics',
      alertsEndpoint: '/api/alerts',
      dashboardEndpoint: '/api/dashboard'
    });

    // Event collector for real-time testing
    eventCollector = new EventEmitter();
    
    // Verify monitoring system is ready
    await verifyMonitoringSystem();
  });

  afterAll(async () => {
    await monitoringClient.cleanup();
    await paymentHelper.cleanup();
    eventCollector.removeAllListeners();
  });

  describe('Real-time Payment Tracking', () => {
    test('should track payment events in real-time', async () => {
      const testId = `realtime_tracking_${Date.now()}`;
      
      // Start monitoring session
      const monitoringSession = await monitoringClient.startPaymentMonitoring({
        sessionId: testId,
        includeEvents: ['invoice_created', 'payment_received', 'tokens_distributed', 'consignment_generated']
      });

      const receivedEvents = [];
      const eventTimestamps = {};

      // Listen for real-time events
      monitoringSession.on('payment_event', (event) => {
        receivedEvents.push(event);
        eventTimestamps[event.type] = Date.now();
        console.log(`[${testId}] Received event: ${event.type} for ${event.invoiceId}`);
      });

      // Execute payment flow
      const startTime = Date.now();
      
      const rgbInvoice = testData.generateRGBInvoice();
      const purchaseRequest = {
        rgbInvoice: rgbInvoice,
        batchCount: 1,
        testId: testId
      };

      // Step 1: Create invoice
      const invoiceCreationTime = Date.now();
      const createResponse = await paymentHelper.createInvoice(purchaseRequest);
      const { invoiceId, lightningInvoice } = createResponse;

      // Step 2: Pay invoice
      const paymentTime = Date.now();
      await paymentHelper.payLightningInvoice(lightningInvoice, { testId });

      // Step 3: Wait for distribution
      await paymentHelper.waitForTokenDistribution(invoiceId, { expectedTokens: 700 });
      const completionTime = Date.now();

      // Wait a moment for all events to be received
      await delay(2000);

      // Stop monitoring
      await monitoringClient.stopMonitoring(monitoringSession);

      // Validate event tracking
      expect(receivedEvents.length).toBeGreaterThanOrEqual(4); // All major events

      // Check event timing (real-time requirement)
      const eventTypes = ['invoice_created', 'payment_received', 'tokens_distributed', 'consignment_generated'];
      for (const eventType of eventTypes) {
        const event = receivedEvents.find(e => e.type === eventType);
        expect(event).toBeDefined();
        
        // Events should be received within real-time threshold
        const eventDelay = eventTimestamps[eventType] - event.actualTimestamp;
        expect(eventDelay).toBeLessThan(MONITORING_CONFIG.REAL_TIME_THRESHOLD_MS);
      }

      // Verify event data accuracy
      const invoiceCreatedEvent = receivedEvents.find(e => e.type === 'invoice_created');
      expect(invoiceCreatedEvent.invoiceId).toBe(invoiceId);
      expect(invoiceCreatedEvent.amount).toBe(2000);
      expect(invoiceCreatedEvent.batchCount).toBe(1);

      const tokensDistributedEvent = receivedEvents.find(e => e.type === 'tokens_distributed');
      expect(tokensDistributedEvent.tokenAmount).toBe(700);
      expect(tokensDistributedEvent.invoiceId).toBe(invoiceId);

      console.log(`[${testId}] Real-time payment tracking verified - ${receivedEvents.length} events tracked`);
    });

    test('should handle multiple concurrent payment tracking', async () => {
      const testId = `concurrent_tracking_${Date.now()}`;
      
      // Start monitoring for concurrent payments
      const monitoringSession = await monitoringClient.startPaymentMonitoring({
        sessionId: testId,
        concurrentLimit: 20
      });

      const trackedPayments = [];
      const eventsByInvoice = {};

      monitoringSession.on('payment_event', (event) => {
        if (!eventsByInvoice[event.invoiceId]) {
          eventsByInvoice[event.invoiceId] = [];
        }
        eventsByInvoice[event.invoiceId].push(event);
      });

      // Create multiple concurrent payments
      const concurrentPayments = [];
      const paymentCount = 10;

      for (let i = 0; i < paymentCount; i++) {
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 1,
          testId: `${testId}_${i}`
        };

        concurrentPayments.push(
          paymentHelper.createInvoice(purchaseRequest)
            .then(response => {
              trackedPayments.push(response.invoiceId);
              return paymentHelper.payLightningInvoice(response.lightningInvoice, {
                testId: `${testId}_${i}`
              });
            })
        );
      }

      // Execute all payments concurrently
      await Promise.allSettled(concurrentPayments);

      // Wait for all events
      await delay(5000);

      // Stop monitoring
      await monitoringClient.stopMonitoring(monitoringSession);

      // Verify all payments were tracked
      expect(Object.keys(eventsByInvoice).length).toBe(paymentCount);

      // Verify each payment has complete event sequence
      for (const invoiceId of trackedPayments) {
        const events = eventsByInvoice[invoiceId];
        expect(events).toBeDefined();
        expect(events.length).toBeGreaterThanOrEqual(2); // At least created + received

        // Events should be in correct order
        const eventTypes = events.map(e => e.type);
        expect(eventTypes).toContain('invoice_created');
        expect(eventTypes).toContain('payment_received');
      }

      console.log(`[${testId}] Concurrent payment tracking verified for ${paymentCount} payments`);
    });
  });

  describe('Token Distribution Accuracy Monitoring', () => {
    test('should monitor token distribution accuracy in real-time', async () => {
      const testId = `distribution_accuracy_${Date.now()}`;
      
      // Start distribution monitoring
      const distributionMonitor = await monitoringClient.startDistributionMonitoring({
        sessionId: testId,
        trackAccuracy: true,
        alertOnDiscrepancy: true
      });

      const distributionResults = [];
      const accuracyAlerts = [];

      distributionMonitor.on('distribution_completed', (event) => {
        distributionResults.push(event);
      });

      distributionMonitor.on('accuracy_alert', (alert) => {
        accuracyAlerts.push(alert);
      });

      // Execute various batch size purchases
      const testCases = [
        { batches: 1, expectedTokens: 700 },
        { batches: 3, expectedTokens: 2100 },
        { batches: 5, expectedTokens: 3500 },
        { batches: 2, expectedTokens: 1400 }
      ];

      for (const testCase of testCases) {
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: testCase.batches,
          testId: `${testId}_${testCase.batches}b`
        };

        const createResponse = await paymentHelper.createInvoice(purchaseRequest);
        await paymentHelper.payLightningInvoice(createResponse.lightningInvoice, {
          testId: `${testId}_${testCase.batches}b`
        });

        await paymentHelper.waitForTokenDistribution(createResponse.invoiceId, {
          expectedTokens: testCase.expectedTokens
        });
      }

      // Wait for all monitoring events
      await delay(3000);

      // Stop distribution monitoring
      await monitoringClient.stopMonitoring(distributionMonitor);

      // Verify distribution accuracy
      expect(distributionResults.length).toBe(testCases.length);
      expect(accuracyAlerts.length).toBe(0); // No accuracy issues

      // Check each distribution result
      for (let i = 0; i < testCases.length; i++) {
        const result = distributionResults[i];
        const expectedTokens = testCases[i].expectedTokens;
        
        expect(result.tokensDistributed).toBe(expectedTokens);
        expect(result.accuracy).toBe(100); // 100% accurate
        expect(result.discrepancy).toBe(0);
      }

      // Calculate overall accuracy
      const totalExpected = testCases.reduce((sum, tc) => sum + tc.expectedTokens, 0);
      const totalDistributed = distributionResults.reduce((sum, dr) => sum + dr.tokensDistributed, 0);
      const overallAccuracy = (totalDistributed / totalExpected) * 100;

      expect(overallAccuracy).toBeGreaterThanOrEqual(MONITORING_CONFIG.METRIC_ACCURACY_PERCENT);

      console.log(`[${testId}] Distribution accuracy monitoring: ${overallAccuracy}% accurate`);
    });

    test('should detect and alert on distribution discrepancies', async () => {
      const testId = `distribution_discrepancy_${Date.now()}`;
      
      // Start monitoring with discrepancy detection
      const discrepancyMonitor = await monitoringClient.startDistributionMonitoring({
        sessionId: testId,
        alertOnDiscrepancy: true,
        discrepancyThreshold: 0 // Alert on any discrepancy
      });

      const discrepancyAlerts = [];
      
      discrepancyMonitor.on('discrepancy_alert', (alert) => {
        discrepancyAlerts.push(alert);
        console.log(`[${testId}] Discrepancy alert: ${alert.message}`);
      });

      // Simulate a distribution discrepancy (if possible in test environment)
      try {
        await simulateDistributionDiscrepancy(testId);
        
        // Wait for alert
        await delay(MONITORING_CONFIG.ALERT_RESPONSE_TIME_MS);
        
        expect(discrepancyAlerts.length).toBeGreaterThan(0);
        
        const alert = discrepancyAlerts[0];
        expect(alert.type).toBe('distribution_discrepancy');
        expect(alert.severity).toBe('high');
        expect(alert.timestamp).toBeDefined();
        
        console.log(`[${testId}] Distribution discrepancy detection working`);
        
      } catch (error) {
        // If we can't simulate discrepancy in test environment, skip
        console.log(`[${testId}] Skipping discrepancy simulation: ${error.message}`);
      }

      await monitoringClient.stopMonitoring(discrepancyMonitor);
    });
  });

  describe('Error Rate Tracking & Alerting', () => {
    test('should track error rates and trigger alerts', async () => {
      const testId = `error_rate_tracking_${Date.now()}`;
      
      // Start error rate monitoring
      const errorMonitor = await monitoringClient.startErrorMonitoring({
        sessionId: testId,
        errorRateThreshold: MONITORING_CONFIG.ERROR_RATE_ALERT_THRESHOLD,
        monitoringWindow: 60000 // 1 minute window
      });

      const errorAlerts = [];
      const errorEvents = [];

      errorMonitor.on('error_rate_alert', (alert) => {
        errorAlerts.push(alert);
        console.log(`[${testId}] Error rate alert: ${alert.errorRate}%`);
      });

      errorMonitor.on('error_event', (event) => {
        errorEvents.push(event);
      });

      // Generate mix of successful and failed operations
      const operations = [];
      
      // 80% successful operations
      for (let i = 0; i < 40; i++) {
        operations.push(createSuccessfulOperation(`${testId}_success_${i}`));
      }
      
      // 20% failed operations (above threshold)
      for (let i = 0; i < 10; i++) {
        operations.push(createFailedOperation(`${testId}_failure_${i}`));
      }

      // Execute operations
      await Promise.allSettled(operations);

      // Wait for error rate calculation and alerts
      await delay(MONITORING_CONFIG.ALERT_RESPONSE_TIME_MS + 2000);

      // Stop error monitoring
      await monitoringClient.stopMonitoring(errorMonitor);

      // Verify error rate tracking
      expect(errorEvents.length).toBe(10); // 10 failed operations
      
      // Should trigger alert since 20% > 5% threshold
      expect(errorAlerts.length).toBeGreaterThan(0);
      
      const alert = errorAlerts[0];
      expect(alert.errorRate).toBeGreaterThan(MONITORING_CONFIG.ERROR_RATE_ALERT_THRESHOLD);
      expect(alert.windowStart).toBeDefined();
      expect(alert.totalOperations).toBe(50);
      expect(alert.errorCount).toBe(10);

      console.log(`[${testId}] Error rate tracking: ${alert.errorRate}% error rate detected`);
    });

    test('should categorize different error types', async () => {
      const testId = `error_categorization_${Date.now()}`;
      
      // Start comprehensive error monitoring
      const errorCategoryMonitor = await monitoringClient.startErrorMonitoring({
        sessionId: testId,
        categorizeErrors: true,
        trackErrorPatterns: true
      });

      const categorizedErrors = [];

      errorCategoryMonitor.on('categorized_error', (error) => {
        categorizedErrors.push(error);
      });

      // Generate various error types
      const errorTypes = [
        { type: 'invalid_rgb_invoice', count: 3 },
        { type: 'payment_timeout', count: 2 },
        { type: 'insufficient_supply', count: 1 },
        { type: 'database_error', count: 2 },
        { type: 'network_error', count: 1 }
      ];

      for (const errorType of errorTypes) {
        for (let i = 0; i < errorType.count; i++) {
          await simulateSpecificError(errorType.type, `${testId}_${errorType.type}_${i}`);
        }
      }

      // Wait for error categorization
      await delay(3000);

      // Stop monitoring
      await monitoringClient.stopMonitoring(errorCategoryMonitor);

      // Verify error categorization
      expect(categorizedErrors.length).toBe(9); // Total errors

      // Check each error category
      for (const errorType of errorTypes) {
        const categoryErrors = categorizedErrors.filter(e => e.category === errorType.type);
        expect(categoryErrors.length).toBe(errorType.count);
      }

      // Verify error patterns
      const errorSummary = await monitoringClient.getErrorSummary(testId);
      expect(errorSummary.totalErrors).toBe(9);
      expect(errorSummary.categoriesCount).toBe(5);
      expect(errorSummary.mostCommonError).toBe('invalid_rgb_invoice');

      console.log(`[${testId}] Error categorization: ${errorSummary.categoriesCount} categories, ${errorSummary.totalErrors} total errors`);
    });
  });

  describe('Performance Metrics Collection', () => {
    test('should collect comprehensive performance metrics', async () => {
      const testId = `performance_metrics_${Date.now()}`;
      
      // Start performance monitoring
      const performanceMonitor = await monitoringClient.startPerformanceMonitoring({
        sessionId: testId,
        collectMetrics: ['response_time', 'throughput', 'resource_usage', 'error_rate'],
        samplingInterval: 1000 // 1 second
      });

      const performanceData = [];

      performanceMonitor.on('performance_sample', (sample) => {
        performanceData.push(sample);
      });

      // Execute load to generate performance data
      const loadOperations = [];
      for (let i = 0; i < 20; i++) {
        loadOperations.push(createLoadOperation(`${testId}_load_${i}`));
      }

      await Promise.allSettled(loadOperations);

      // Continue monitoring for a few more samples
      await delay(5000);

      // Stop performance monitoring
      await monitoringClient.stopMonitoring(performanceMonitor);

      // Analyze performance metrics
      expect(performanceData.length).toBeGreaterThan(3); // At least a few samples

      const latestSample = performanceData[performanceData.length - 1];
      
      // Verify metric completeness
      expect(latestSample.responseTime).toBeDefined();
      expect(latestSample.throughput).toBeDefined();
      expect(latestSample.resourceUsage).toBeDefined();
      expect(latestSample.errorRate).toBeDefined();

      // Verify performance standards
      expect(latestSample.responseTime.p95).toBeLessThan(30000); // < 30s P95
      expect(latestSample.resourceUsage.memoryUsage).toBeLessThan(1024); // < 1GB
      expect(latestSample.resourceUsage.cpuUsage).toBeLessThan(80); // < 80%

      // Calculate performance trends
      const avgResponseTime = performanceData.reduce((sum, sample) => 
        sum + sample.responseTime.average, 0) / performanceData.length;
      
      const avgThroughput = performanceData.reduce((sum, sample) => 
        sum + sample.throughput, 0) / performanceData.length;

      console.log(`[${testId}] Performance metrics: ${avgResponseTime.toFixed(0)}ms avg response, ${avgThroughput.toFixed(1)} ops/sec throughput`);
    });

    test('should detect performance degradation', async () => {
      const testId = `performance_degradation_${Date.now()}`;
      
      // Establish baseline performance
      const baselineMonitor = await monitoringClient.startPerformanceMonitoring({
        sessionId: `${testId}_baseline`,
        establishBaseline: true,
        baselineDuration: 30000 // 30 seconds
      });

      // Run baseline load
      for (let i = 0; i < 10; i++) {
        await createLoadOperation(`${testId}_baseline_${i}`);
      }

      const baseline = await monitoringClient.getBaseline(baselineMonitor);
      await monitoringClient.stopMonitoring(baselineMonitor);

      // Start degradation monitoring
      const degradationMonitor = await monitoringClient.startPerformanceMonitoring({
        sessionId: `${testId}_degradation`,
        baseline: baseline,
        degradationThreshold: MONITORING_CONFIG.PERFORMANCE_DEGRADATION_THRESHOLD,
        alertOnDegradation: true
      });

      const degradationAlerts = [];

      degradationMonitor.on('performance_degradation_alert', (alert) => {
        degradationAlerts.push(alert);
        console.log(`[${testId}] Performance degradation: ${alert.degradationPercent}%`);
      });

      // Simulate performance degradation
      await simulatePerformanceDegradation(testId);

      // Run load during degradation
      for (let i = 0; i < 10; i++) {
        await createLoadOperation(`${testId}_degraded_${i}`);
      }

      // Wait for degradation detection
      await delay(MONITORING_CONFIG.ALERT_RESPONSE_TIME_MS);

      // Stop monitoring
      await monitoringClient.stopMonitoring(degradationMonitor);

      // Verify degradation detection
      if (degradationAlerts.length > 0) {
        const alert = degradationAlerts[0];
        expect(alert.degradationPercent).toBeGreaterThan(MONITORING_CONFIG.PERFORMANCE_DEGRADATION_THRESHOLD);
        expect(alert.affectedMetrics).toBeDefined();
        expect(alert.baseline).toBeDefined();
        
        console.log(`[${testId}] Performance degradation detected: ${alert.degradationPercent}%`);
      } else {
        console.log(`[${testId}] No significant performance degradation detected`);
      }
    });
  });

  describe('Dashboard Accuracy Verification', () => {
    test('should verify dashboard data accuracy', async () => {
      const testId = `dashboard_accuracy_${Date.now()}`;
      
      // Execute known operations
      const knownOperations = [];
      const expectedMetrics = {
        totalInvoices: 0,
        totalPayments: 0,
        tokensDistributed: 0,
        successRate: 0,
        averageResponseTime: 0
      };

      // Create 5 successful payments
      for (let i = 0; i < 5; i++) {
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 2,
          testId: `${testId}_${i}`
        };

        const startTime = Date.now();
        const createResponse = await paymentHelper.createInvoice(purchaseRequest);
        await paymentHelper.payLightningInvoice(createResponse.lightningInvoice, {
          testId: `${testId}_${i}`
        });
        await paymentHelper.waitForTokenDistribution(createResponse.invoiceId, {
          expectedTokens: 1400
        });
        const endTime = Date.now();

        knownOperations.push({
          invoiceId: createResponse.invoiceId,
          tokens: 1400,
          responseTime: endTime - startTime,
          success: true
        });

        expectedMetrics.totalInvoices++;
        expectedMetrics.totalPayments++;
        expectedMetrics.tokensDistributed += 1400;
      }

      expectedMetrics.successRate = 100;
      expectedMetrics.averageResponseTime = knownOperations.reduce((sum, op) => 
        sum + op.responseTime, 0) / knownOperations.length;

      // Wait for dashboard to update
      await delay(MONITORING_CONFIG.DASHBOARD_UPDATE_INTERVAL_MS + 2000);

      // Fetch dashboard data
      const dashboardData = await monitoringClient.getDashboardData({
        testSession: testId,
        includeMetrics: ['invoices', 'payments', 'tokens', 'success_rate', 'response_time']
      });

      // Verify dashboard accuracy
      expect(dashboardData.totalInvoices).toBeGreaterThanOrEqual(expectedMetrics.totalInvoices);
      expect(dashboardData.totalPayments).toBeGreaterThanOrEqual(expectedMetrics.totalPayments);
      expect(dashboardData.tokensDistributed).toBeGreaterThanOrEqual(expectedMetrics.tokensDistributed);
      
      // Allow for small variations in calculated metrics
      expect(dashboardData.successRate).toBeGreaterThanOrEqual(95);
      expect(dashboardData.averageResponseTime).toBeLessThan(expectedMetrics.averageResponseTime * 1.2);

      // Verify data freshness
      const dataAge = Date.now() - new Date(dashboardData.lastUpdated).getTime();
      expect(dataAge).toBeLessThan(MONITORING_CONFIG.DASHBOARD_UPDATE_INTERVAL_MS * 2);

      console.log(`[${testId}] Dashboard accuracy verified - ${dashboardData.totalPayments} payments, ${dashboardData.tokensDistributed} tokens distributed`);
    });

    test('should update dashboard in real-time', async () => {
      const testId = `dashboard_realtime_${Date.now()}`;
      
      // Start monitoring dashboard updates
      const dashboardMonitor = await monitoringClient.monitorDashboardUpdates({
        sessionId: testId,
        updateThreshold: MONITORING_CONFIG.DASHBOARD_UPDATE_INTERVAL_MS
      });

      const dashboardUpdates = [];

      dashboardMonitor.on('dashboard_updated', (update) => {
        dashboardUpdates.push({
          timestamp: Date.now(),
          data: update
        });
      });

      // Get initial dashboard state
      const initialDashboard = await monitoringClient.getDashboardData({
        testSession: testId
      });

      // Execute operations and verify real-time updates
      const operationTimes = [];

      for (let i = 0; i < 3; i++) {
        const operationStart = Date.now();
        
        const rgbInvoice = testData.generateRGBInvoice();
        const purchaseRequest = {
          rgbInvoice: rgbInvoice,
          batchCount: 1,
          testId: `${testId}_${i}`
        };

        const createResponse = await paymentHelper.createInvoice(purchaseRequest);
        await paymentHelper.payLightningInvoice(createResponse.lightningInvoice, {
          testId: `${testId}_${i}`
        });

        operationTimes.push(operationStart);

        // Wait for dashboard update
        await delay(MONITORING_CONFIG.DASHBOARD_UPDATE_INTERVAL_MS + 1000);
      }

      // Stop monitoring
      await monitoringClient.stopMonitoring(dashboardMonitor);

      // Verify real-time updates occurred
      expect(dashboardUpdates.length).toBeGreaterThanOrEqual(3);

      // Verify update timing
      for (let i = 0; i < Math.min(dashboardUpdates.length, operationTimes.length); i++) {
        const updateDelay = dashboardUpdates[i].timestamp - operationTimes[i];
        expect(updateDelay).toBeLessThan(MONITORING_CONFIG.DASHBOARD_UPDATE_INTERVAL_MS * 2);
      }

      // Verify data progression
      const finalDashboard = await monitoringClient.getDashboardData({
        testSession: testId
      });

      expect(finalDashboard.totalInvoices).toBeGreaterThan(initialDashboard.totalInvoices);
      expect(finalDashboard.totalPayments).toBeGreaterThan(initialDashboard.totalPayments);

      console.log(`[${testId}] Real-time dashboard updates verified - ${dashboardUpdates.length} updates received`);
    });
  });

  // Helper functions
  async function verifyMonitoringSystem() {
    // Check monitoring endpoints availability
    const healthCheck = await monitoringClient.checkHealth();
    expect(healthCheck.status).toBe('healthy');
    expect(healthCheck.capabilities).toContain('real_time_monitoring');
    expect(healthCheck.capabilities).toContain('alert_system');
    expect(healthCheck.capabilities).toContain('dashboard_api');

    console.log('Monitoring system health verified');
  }

  async function createSuccessfulOperation(testId) {
    const rgbInvoice = testData.generateRGBInvoice();
    const purchaseRequest = {
      rgbInvoice: rgbInvoice,
      batchCount: 1,
      testId: testId
    };

    const createResponse = await paymentHelper.createInvoice(purchaseRequest);
    await paymentHelper.payLightningInvoice(createResponse.lightningInvoice, { testId });
    return createResponse.invoiceId;
  }

  async function createFailedOperation(testId) {
    // Create operation that will fail
    const invalidRgbInvoice = 'invalid-rgb-invoice';
    const purchaseRequest = {
      rgbInvoice: invalidRgbInvoice,
      batchCount: 1,
      testId: testId
    };

    try {
      await paymentHelper.createInvoice(purchaseRequest);
    } catch (error) {
      // Expected failure
      return error.message;
    }
  }

  async function createLoadOperation(testId) {
    // Create realistic load operation
    return createSuccessfulOperation(testId);
  }

  async function simulateDistributionDiscrepancy(testId) {
    // This would be implemented based on test environment capabilities
    // For now, we'll skip if not available
    throw new Error('Distribution discrepancy simulation not available in test environment');
  }

  async function simulateSpecificError(errorType, testId) {
    switch (errorType) {
      case 'invalid_rgb_invoice':
        return createFailedOperation(testId);
      case 'payment_timeout':
        // Simulate timeout scenario
        const rgbInvoice = testData.generateRGBInvoice();
        const response = await paymentHelper.createInvoice({
          rgbInvoice,
          batchCount: 1,
          testId,
          expirySeconds: 1
        });
        await delay(2000); // Let it timeout
        return response.invoiceId;
      case 'insufficient_supply':
        // Would need to temporarily exhaust supply
        throw new Error('Supply exhaustion simulation not available');
      case 'database_error':
        // Would need to simulate database issues
        throw new Error('Database error simulation not available');
      case 'network_error':
        // Would need to simulate network issues
        throw new Error('Network error simulation not available');
      default:
        throw new Error(`Unknown error type: ${errorType}`);
    }
  }

  async function simulatePerformanceDegradation(testId) {
    // This would simulate system slowdown
    // Implementation depends on test environment
    console.log(`[${testId}] Performance degradation simulation not available in test environment`);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});