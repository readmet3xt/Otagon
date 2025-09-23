import { longTermMemoryService } from './longTermMemoryService';

/**
 * 📸 SCREENSHOT TIMELINE SERVICE
 * 
 * Purpose: Track ALL screenshots (single and multi-shot) as linear progression over time
 * Features: Chronological tracking, timeline context generation, AI awareness
 * Integration: Works with long-term memory service for persistent timeline
 */

export interface ScreenshotTimelineEvent {
  id: string;
  conversationId: string;
  timestamp: number;
  eventType: 'single_shot' | 'multi_shot' | 'batch_upload';
  screenshotCount: number;
  sequenceIndex?: number; // For multi-shot sequences
  totalInSequence?: number; // For multi-shot sequences
  timeWindow: number; // Time window in minutes (5 for multi-shot, 1 for single)
  imageData: any[];
  context: string;
  gameId?: string; // NEW: Track which game this screenshot belongs to
  gameName?: string; // NEW: Track the game name for context
  isGameSwitch?: boolean; // NEW: Indicates if this event caused a game switch
}

export interface TimelineContext {
  sessionId: string;
  gameId: string;
  totalScreenshots: number;
  recentEvents: ScreenshotTimelineEvent[];
  timeSpan: number; // Total time span in minutes
  progressionType: 'linear' | 'scattered' | 'focused';
}

class ScreenshotTimelineService {
  private static instance: ScreenshotTimelineService;
  private timelines: Map<string, ScreenshotTimelineEvent[]> = new Map();
  private sessionTimelines: Map<string, TimelineContext> = new Map();
  
  static getInstance(): ScreenshotTimelineService {
    if (!ScreenshotTimelineService.instance) {
      ScreenshotTimelineService.instance = new ScreenshotTimelineService();
    }
    return ScreenshotTimelineService.instance;
  }
  
  // Track a single screenshot as part of timeline progression
  async trackSingleScreenshot(
    conversationId: string,
    imageData: any,
    timestamp: number = Date.now(),
    gameId?: string,
    gameName?: string,
    isGameSwitch: boolean = false
  ): Promise<ScreenshotTimelineEvent> {
    const event: ScreenshotTimelineEvent = {
      id: `single_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      timestamp,
      eventType: 'single_shot',
      screenshotCount: 1,
      timeWindow: 1, // Single shot represents 1 minute of progression
      imageData: [imageData],
      context: isGameSwitch ? 
        `Single screenshot showing current game state in ${gameName || 'new game'}` :
        'Single screenshot showing current game state',
      ...(gameId && { gameId }),
      ...(gameName && { gameName }),
      isGameSwitch
    };
    
    await this.addTimelineEvent(conversationId, event);
    return event;
  }
  
  // Track multiple screenshots as a linear sequence
  async trackMultiScreenshot(
    conversationId: string,
    imageDataArray: any[],
    timestamp: number = Date.now(),
    gameId?: string,
    gameName?: string,
    isGameSwitch: boolean = false
  ): Promise<ScreenshotTimelineEvent> {
    const event: ScreenshotTimelineEvent = {
      id: `multi_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      timestamp,
      eventType: 'multi_shot',
      screenshotCount: imageDataArray.length,
      timeWindow: 5, // Multi-shot represents 5 minutes of progression
      imageData: imageDataArray,
      context: isGameSwitch ? 
        `Multi-shot sequence: ${imageDataArray.length} screenshots showing progression over 5 minutes in ${gameName || 'new game'}` :
        `Multi-shot sequence: ${imageDataArray.length} screenshots showing progression over 5 minutes`,
      ...(gameId && { gameId }),
      ...(gameName && { gameName }),
      isGameSwitch
    };
    
    await this.addTimelineEvent(conversationId, event);
    return event;
  }
  
