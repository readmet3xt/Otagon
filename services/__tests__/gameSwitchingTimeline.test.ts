import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screenshotTimelineService } from '../screenshotTimelineService';

// Mock the long-term memory service
vi.mock('../longTermMemoryService', () => ({
  longTermMemoryService: {
    trackInteraction: vi.fn(),
  }
}));

describe('Game Switching Timeline Integration', () => {
  const mockConversationId1 = 'test-conversation-1';
  const mockConversationId2 = 'test-conversation-2';
  const mockGameName1 = 'Elden Ring';
  const mockGameName2 = 'Cyberpunk 2077';
  const mockGameId1 = 'elden-ring';
  const mockGameId2 = 'cyberpunk-2077';
  
  const mockImageData = {
    base64: 'mock-base64-data',
    mimeType: 'image/png',
    dataUrl: 'data:image/png;base64,mock-base64-data',
    source: 'test-source'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing timelines
    screenshotTimelineService.clearTimeline(mockConversationId1);
    screenshotTimelineService.clearTimeline(mockConversationId2);
  });

  describe('Game Switch Tracking', () => {
    it('should track game switch between conversations', async () => {
      // Add a screenshot to the first conversation
      await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId1,
        mockImageData,
        Date.now(),
        mockGameId1,
        mockGameName1
      );

      // Simulate game switch
      await screenshotTimelineService.handleGameSwitch(
        mockConversationId1,
        mockConversationId2,
        mockGameName2,
        mockGameId2
      );

      // Check that the last event in conversation 1 is marked as a game switch
      const timeline1 = screenshotTimelineService.getDetailedTimeline(mockConversationId1);
      const lastEvent = timeline1[timeline1.length - 1];
      
      expect(lastEvent).toBeDefined();
      expect(lastEvent?.isGameSwitch).toBe(true);
      expect(lastEvent?.gameId).toBe(mockGameId2);
      expect(lastEvent?.gameName).toBe(mockGameName2);
      expect(lastEvent?.context).toContain('Game switch');
      expect(lastEvent?.context).toContain(mockGameName2);
    });

    it('should initialize timeline for new conversation after game switch', async () => {
      // Add a screenshot to the first conversation
      await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId1,
        mockImageData,
        Date.now(),
        mockGameId1,
        mockGameName1
      );

      // Simulate game switch
      await screenshotTimelineService.handleGameSwitch(
        mockConversationId1,
        mockConversationId2,
        mockGameName2,
        mockGameId2
      );

      // Check that timeline exists for the new conversation
      const timeline2 = screenshotTimelineService.getDetailedTimeline(mockConversationId2);
      expect(timeline2).toBeDefined();
      expect(Array.isArray(timeline2)).toBe(true);
    });
  });

  describe('Game-Specific Timeline Context', () => {
    it('should generate game-specific timeline context', async () => {
      // Add screenshots for different games
      await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId1,
        mockImageData,
        Date.now(),
        mockGameId1,
        mockGameName1
      );

      await screenshotTimelineService.trackMultiScreenshot(
        mockConversationId1,
        [mockImageData, mockImageData],
        Date.now() + 1000,
        mockGameId1,
        mockGameName1
      );

      // Get game-specific context
      const gameContext = screenshotTimelineService.getGameSpecificTimelineContext(
        mockConversationId1,
        mockGameName1
      );

      expect(gameContext).toContain(`[META_GAME_SPECIFIC_TIMELINE:`);
      expect(gameContext).toContain(mockGameName1);
      expect(gameContext).toContain('3 screenshots'); // 1 single + 2 multi
    });

    it('should return empty string for non-existent game', () => {
      const gameContext = screenshotTimelineService.getGameSpecificTimelineContext(
        mockConversationId1,
        'Non-existent Game'
      );

      expect(gameContext).toBe('');
    });
  });

  describe('Timeline Context with Game Switching', () => {
    it('should include game switch information in timeline context', async () => {
      // Add a screenshot
      await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId1,
        mockImageData,
        Date.now(),
        mockGameId1,
        mockGameName1
      );

      // Simulate game switch
      await screenshotTimelineService.handleGameSwitch(
        mockConversationId1,
        mockConversationId2,
        mockGameName2,
        mockGameId2
      );

      // Get timeline context
      const context = screenshotTimelineService.getTimelineContext(mockConversationId1);

      expect(context).toContain('[META_GAME_SWITCH:');
      expect(context).toContain(mockGameName2);
      expect(context).toContain('[META_CURRENT_GAME:');
    });

    it('should track recent game switches', async () => {
      // Add screenshots and game switches
      await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId1,
        mockImageData,
        Date.now(),
        mockGameId1,
        mockGameName1
      );

      await screenshotTimelineService.handleGameSwitch(
        mockConversationId1,
        mockConversationId2,
        mockGameName2,
        mockGameId2
      );

      await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId1,
        mockImageData,
        Date.now() + 2000,
        mockGameId1,
        mockGameName1
      );

      await screenshotTimelineService.handleGameSwitch(
        mockConversationId1,
        mockConversationId2,
        mockGameName2,
        mockGameId2
      );

      // Get timeline context
      const context = screenshotTimelineService.getTimelineContext(mockConversationId1);

      expect(context).toContain('[META_RECENT_GAME_SWITCHES:');
      expect(context).toContain(mockGameName2);
    });
  });

  describe('Enhanced Screenshot Tracking with Game Info', () => {
    it('should track single screenshot with game information', async () => {
      const event = await screenshotTimelineService.trackSingleScreenshot(
        mockConversationId1,
        mockImageData,
        Date.now(),
        mockGameId1,
        mockGameName1,
        true // isGameSwitch
      );

      expect(event.gameId).toBe(mockGameId1);
      expect(event.gameName).toBe(mockGameName1);
      expect(event.isGameSwitch).toBe(true);
      expect(event.context).toContain(mockGameName1);
    });

    it('should track multi-screenshot with game information', async () => {
      const imageDataArray = [mockImageData, mockImageData, mockImageData];
      
      const event = await screenshotTimelineService.trackMultiScreenshot(
        mockConversationId1,
        imageDataArray,
        Date.now(),
        mockGameId1,
        mockGameName1,
        true // isGameSwitch
      );

      expect(event.gameId).toBe(mockGameId1);
      expect(event.gameName).toBe(mockGameName1);
      expect(event.isGameSwitch).toBe(true);
      expect(event.context).toContain(mockGameName1);
      expect(event.context).toContain('3 screenshots');
    });
  });

  describe('Error Handling', () => {
    it('should handle game switch gracefully when no previous events exist', async () => {
      // Try to handle game switch with no previous events
      await screenshotTimelineService.handleGameSwitch(
        mockConversationId1,
        mockConversationId2,
        mockGameName2,
        mockGameId2
      );

      // Should not throw error and should initialize timeline for new conversation
      const timeline2 = screenshotTimelineService.getDetailedTimeline(mockConversationId2);
      expect(timeline2).toBeDefined();
      expect(Array.isArray(timeline2)).toBe(true);
    });

    it('should handle game switch gracefully when timeline is empty', async () => {
      // Initialize empty timeline
      screenshotTimelineService.clearTimeline(mockConversationId1);

      // Try to handle game switch
      await screenshotTimelineService.handleGameSwitch(
        mockConversationId1,
        mockConversationId2,
        mockGameName2,
        mockGameId2
      );

      // Should not throw error
      expect(true).toBe(true); // Test passes if no error is thrown
    });
  });
});
