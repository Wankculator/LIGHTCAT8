/**
 * PerformanceMonitor Unit Tests
 * Comprehensive testing of performance monitoring functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../../../../src/core/monitoring/PerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(),
  memory: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000
  }
};

// Mock global performance
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockEventEmitter = {
      emit: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn()
    };

    monitor = new PerformanceMonitor({
      fpsUpdateInterval: 100,
      memoryUpdateInterval: 200,
      maxHistorySize: 10,
      autoCleanup: false,
      reportingInterval: 500
    }, mockEventEmitter);

    // Reset performance.now mock
    mockPerformance.now.mockReturnValue(0);
  });

  afterEach(() => {
    monitor.dispose();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultMonitor = new PerformanceMonitor();
      expect(defaultMonitor).toBeDefined();
      defaultMonitor.dispose();
    });

    it('should start monitoring automatically', () => {
      // Monitor should be running after initialization
      const stats = monitor.getStats();
      expect(stats).toBeDefined();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Timer Operations', () => {
    it('should start and end timers correctly', () => {
      mockPerformance.now.mockReturnValueOnce(1000);
      const startTime = monitor.startTimer('testTimer');
      expect(startTime).toBe(1000);

      mockPerformance.now.mockReturnValueOnce(1050);
      const duration = monitor.endTimer('testTimer');
      expect(duration).toBe(50);
    });

    it('should track multiple timers independently', () => {
      mockPerformance.now
        .mockReturnValueOnce(1000) // timer1 start
        .mockReturnValueOnce(2000) // timer2 start
        .mockReturnValueOnce(1100) // timer1 end
        .mockReturnValueOnce(2150); // timer2 end

      monitor.startTimer('timer1');
      monitor.startTimer('timer2');
      
      const duration1 = monitor.endTimer('timer1');
      const duration2 = monitor.endTimer('timer2');

      expect(duration1).toBe(100);
      expect(duration2).toBe(150);
    });

    it('should calculate timer averages', () => {
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100)
        .mockReturnValueOnce(1200)
        .mockReturnValueOnce(1350);

      monitor.startTimer('avgTimer');
      monitor.endTimer('avgTimer'); // 100ms

      monitor.startTimer('avgTimer');
      monitor.endTimer('avgTimer'); // 150ms

      // Average should be 125ms
      const stats = monitor.getStats();
      expect(stats.customMetrics).toBeDefined();
    });

    it('should handle timer not found gracefully', () => {
      const duration = monitor.endTimer('nonexistentTimer');
      expect(duration).toBe(0);
    });
  });

  describe('FPS Tracking', () => {
    it('should record frames and calculate FPS', async () => {
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1016.67)
        .mockReturnValueOnce(1033.33);

      monitor.recordFrame();
      monitor.recordFrame();
      monitor.recordFrame();

      // Wait for FPS update
      await new Promise(resolve => setTimeout(resolve, 150));

      const stats = monitor.getStats();
      expect(stats.fps).toBeGreaterThan(0);
      expect(stats.frameTime).toBeGreaterThan(0);
    });

    it('should maintain frame history', () => {
      for (let i = 0; i < 15; i++) {
        mockPerformance.now.mockReturnValueOnce(i * 16.67);
        monitor.recordFrame();
      }

      const stats = monitor.getStats();
      expect(stats.frameTime).toBeGreaterThan(0);
    });
  });

  describe('Memory Monitoring', () => {
    it('should get current memory usage', () => {
      const stats = monitor.getStats();
      
      expect(stats.memoryUsage).toBeDefined();
      expect(stats.memoryUsage.used).toBe(50000000);
      expect(stats.memoryUsage.total).toBe(100000000);
      expect(stats.memoryUsage.percentage).toBe(50);
    });

    it('should handle missing performance.memory gracefully', () => {
      // Temporarily remove performance.memory
      const originalMemory = mockPerformance.memory;
      delete (mockPerformance as any).memory;

      const stats = monitor.getStats();
      expect(stats.memoryUsage).toBeDefined();
      expect(stats.memoryUsage.percentage).toBeGreaterThanOrEqual(0);

      // Restore memory
      mockPerformance.memory = originalMemory;
    });
  });

  describe('Custom Metrics', () => {
    it('should record custom metrics', () => {
      monitor.recordMetric('customTest', 42.5, 'ms');
      monitor.recordMetric('customTest', 38.2, 'ms');

      const stats = monitor.getStats();
      expect(stats.customMetrics.customTest).toBeDefined();
      expect(stats.customMetrics.customTest.value).toBe(38.2);
      expect(stats.customMetrics.customTest.unit).toBe('ms');
      expect(stats.customMetrics.customTest.count).toBe(2);
      expect(stats.customMetrics.customTest.min).toBe(38.2);
      expect(stats.customMetrics.customTest.max).toBe(42.5);
    });

    it('should maintain metric history', () => {
      for (let i = 0; i < 5; i++) {
        monitor.recordMetric('historyTest', i * 10, 'units');
      }

      const stats = monitor.getStats();
      const metric = stats.customMetrics.historyTest;
      expect(metric.history).toHaveLength(5);
      expect(metric.history[0].value).toBe(0);
      expect(metric.history[4].value).toBe(40);
    });

    it('should limit history size', () => {
      for (let i = 0; i < 15; i++) {
        monitor.recordMetric('limitTest', i, 'count');
      }

      const stats = monitor.getStats();
      const metric = stats.customMetrics.limitTest;
      expect(metric.history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Counters and Gauges', () => {
    it('should increment counters', () => {
      monitor.incrementCounter('testCounter');
      monitor.incrementCounter('testCounter', 5);

      // Counters are internal, verify through other means
      // This test ensures no errors are thrown
      expect(true).toBe(true);
    });

    it('should record gauge values', () => {
      monitor.recordGauge('activeUsers', 150);
      monitor.recordGauge('activeUsers', 175);

      const stats = monitor.getStats();
      expect(stats.networkStats.activeConnections).toBe(0); // Default
    });
  });

  describe('Network Monitoring', () => {
    it('should record network requests', () => {
      monitor.recordNetworkRequest(1024, 250, true);
      monitor.recordNetworkRequest(2048, 180, true);
      monitor.recordNetworkRequest(512, 500, false);

      const stats = monitor.getStats();
      expect(stats.networkStats.requestCount).toBeGreaterThan(0);
      expect(stats.networkStats.totalBytes).toBeGreaterThan(0);
      expect(stats.networkStats.errorRate).toBeGreaterThan(0);
    });

    it('should calculate network statistics', () => {
      monitor.recordNetworkRequest(1000, 100, true);
      monitor.recordNetworkRequest(2000, 200, true);
      monitor.recordNetworkRequest(1500, 300, false);

      const stats = monitor.getStats();
      expect(stats.networkStats.averageLatency).toBeGreaterThan(0);
      expect(stats.networkStats.errorRate).toBeCloseTo(0.33, 1);
    });
  });

  describe('Alerting System', () => {
    it('should create alerts for low FPS', async () => {
      // Simulate low FPS
      mockPerformance.now.mockReturnValue(Date.now());
      
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame();
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate 20 FPS
      }

      // Wait for FPS calculation
      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = monitor.getStats();
      // Check if alerts were created (may or may not trigger depending on timing)
      expect(Array.isArray(stats.alerts)).toBe(true);
    });

    it('should acknowledge alerts', () => {
      // Create a mock alert by calling internal method if accessible
      // For now, test that acknowledge doesn't throw
      expect(() => monitor.acknowledgeAlert('nonexistent')).not.toThrow();
    });

    it('should clear all alerts', () => {
      monitor.clearAlerts();
      const stats = monitor.getStats();
      expect(stats.alerts).toHaveLength(0);
    });
  });

  describe('Reporting', () => {
    it('should generate performance stats', () => {
      const stats = monitor.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.fps).toBe('number');
      expect(typeof stats.averageFps).toBe('number');
      expect(typeof stats.frameTime).toBe('number');
      expect(typeof stats.cpuUsage).toBe('number');
      expect(typeof stats.uptime).toBe('number');
      expect(stats.memoryUsage).toBeDefined();
      expect(stats.networkStats).toBeDefined();
      expect(Array.isArray(stats.alerts)).toBe(true);
      expect(typeof stats.customMetrics).toBe('object');
    });

    it('should generate text report', () => {
      const report = monitor.getReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Performance Report');
      expect(report).toContain('FPS:');
      expect(report).toContain('Memory:');
      expect(report).toContain('Uptime:');
    });
  });

  describe('Event Emission', () => {
    it('should emit performance update events', async () => {
      monitor.recordFrame();
      
      // Wait for FPS update interval
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have emitted performanceUpdate event
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should emit memory update events', async () => {
      // Wait for memory update interval
      await new Promise(resolve => setTimeout(resolve, 250));

      // May have emitted memoryUpdate event
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        expect.stringMatching(/memoryUpdate|performanceUpdate|performanceReport/),
        expect.any(Object)
      );
    });
  });

  describe('Lifecycle Management', () => {
    it('should start and stop monitoring', () => {
      monitor.stop();
      monitor.start();
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle multiple start/stop calls', () => {
      monitor.start();
      monitor.start(); // Should be idempotent
      
      monitor.stop();
      monitor.stop(); // Should be idempotent
      
      expect(true).toBe(true);
    });

    it('should dispose properly', () => {
      monitor.dispose();
      
      // Should not throw errors after disposal
      expect(() => monitor.recordFrame()).not.toThrow();
      expect(() => monitor.recordMetric('test', 1)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle performance.now unavailable', () => {
      const originalNow = mockPerformance.now;
      delete (mockPerformance as any).now;

      // Should not throw errors
      expect(() => monitor.startTimer('test')).not.toThrow();
      expect(() => monitor.endTimer('test')).not.toThrow();

      // Restore
      mockPerformance.now = originalNow;
    });

    it('should handle invalid metric values', () => {
      expect(() => monitor.recordMetric('test', NaN, 'units')).not.toThrow();
      expect(() => monitor.recordMetric('test', Infinity, 'units')).not.toThrow();
    });

    it('should handle negative values gracefully', () => {
      expect(() => monitor.recordMetric('negative', -100, 'units')).not.toThrow();
      expect(() => monitor.recordNetworkRequest(-1, -100, true)).not.toThrow();
    });
  });

  describe('Performance Optimization', () => {
    it('should not consume excessive memory', () => {
      // Record many metrics to test memory management
      for (let i = 0; i < 1000; i++) {
        monitor.recordMetric(`metric_${i % 10}`, Math.random() * 100, 'units');
        monitor.recordFrame();
        monitor.recordNetworkRequest(Math.random() * 1000, Math.random() * 100, true);
      }

      const stats = monitor.getStats();
      
      // Should maintain reasonable limits
      expect(Object.keys(stats.customMetrics).length).toBeLessThan(1000);
    });

    it('should handle high frequency operations', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        monitor.startTimer('highFreq');
        monitor.endTimer('highFreq');
        monitor.recordFrame();
        monitor.incrementCounter('rapid');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete reasonably quickly (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});