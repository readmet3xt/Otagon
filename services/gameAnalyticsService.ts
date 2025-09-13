// Stub service for gameAnalyticsService
// This is a placeholder implementation

export interface GameActivity {
  id: string;
  type: string;
  activityType?: string; // Legacy property
  gameId?: string; // Legacy property
  gameTitle?: string; // Legacy property
  conversationId?: string; // Legacy property
  pillId?: string; // For pill-related activities
  insightId?: string; // For insight-related activities
  oldValue?: any; // For tracking changes
  newValue?: any; // For tracking changes
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface InsightTab {
  id: string;
  title: string;
  content?: string;
  tabType?: string; // Legacy property
}

export interface InsightModification {
  id: string;
  type: string;
  timestamp: number;
  data?: any;
}

export interface UserFeedback {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  feedbackType?: string;
  content?: string;
  timestamp: number;
  conversationId?: string;
  targetType?: string; // Legacy property
  targetId?: string; // Legacy property
  feedbackText?: string; // Legacy property
  metadata?: Record<string, any>;
}

export interface ApiCall {
  id: string;
  endpoint: string;
  apiEndpoint?: string; // Legacy property
  apiMethod?: string; // Legacy property
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  requestSizeBytes?: number; // Legacy property
  responseSizeBytes?: number; // Legacy property
  responseTimeMs?: number; // Legacy property
}

export interface UserQuery {
  id: string;
  query: string;
  response?: string;
  timestamp: number;
  duration?: number;
}

class GameAnalyticsService {
  private static instance: GameAnalyticsService;

  static getInstance(): GameAnalyticsService {
    if (!GameAnalyticsService.instance) {
      GameAnalyticsService.instance = new GameAnalyticsService();
    }
    return GameAnalyticsService.instance;
  }

  // Stub methods
  trackActivity(activity: Omit<GameActivity, 'id' | 'timestamp'>): void {
    console.log('GameAnalyticsService.trackActivity (stub):', activity);
  }

  trackInsightModification(modification: Omit<InsightModification, 'id' | 'timestamp'>): void {
    console.log('GameAnalyticsService.trackInsightModification (stub):', modification);
  }

  trackUserFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void {
    console.log('GameAnalyticsService.trackUserFeedback (stub):', feedback);
  }

  trackApiCall(call: Omit<ApiCall, 'id' | 'timestamp'>): void {
    console.log('GameAnalyticsService.trackApiCall (stub):', call);
  }

  trackUserQuery(query: Omit<UserQuery, 'id' | 'timestamp'>): void {
    console.log('GameAnalyticsService.trackUserQuery (stub):', query);
  }

  getActivities(): GameActivity[] {
    return [];
  }

  getInsightModifications(): InsightModification[] {
    return [];
  }

  getUserFeedback(): UserFeedback[] {
    return [];
  }

  getApiCalls(): ApiCall[] {
    return [];
  }

  getUserQueries(): UserQuery[] {
    return [];
  }

  // Additional missing methods
  trackAIResponseFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void;
  trackAIResponseFeedback(messageId: string, feedbackType: string, vote: string, aiResponseContext: any, metadata: any): void;
  trackAIResponseFeedback(feedbackOrMessageId: Omit<UserFeedback, 'id' | 'timestamp'> | string, feedbackType?: string, vote?: string, aiResponseContext?: any, metadata?: any): void {
    if (typeof feedbackOrMessageId === 'string') {
      console.log('GameAnalyticsService.trackAIResponseFeedback (stub):', feedbackOrMessageId, feedbackType, vote, aiResponseContext, metadata);
    } else {
      console.log('GameAnalyticsService.trackAIResponseFeedback (stub):', feedbackOrMessageId);
    }
  }

  trackGameActivity(activity: Omit<GameActivity, 'id' | 'timestamp'>): void {
    this.trackActivity(activity);
  }

  getUserGameSummary(startDate: Date, endDate: Date): any {
    console.log('GameAnalyticsService.getUserGameSummary (stub):', startDate, endDate);
    return { summary: 'stub summary' };
  }

  getGlobalApiUsageStats(startDate: Date, endDate: Date): any {
    console.log('GameAnalyticsService.getGlobalApiUsageStats (stub):', startDate, endDate);
    return { stats: 'stub stats' };
  }

  getTierUsageComparison(startDate: Date, endDate: Date): any {
    console.log('GameAnalyticsService.getTierUsageComparison (stub):', startDate, endDate);
    return { comparison: 'stub comparison' };
  }

  // Additional missing methods
  trackPillCreated(pill: any): void;
  trackPillCreated(pill: any, gameTitle: string, conversationId: string, pillContent: string, metadata: any): void;
  trackPillCreated(pill: any, gameTitle?: string, conversationId?: string, pillContent?: string, metadata?: any): void {
    if (gameTitle) {
      console.log('GameAnalyticsService.trackPillCreated (stub):', pill, gameTitle, conversationId, pillContent, metadata);
    } else {
      console.log('GameAnalyticsService.trackPillCreated (stub):', pill);
    }
  }

  trackInsightCreated(insight: any): void;
  trackInsightCreated(insight: any, gameTitle: string, conversationId: string, insightContent: string, metadata: any): void;
  trackInsightCreated(insight: any, gameTitle?: string, conversationId?: string, insightContent?: string, metadata?: any): void {
    if (gameTitle) {
      console.log('GameAnalyticsService.trackInsightCreated (stub):', insight, gameTitle, conversationId, insightContent, metadata);
    } else {
      console.log('GameAnalyticsService.trackInsightCreated (stub):', insight);
    }
  }

  trackInsightTab(tab: any, action: string): void;
  trackInsightTab(tab: any, action: string, tabId: string, tabTitle: string, tabType: string, metadata: any): void;
  trackInsightTab(tab: any, action: string, tabId?: string, tabTitle?: string, tabType?: string, metadata?: any): void {
    if (tabId) {
      console.log('GameAnalyticsService.trackInsightTab (stub):', tab, action, tabId, tabTitle, tabType, metadata);
    } else {
      console.log('GameAnalyticsService.trackInsightTab (stub):', tab, action);
    }
  }

  trackInsightTabCreated(tab: any): void {
    console.log('GameAnalyticsService.trackInsightTabCreated (stub):', tab);
  }

}

export const gameAnalyticsService = GameAnalyticsService.getInstance();
