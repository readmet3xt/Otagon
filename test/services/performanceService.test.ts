import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceService } from '../../services/performanceService';

describe('PerformanceService', () => {
  beforeEach(() => {
    // Clear all data before each test
    performanceService.clear();
  });

  describe('Metrics', () => {
    it('should record metrics correctly', () => {
      performanceService.recordMetric('test_metric', 100, 'ms', { test: 'data' });
      
      const metrics = performanceService.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual({
        name: 'test_metric',
        value: 100,
        unit: 'ms',
        timestamp: expect.any(Number),
        metadata: { test: 'data' },
      });
    });

    it('should limit metrics to 1000 entries', () => {
      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        performanceService.recordMetric(`metric_${i}`, i, 'count');
      }
      
      const metrics = performanceService.getMetrics();
      expect(metrics).toHaveLength(1000);
      expect(metrics[0].name).toBe('metric_1'); // First one should be dropped
      expect(metrics[999].name).toBe('metric_1000'); // Last one should remain
    });
  });

  describe('Interactions', () => {
    it('should record interactions correctly', () => {
      performanceService.recordInteraction('test_action', true, 150, { success: true });
      
      const interactions = performanceService.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0]).toEqual({
        action: 'test_action',
        timestamp: expect.any(Number),
        duration: 150,
        success: true,
        metadata: { success: true },
      });
    });

    it('should record failed interactions', () => {
      performanceService.recordInteraction('failed_action', false, 200, { error: 'test error' });
      
      const interactions = performanceService.getInteractions();
      expect(interactions[0].success).toBe(false);
      expect(interactions[0].metadata?.error).toBe('test error');
    });
  });

  describe('Errors', () => {
    it('should record errors correctly', () => {
      performanceService.recordError('Test error message', 'Error stack', 'TestComponent');
      
      const errors = performanceService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        message: 'Test error message',
        stack: 'Error stack',
        timestamp: expect.any(Number),
        component: 'TestComponent',
        metadata: undefined,
      });
    });
  });

  describe('Async Measurement', () => {
    it('should measure successful async operations', async () => {
      const mockAsyncFn = vi.fn().mockResolvedValue('success');
      
      const result = await performanceService.measureAsync('test_async', mockAsyncFn);
      
      expect(result).toBe('success');
      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
      
      const interactions = performanceService.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].action).toBe('test_async');
      expect(interactions[0].success).toBe(true);
      expect(interactions[0].duration).toBeGreaterThan(0);
    });

    it('should measure failed async operations', async () => {
      const mockAsyncFn = vi.fn().mockRejectedValue(new Error('Async error'));
      
      await expect(performanceService.measureAsync('test_async_fail', mockAsyncFn))
        .rejects.toThrow('Async error');
      
      const interactions = performanceService.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].action).toBe('test_async_fail');
      expect(interactions[0].success).toBe(false);
      expect(interactions[0].duration).toBeGreaterThan(0);
      expect(interactions[0].metadata?.error).toBe('Async error');
    });
  });

  describe('Sync Measurement', () => {
    it('should measure successful sync operations', () => {
      const mockSyncFn = vi.fn().mockReturnValue('success');
      
      const result = performanceService.measureSync('test_sync', mockSyncFn);
      
      expect(result).toBe('success');
      expect(mockSyncFn).toHaveBeenCalledTimes(1);
      
      const interactions = performanceService.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].action).toBe('test_sync');
      expect(interactions[0].success).toBe(true);
      expect(interactions[0].duration).toBeGreaterThan(0);
    });

    it('should measure failed sync operations', () => {
      const mockSyncFn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      
      expect(() => performanceService.measureSync('test_sync_fail', mockSyncFn))
        .toThrow('Sync error');
      
      const interactions = performanceService.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].action).toBe('test_sync_fail');
      expect(interactions[0].success).toBe(false);
      expect(interactions[0].duration).toBeGreaterThan(0);
      expect(interactions[0].metadata?.error).toBe('Sync error');
    });
  });

  describe('Summary', () => {
    it('should generate correct summary', () => {
      // Add some test data
      performanceService.recordMetric('test_metric', 100, 'ms');
      performanceService.recordInteraction('test_action', true, 150);
      performanceService.recordInteraction('test_action2', false, 200);
      performanceService.recordError('Test error');
      
      const summary = performanceService.getSummary();
      
      expect(summary.totalMetrics).toBe(1);
      expect(summary.totalInteractions).toBe(2);
      expect(summary.totalErrors).toBe(1);
      expect(summary.averageResponseTime).toBe(175); // (150 + 200) / 2
      expect(summary.errorRate).toBe(50); // 1 error / 2 interactions * 100
    });
  });

  describe('Observers', () => {
    it('should notify observers of events', () => {
      const mockObserver = vi.fn();
      const unsubscribe = performanceService.subscribe(mockObserver);
      
      performanceService.recordMetric('test_metric', 100, 'ms');
      
      expect(mockObserver).toHaveBeenCalledWith({
        type: 'metric',
        data: expect.objectContaining({
          name: 'test_metric',
          value: 100,
        }),
      });
      
      unsubscribe();
      
      // Should not notify after unsubscribe
      mockObserver.mockClear();
      performanceService.recordMetric('test_metric2', 200, 'ms');
      expect(mockObserver).not.toHaveBeenCalled();
    });
  });

  describe('Data Export', () => {
    it('should export data correctly', () => {
      performanceService.recordMetric('test_metric', 100, 'ms');
      performanceService.recordInteraction('test_action', true, 150);
      performanceService.recordError('Test error');
      
      const exportedData = performanceService.exportData();
      
      expect(exportedData).toEqual({
        metrics: expect.any(Array),
        interactions: expect.any(Array),
        errors: expect.any(Array),
        summary: expect.any(Object),
        timestamp: expect.any(Number),
      });
      
      expect(exportedData.metrics).toHaveLength(1);
      expect(exportedData.interactions).toHaveLength(1);
      expect(exportedData.errors).toHaveLength(1);
    });
  });
});
