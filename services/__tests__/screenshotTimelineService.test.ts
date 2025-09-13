import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screenshotTimelineService } from '../screenshotTimelineService';

// Mock the long-term memory service
vi.mock('../longTermMemoryService', () => ({
  longTermMemoryService: {
    trackInteraction: vi.fn(),
  }
}));

describe('ScreenshotTimelineService', () => {
  const mockConversationId = 'test-conversation-123';
  const mockImageData = {
    base64: 'mock-base64-data',
    mimeType: 'image/png',
    dataUrl: 'data:image/png;base64,mock-base64-data',
    source: 'test-source'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing timelines
    screenshotTimelineService.clearTimeline(mockConversationId);
  });

  describe('trackSingleScreenshot', () => {
    it('should track a single screenshot as a timeline event', async () => {
      const event = await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId,
        mockImageData,
        Date.now()
      );

      expect(event).toBeDefined();
      expect(event.conversationId).toBe(mockConversationId);
      expect(event.eventType).toBe('single_shot');
      expect(event.screenshotCount).toBe(1);
      expect(event.timeWindow).toBe(1);
      expect(event.imageData).toEqual([mockImageData]);
      expect(event.context).toBe('Single screenshot showing current game state');
    });

    it('should generate unique IDs for different events', async () => {
      const event1 = await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId,
        mockImageData,
        Date.now()
      );
      
      const event2 = await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId,
        mockImageData,
        Date.now() + 1000
      );

      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('trackMultiScreenshot', () => {
    it('should track multiple screenshots as a timeline event', async () => {
      const imageDataArray = [mockImageData, mockImageData, mockImageData];
      
      const event = await screenshotTimelineService.trackMultiScreenshot(
        mockConversationId,
        imageDataArray,
        Date.now()
      );

      expect(event).toBeDefined();
      expect(event.conversationId).toBe(mockConversationId);
      expect(event.eventType).toBe('multi_shot');
      expect(event.screenshotCount).toBe(3);
      expect(event.timeWindow).toBe(5);
      expect(event.imageData).toEqual(imageDataArray);
      expect(event.context).toBe('Multi-shot sequence: 3 screenshots showing progression over 5 minutes');
    });
  });

  describe('trackBatchUpload', () => {
    it('should track batch upload as a timeline event', async () => {
      const imageDataArray = [mockImageData, mockImageData, mockImageData, mockImageData, mockImageData];
      
      const event = await screenshotTimelineService.trackBatchUpload(
        mockConversationId,
        imageDataArray,
        Date.now()
      );

      expect(event).toBeDefined();
      expect(event.conversationId).toBe(mockConversationId);
      expect(event.eventType).toBe('batch_upload');
      expect(event.screenshotCount).toBe(5);
      expect(event.timeWindow).toBe(10); // 5 * 2 = 10, but max 10
      expect(event.imageData).toEqual(imageDataArray);
      expect(event.context).toBe('Batch upload: 5 screenshots showing progression over 10 minutes');
    });

    it('should cap time window at 10 minutes for large batches', async () => {
      const largeImageDataArray = new Array(10).fill(mockImageData);
      
      const event = await screenshotTimelineService.trackBatchUpload(
        mockConversationId,
        largeImageDataArray,
        Date.now()
      );

      expect(event.timeWindow).toBe(10); // Should be capped at 10
    });
  });

  describe('getTimelineContext', () => {
    it('should return empty string for non-existent conversation', () => {
      const context = screenshotTimelineService.getTimelineContext('non-existent');
      expect(context).toBe('');
    });

    it('should return timeline context for existing conversation', async () => {
      // Add some events
      await screenshotTimelineService.trackSingleScreenshot(mockConversationId, mockImageData);
      await screenshotTimelineService.trackMultiScreenshot(mockConversationId, [mockImageData, mockImageData]);
      
      const context = screenshotTimelineService.getTimelineContext(mockConversationId);
      
      expect(context).toContain('[META_SCREENSHOT_TIMELINE:');
      expect(context).toContain('[META_PROGRESSION_TYPE:');
      expect(context).toContain('[META_RECENT_EVENTS:');
    });
  });

  describe('getSessionStats', () => {
    it('should return null for non-existent conversation', () => {
      const stats = screenshotTimelineService.getSessionStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should return session statistics for existing conversation', async () => {
      // Add some events
      await screenshotTimelineService.trackSingleScreenshot(mockConversationId, mockImageData);
      await screenshotTimelineService.trackMultiScreenshot(mockConversationId, [mockImageData, mockImageData]);
      
      const stats = screenshotTimelineService.getSessionStats(mockConversationId);
      
      expect(stats).toBeDefined();
      expect(stats.conversationId).toBe(mockConversationId);
      expect(stats.totalScreenshots).toBe(3); // 1 + 2
      expect(stats.eventTypeCounts).toHaveProperty('single_shot');
      expect(stats.eventTypeCounts).toHaveProperty('multi_shot');
      expect(stats.eventTypeCounts.single_shot).toBe(1);
      expect(stats.eventTypeCounts.multi_shot).toBe(1);
    });
  });

  describe('clearTimeline', () => {
    it('should clear timeline for a conversation', async () => {
      // Add an event
      await screenshotTimelineService.trackSingleScreenshot(mockConversationId, mockImageData);
      
      // Verify it exists
      let context = screenshotTimelineService.getTimelineContext(mockConversationId);
      expect(context).not.toBe('');
      
      // Clear it
      screenshotTimelineService.clearTimeline(mockConversationId);
      
      // Verify it's gone
      context = screenshotTimelineService.getTimelineContext(mockConversationId);
      expect(context).toBe('');
    });
  });

  describe('cleanupOldTimelines', () => {
    it('should clean up old timelines', async () => {
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      
      // Add an old event
      await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId,
        mockImageData,
        oldTimestamp
      );
      
      // Verify it exists
      let context = screenshotTimelineService.getTimelineContext(mockConversationId);
      expect(context).not.toBe('');
      
      // Clean up old timelines
      screenshotTimelineService.cleanupOldTimelines();
      
      // Verify it's gone
      context = screenshotTimelineService.getTimelineContext(mockConversationId);
      expect(context).toBe('');
    });
  });
});