  // Track batch upload of multiple screenshots
  async trackBatchUpload(
    conversationId: string,
    imageDataArray: any[],
    timestamp: number = Date.now()
  ): Promise<ScreenshotTimelineEvent> {
    const event: ScreenshotTimelineEvent = {
      id: `batch_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      timestamp,
      eventType: 'batch_upload',
      screenshotCount: imageDataArray.length,
      timeWindow: Math.min(imageDataArray.length * 2, 10), // 2 minutes per screenshot, max 10 minutes
      imageData: imageDataArray,
      context: `Batch upload: ${imageDataArray.length} screenshots showing progression over ${Math.min(imageDataArray.length * 2, 10)} minutes`
    };
    
    await this.addTimelineEvent(conversationId, event);
    return event;
  }
  
  // Add timeline event and update session context
  private async addTimelineEvent(conversationId: string, event: ScreenshotTimelineEvent): Promise<void> {
    // Add to local timeline
    if (!this.timelines.has(conversationId)) {
      this.timelines.set(conversationId, []);
    }
    
    const timeline = this.timelines.get(conversationId)!;
    timeline.push(event);
    
    // Keep only last 50 events to prevent memory bloat
    if (timeline.length > 50) {
      timeline.splice(0, timeline.length - 50);
    }
    
    // Update session timeline context
    await this.updateSessionTimeline(conversationId);
    
    // Track in long-term memory
    try {
      await longTermMemoryService.trackInteraction(conversationId, 'screenshot', {
        type: 'timeline_event',
        event: event,
        timeline: this.getTimelineContext(conversationId)
      });
    } catch (error) {
      console.warn('Failed to track timeline event in long-term memory:', error);
    }
  }
  
  // Update session timeline context
  private async updateSessionTimeline(conversationId: string): Promise<void> {
    const timeline = this.timelines.get(conversationId) || [];
    
    if (timeline.length === 0) return;
    
    const now = Date.now();
    const recentEvents = timeline.filter(event => now - event.timestamp < 60 * 60 * 1000); // Last hour
    
    const totalScreenshots = timeline.reduce((sum, event) => sum + event.screenshotCount, 0);
    const timeSpan = timeline.length > 0 ? 
      Math.ceil((now - timeline[0]!.timestamp) / (60 * 1000)) : 0; // Minutes
    
    // Determine progression type
    let progressionType: 'linear' | 'scattered' | 'focused' = 'scattered';
    if (recentEvents.length > 0) {
      const multiShotCount = recentEvents.filter(e => e.eventType === 'multi_shot' || e.eventType === 'batch_upload').length;
      const singleShotCount = recentEvents.filter(e => e.eventType === 'single_shot').length;
      
      if (multiShotCount > singleShotCount) {
        progressionType = 'linear';
      } else if (singleShotCount > multiShotCount * 2) {
        progressionType = 'focused';
      }
    }
    
    const context: TimelineContext = {
      sessionId: `session_${conversationId}`,
      gameId: conversationId,
      totalScreenshots,
      recentEvents,
      timeSpan,
      progressionType
    };
    
    this.sessionTimelines.set(conversationId, context);
  }
  
  // Get timeline context for AI
  getTimelineContext(conversationId: string): string {
    const context = this.sessionTimelines.get(conversationId);
    if (!context) return '';
    
    const timeline = this.timelines.get(conversationId) || [];
    const recentEvents = timeline.slice(-5); // Last 5 events
    
    let contextString = `
[META_SCREENSHOT_TIMELINE: ${context.totalScreenshots} total screenshots over ${context.timeSpan} minutes]
[META_PROGRESSION_TYPE: ${context.progressionType} progression pattern]
[META_RECENT_EVENTS: ${recentEvents.length} recent screenshot events]
`;
    
    if (recentEvents.length > 0) {
      const eventTypes = recentEvents.map(e => e.eventType).join(', ');
      const screenshotCounts = recentEvents.map(e => e.screenshotCount).join(', ');
      
      contextString += `[META_RECENT_EVENT_TYPES: ${eventTypes}]
[META_RECENT_SCREENSHOT_COUNTS: ${screenshotCounts}]
`;
      
      // Add specific context for the most recent event
      const lastEvent = recentEvents[recentEvents.length - 1];
      if (lastEvent) {
        contextString += `[META_LAST_EVENT: ${lastEvent.eventType} with ${lastEvent.screenshotCount} screenshots over ${lastEvent.timeWindow} minutes]
[META_LAST_EVENT_CONTEXT: ${lastEvent.context}]
`;
        
        // NEW: Add game switching context
        if (lastEvent.isGameSwitch && lastEvent.gameName) {
          contextString += `[META_GAME_SWITCH: User switched to ${lastEvent.gameName} - provide context for this specific game]
[META_CURRENT_GAME: ${lastEvent.gameName} - all responses should be specific to this game]
`;
        }
      }
      
      // Check for recent game switches
      const recentGameSwitches = recentEvents.filter(e => e.isGameSwitch);
      if (recentGameSwitches.length > 0) {
        const gameNames = recentGameSwitches.map(e => e.gameName).filter(Boolean);
        if (gameNames.length > 0) {
          contextString += `[META_RECENT_GAME_SWITCHES: ${gameNames.join(', ')} - user has been switching between these games]
`;
        }
      }
    }
    
    return contextString;
  }
  
  // Get detailed timeline for AI analysis
  getDetailedTimeline(conversationId: string): ScreenshotTimelineEvent[] {
    return this.timelines.get(conversationId) || [];
  }
  
  // Get session statistics
  getSessionStats(conversationId: string): any {
    const context = this.sessionTimelines.get(conversationId);
    const timeline = this.timelines.get(conversationId) || [];
    
    if (!context) return null;
    
    const eventTypeCounts = timeline.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      conversationId,
      totalScreenshots: context.totalScreenshots,
      timeSpan: context.timeSpan,
      progressionType: context.progressionType,
      eventTypeCounts,
      recentEventCount: context.recentEvents.length,
      totalEvents: timeline.length
    };
  }
  
  // Clear timeline for a conversation
  clearTimeline(conversationId: string): void {
    this.timelines.delete(conversationId);
    this.sessionTimelines.delete(conversationId);
  }
  
  // NEW: Handle game switching - update timeline context when game changes
  async handleGameSwitch(
    fromConversationId: string,
    toConversationId: string,
    gameName: string,
    gameId: string
  ): Promise<void> {
    try {
      // Get the last event from the previous conversation
      const fromTimeline = this.timelines.get(fromConversationId) || [];
      const lastEvent = fromTimeline[fromTimeline.length - 1];
      
      if (lastEvent) {
        // Mark the last event as a game switch
        lastEvent.isGameSwitch = true;
        lastEvent.gameId = gameId;
        lastEvent.gameName = gameName;
        lastEvent.context = `Game switch: ${lastEvent.context} - switched to ${gameName}`;
        
        // Update the session timeline context
        await this.updateSessionTimeline(fromConversationId);
        
        // Initialize timeline for the new conversation if it doesn't exist
        if (!this.timelines.has(toConversationId)) {
          this.timelines.set(toConversationId, []);
        }
        
        console.log(`🔄 Game switch tracked: ${fromConversationId} → ${toConversationId} (${gameName})`);
      }
    } catch (error) {
      console.warn('Failed to handle game switch in timeline:', error);
    }
  }

  // NEW: Get game-specific timeline context
  getGameSpecificTimelineContext(conversationId: string, gameName: string): string {
    const timeline = this.timelines.get(conversationId) || [];
    const gameEvents = timeline.filter(event => 
      event.gameName === gameName || event.isGameSwitch
    );
    
    if (gameEvents.length === 0) return '';
    
    const totalScreenshots = gameEvents.reduce((sum, event) => sum + event.screenshotCount, 0);
    const timeSpan = gameEvents.length > 0 ? 
      Math.ceil((Date.now() - gameEvents[0]!.timestamp) / (60 * 1000)) : 0;
    
    return `
[META_GAME_SPECIFIC_TIMELINE: ${totalScreenshots} screenshots for ${gameName} over ${timeSpan} minutes]
[META_GAME_EVENTS: ${gameEvents.length} events specific to ${gameName}]
[META_GAME_PROGRESSION: ${gameEvents.map(e => e.eventType).join(', ')}]
`;
  }

  // Clean up old timelines
  cleanupOldTimelines(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [conversationId, timeline] of this.timelines.entries()) {
      const hasRecentEvents = timeline.some(event => now - event.timestamp < oneHour);
      if (!hasRecentEvents) {
        this.timelines.delete(conversationId);
        this.sessionTimelines.delete(conversationId);
      }
    }
  }
}

export const screenshotTimelineService = ScreenshotTimelineService.getInstance();
