import { supabase } from './supabase';
import { authService } from './supabase';
import { unifiedUsageService } from './unifiedUsageService';
import { unifiedDataService } from './unifiedDataService';
import { ServiceFactory, BaseService } from './ServiceFactory';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * 🎯 UNIFIED ANALYTICS SERVICE
 * 
 * This service consolidates all analytics functionality from:
 * - analyticsService.ts (General analytics)
 * - gameAnalyticsService.ts (Game-specific analytics)
 * - feedbackAnalyticsService.ts (Feedback analytics)
 * - pwaAnalyticsService.ts (PWA analytics)
 * 
 * Features:
 * 1. Centralized event tracking across all features
 * 2. Cross-feature analytics and insights
 * 3. User behavior analysis and patterns
 * 4. Performance monitoring and optimization
 * 5. Tier-based analytics and usage patterns
 * 6. Export and reporting capabilities
 */

// ===== CORE ANALYTICS INTERFACES =====

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  category: 'onboarding' | 'feature_usage' | 'game_activity' | 'feedback' | 'pwa' | 'performance' | 'user_behavior';
  timestamp: number;
  userId?: string;
  sessionId: string;
  metadata: Record<string, any>;
  userTier?: string;
  platform?: string;
  version?: string;
}

export interface OnboardingEvent extends AnalyticsEvent {
  category: 'onboarding';
  stepName: string;
  stepOrder: number;
  completionTime?: number;
  skipped?: boolean;
}

export interface FeatureUsageEvent extends AnalyticsEvent {
  category: 'feature_usage';
  featureName: string;
  featureCategory: 'chat' | 'insights' | 'tasks' | 'profile' | 'settings' | 'upgrade' | 'other';
  action: 'view' | 'click' | 'interact' | 'complete' | 'abandon';
  duration?: number;
  success?: boolean;
}

export interface GameActivityEvent extends AnalyticsEvent {
  category: 'game_activity';
  activityType: 'pill_created' | 'pill_deleted' | 'pill_modified' |
                'insight_created' | 'insight_deleted' | 'insight_modified' |
                'insight_tab_created' | 'insight_tab_deleted' | 'insight_tab_modified' |
                'insight_content_updated' | 'insight_feedback_given' |
                'game_progress_updated' | 'inventory_changed' | 'objective_set';
  gameId: string;
  gameTitle?: string;
  conversationId: string;
  insightId?: string;
  pillId?: string;
  oldValue?: any;
  newValue?: any;
}

export interface FeedbackEvent extends AnalyticsEvent {
  category: 'feedback';
  feedbackType: 'message' | 'insight' | 'feature' | 'bug' | 'suggestion';
  vote?: 'up' | 'down' | 'neutral';
  rating?: number;
  messageId?: string;
  insightId?: string;
  content?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface PWAEvent extends AnalyticsEvent {
  category: 'pwa';
  eventType: 'install' | 'launch' | 'shortcut_used' | 'offline_usage' | 'update_available';
  success?: boolean;
  method?: string;
  timeToInstall?: number;
  sessionDuration?: number;
  offlineDuration?: number;
}

export interface PerformanceEvent extends AnalyticsEvent {
  category: 'performance';
  metric: 'response_time' | 'cache_hit_rate' | 'error_rate' | 'memory_usage' | 'bundle_size';
  value: number;
  unit: 'ms' | 'percentage' | 'mb' | 'kb';
  context?: string;
}

// ===== ANALYTICS INSIGHTS INTERFACES =====

export interface UserBehaviorInsights {
  userId: string;
  totalSessions: number;
  averageSessionDuration: number;
  mostUsedFeatures: string[];
  preferredGameGenres: string[];
  usagePatterns: {
    peakHours: number[];
    averageDailyUsage: number;
    weeklyPattern: Record<string, number>;
  };
  engagementScore: number;
  lastActive: number;
}

export interface FeatureUsageStats {
  featureName: string;
  totalUsage: number;
  uniqueUsers: number;
  averageUsagePerUser: number;
  successRate: number;
  mostActiveUsers: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastWeekUsage: number;
  lastMonthUsage: number;
}

export interface OnboardingFunnelStats {
  stepName: string;
  stepOrder: number;
  totalUsers: number;
  completedUsers: number;
  skippedUsers: number;
  completionRate: number;
  averageTimeToComplete: number;
  dropoffRate: number;
  nextStepConversion: number;
}

export interface GameAnalyticsInsights {
  gameId: string;
  gameTitle: string;
  totalInteractions: number;
  uniqueUsers: number;
  averageSessionLength: number;
  mostPopularFeatures: string[];
  userSatisfactionScore: number;
  commonIssues: string[];
  successRate: number;
}

export interface FeedbackInsights {
  totalFeedback: number;
  averageRating: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topIssues: string[];
  recentImprovements: string[];
  userSatisfactionTrend: 'improving' | 'declining' | 'stable';
}

export interface PWAAnalyticsInsights {
  totalInstalls: number;
  installSuccessRate: number;
  averageTimeToInstall: number;
  platformDistribution: Record<string, number>;
  engagementMetrics: {
    averageSessionDuration: number;
    dailyActiveUsers: number;
    retentionRate: number;
  };
  featureUsage: Record<string, number>;
}

// ===== UNIFIED ANALYTICS SERVICE =====

export class UnifiedAnalyticsService extends BaseService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private currentSession: {
    startTime: number;
    lastActivity: number;
    events: AnalyticsEvent[];
  };

  constructor() {
    super();
    this.sessionId = this.generateSessionId();
    this.currentSession = {
      startTime: Date.now(),
      lastActivity: Date.now(),
      events: []
    };
    
    this.initializeAnalytics();
  }

  // ===== INITIALIZATION =====

  private initializeAnalytics(): void {
    // Load existing events from storage
    this.loadEventsFromStorage();
    
    // Set up periodic event flushing
    setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds

    // Track session start
    this.trackEvent({
      eventType: 'session_start',
      category: 'user_behavior',
      timestamp: Date.now(),
      metadata: {
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  }

  // ===== CORE TRACKING METHODS =====

  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'sessionId'>): Promise<boolean> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        id: this.generateEventId(),
        sessionId: this.sessionId,
        ...event,
        timestamp: event.timestamp || Date.now(),
        userId: await this.getCurrentUserId(),
        userTier: await this.getCurrentUserTier(),
        platform: this.getPlatform(),
        version: this.getAppVersion()
      };

      // Add to current session
      this.currentSession.events.push(analyticsEvent);
      this.currentSession.lastActivity = Date.now();

      // Add to events array
      this.events.push(analyticsEvent);

      // Store in localStorage for persistence
      this.storeEventsInStorage();

      // Send to Supabase (async, don't wait)
      this.sendToSupabase(analyticsEvent).catch(error => {
        console.warn('Failed to send analytics event to Supabase:', error);
      });

      return true;
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      return false;
    }
  }

  // ===== ONBOARDING ANALYTICS =====

  async startOnboardingStep(stepName: string, stepOrder: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'onboarding_step_started',
      category: 'onboarding',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        stepName,
        stepOrder,
        stepStartTime: Date.now()
      }
    });
  }

  async completeOnboardingStep(stepName: string, stepOrder: number, completionTime?: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'onboarding_step_completed',
      category: 'onboarding',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        stepName,
        stepOrder,
        completionTime,
        stepEndTime: Date.now()
      }
    });
  }

  async skipOnboardingStep(stepName: string, stepOrder: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'onboarding_step_skipped',
      category: 'onboarding',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        stepName,
        stepOrder,
        skipped: true,
        skipTime: Date.now()
      }
    });
  }

  // ===== FEATURE USAGE ANALYTICS =====

  async trackFeatureUsage(featureName: string, action?: FeatureUsageEvent['action'], metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'feature_usage',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        featureName,
        featureCategory: this.categorizeFeature(featureName),
        action,
        usageTime: Date.now()
      }
    });
  }

  async trackFeatureView(featureName: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackFeatureUsage(featureName, 'view', metadata);
  }

  async trackFeatureClick(featureName: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackFeatureUsage(featureName, 'click', metadata);
  }

  async trackFeatureComplete(featureName: string, duration?: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'feature_usage',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        featureName,
        featureCategory: this.categorizeFeature(featureName),
        action: 'complete',
        duration,
        success: true,
        completionTime: Date.now()
      }
    });
  }

  // ===== GAME ACTIVITY ANALYTICS =====

  async trackGameActivity(activity: Omit<GameActivityEvent, 'id' | 'sessionId' | 'timestamp' | 'category'>): Promise<void> {
    await this.trackEvent({
      eventType: 'game_activity',
      category: 'game_activity',
      timestamp: Date.now(),
      metadata: {
        ...activity.metadata,
        activityTime: Date.now(),
        activityType: activity.activityType,
        gameId: activity.gameId,
        gameTitle: activity.gameTitle,
        conversationId: activity.conversationId,
        insightId: activity.insightId
      }
    });
  }

  async trackInsightCreation(insightId: string, gameId: string, gameTitle: string, conversationId: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'game_activity',
      category: 'game_activity',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        activityType: 'insight_created',
        gameId,
        gameTitle,
        conversationId,
        insightId,
        creationTime: Date.now()
      }
    });
  }

  async trackInsightFeedback(insightId: string, gameId: string, conversationId: string, vote: 'up' | 'down', metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'game_activity',
      category: 'game_activity',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        activityType: 'insight_feedback_given',
        gameId,
        conversationId,
        insightId,
        feedbackTime: Date.now(),
        vote
      }
    });
  }

  // ===== FEEDBACK ANALYTICS =====

  async trackFeedback(feedback: Omit<FeedbackEvent, 'id' | 'sessionId' | 'timestamp' | 'category'>): Promise<void> {
    await this.trackEvent({
      eventType: 'feedback_submitted',
      category: 'feedback',
      timestamp: Date.now(),
      metadata: {
        ...feedback.metadata,
        submissionTime: Date.now(),
        feedbackType: feedback.feedbackType,
        vote: feedback.vote,
        rating: feedback.rating,
        messageId: feedback.messageId,
        insightId: feedback.insightId,
        content: feedback.content,
        sentiment: feedback.sentiment
      }
    });
  }

  async trackMessageFeedback(messageId: string, vote: 'up' | 'down', content?: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'feedback_submitted',
      category: 'feedback',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        feedbackType: 'message',
        vote,
        messageId,
        content,
        sentiment: this.analyzeSentiment(content),
        feedbackTime: Date.now()
      }
    });
  }


  // ===== PWA ANALYTICS =====

  async trackPWAInstall(success: boolean, method: string, timeToInstall?: number, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'pwa_install',
      category: 'pwa',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        success,
        method,
        timeToInstall,
        installTime: Date.now()
      }
    });
  }

  async trackPWAEngagement(eventType: string, data?: any, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: `pwa_${eventType}`,
      category: 'pwa',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        ...data,
        engagementTime: Date.now()
      }
    });
  }

  async trackSessionStart(): Promise<void> {
    await this.trackPWAEngagement('session_start', {
      sessionDuration: 0
    });
  }

  async trackSessionEnd(): Promise<void> {
    const sessionDuration = Date.now() - this.currentSession.startTime;
    await this.trackPWAEngagement('session_end', {
      sessionDuration
    });
  }

  // ===== PERFORMANCE ANALYTICS =====

  async trackPerformance(metric: PerformanceEvent['metric'], value: number, unit: PerformanceEvent['unit'], context?: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventType: 'performance_metric',
      category: 'performance',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        metric,
        value,
        unit,
        context,
        measurementTime: Date.now()
      }
    });
  }

  // ===== ANALYTICS INSIGHTS =====

  async getUserBehaviorInsights(userId: string): Promise<UserBehaviorInsights | null> {
    try {
      const userEvents = this.events.filter(event => event.userId === userId);
      
      if (userEvents.length === 0) return null;

      const sessions = this.groupEventsBySession(userEvents);
      const featureUsage = this.analyzeFeatureUsage(userEvents);
      const usagePatterns = this.analyzeUsagePatterns(userEvents);

      return {
        userId,
        totalSessions: sessions.length,
        averageSessionDuration: this.calculateAverageSessionDuration(sessions),
        mostUsedFeatures: featureUsage.mostUsed,
        preferredGameGenres: this.analyzeGamePreferences(userEvents),
        usagePatterns,
        engagementScore: this.calculateEngagementScore(userEvents),
        lastActive: Math.max(...userEvents.map(e => e.timestamp))
      };
    } catch (error) {
      console.error('Failed to get user behavior insights:', error);
      return null;
    }
  }

  async getFeatureUsageStats(featureName?: string): Promise<FeatureUsageStats[]> {
    try {
      const featureEvents = this.events.filter(event => 
        event.category === 'feature_usage' && 
        (!featureName || (event as FeatureUsageEvent).featureName === featureName)
      );

      const features = new Map<string, FeatureUsageStats>();

      featureEvents.forEach(event => {
        const featureEvent = event as FeatureUsageEvent;
        const name = featureEvent.featureName;
        
        if (!features.has(name)) {
          features.set(name, {
            featureName: name,
            totalUsage: 0,
            uniqueUsers: 0,
            averageUsagePerUser: 0,
            successRate: 0,
            mostActiveUsers: 0,
            trend: 'stable',
            lastWeekUsage: 0,
            lastMonthUsage: 0
          });
        }

        const stats = features.get(name)!;
        stats.totalUsage++;
        
        if (featureEvent.success) {
          stats.successRate = (stats.successRate + 1) / 2;
        }
      });

      return Array.from(features.values());
    } catch (error) {
      console.error('Failed to get feature usage stats:', error);
      return [];
    }
  }

  async getOnboardingFunnelStats(startDate?: Date, endDate?: Date): Promise<OnboardingFunnelStats[]> {
    try {
      const onboardingEvents = this.events.filter(event => 
        event.category === 'onboarding' &&
        (!startDate || event.timestamp >= startDate.getTime()) &&
        (!endDate || event.timestamp <= endDate.getTime())
      );

      const steps = new Map<string, OnboardingFunnelStats>();

      onboardingEvents.forEach(event => {
        const onboardingEvent = event as OnboardingEvent;
        const stepKey = `${onboardingEvent.stepName}_${onboardingEvent.stepOrder}`;
        
        if (!steps.has(stepKey)) {
          steps.set(stepKey, {
            stepName: onboardingEvent.stepName,
            stepOrder: onboardingEvent.stepOrder,
            totalUsers: 0,
            completedUsers: 0,
            skippedUsers: 0,
            completionRate: 0,
            averageTimeToComplete: 0,
            dropoffRate: 0,
            nextStepConversion: 0
          });
        }

        const stats = steps.get(stepKey)!;
        stats.totalUsers++;

        if (onboardingEvent.eventType === 'onboarding_step_completed') {
          stats.completedUsers++;
          if (onboardingEvent.completionTime) {
            stats.averageTimeToComplete = (stats.averageTimeToComplete + onboardingEvent.completionTime) / 2;
          }
        } else if (onboardingEvent.skipped) {
          stats.skippedUsers++;
        }
      });

      // Calculate rates
      steps.forEach(stats => {
        stats.completionRate = stats.totalUsers > 0 ? stats.completedUsers / stats.totalUsers : 0;
        stats.dropoffRate = stats.totalUsers > 0 ? (stats.totalUsers - stats.completedUsers) / stats.totalUsers : 0;
      });

      return Array.from(steps.values()).sort((a, b) => a.stepOrder - b.stepOrder);
    } catch (error) {
      console.error('Failed to get onboarding funnel stats:', error);
      return [];
    }
  }

  // ===== UTILITY METHODS =====

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const authState = authService.getCurrentState();
      return authState.user?.id;
    } catch (error) {
      return undefined;
    }
  }

  private async getCurrentUserTier(): Promise<string | undefined> {
    try {
      return await unifiedUsageService.getCurrentTier();
    } catch (error) {
      return undefined;
    }
  }

  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }

  private getAppVersion(): string {
    return '1.0.0'; // This should come from package.json or build config
  }

  private categorizeFeature(featureName: string): FeatureUsageEvent['featureCategory'] {
    const name = featureName.toLowerCase();
    if (name.includes('chat') || name.includes('message')) return 'chat';
    if (name.includes('insight')) return 'insights';
    if (name.includes('task') || name.includes('todo')) return 'tasks';
    if (name.includes('profile') || name.includes('user')) return 'profile';
    if (name.includes('setting')) return 'settings';
    if (name.includes('upgrade') || name.includes('tier')) return 'upgrade';
    return 'other';
  }

  private analyzeSentiment(content?: string): 'positive' | 'negative' | 'neutral' {
    if (!content) return 'neutral';
    
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointed'];
    
    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private groupEventsBySession(events: AnalyticsEvent[]): AnalyticsEvent[][] {
    const sessions = new Map<string, AnalyticsEvent[]>();
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, []);
      }
      sessions.get(event.sessionId)!.push(event);
    });
    return Array.from(sessions.values());
  }

  private analyzeFeatureUsage(events: AnalyticsEvent[]): { mostUsed: string[] } {
    const featureCounts = new Map<string, number>();
    events.forEach(event => {
      if (event.category === 'feature_usage') {
        const featureEvent = event as FeatureUsageEvent;
        const count = featureCounts.get(featureEvent.featureName) || 0;
        featureCounts.set(featureEvent.featureName, count + 1);
      }
    });
    
    return {
      mostUsed: Array.from(featureCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name)
    };
  }

  private analyzeUsagePatterns(events: AnalyticsEvent[]): UserBehaviorInsights['usagePatterns'] {
    const hourlyUsage = new Array(24).fill(0);
    const dailyUsage = new Array(7).fill(0);
    
    events.forEach(event => {
      const date = new Date(event.timestamp);
      hourlyUsage[date.getHours()]++;
      dailyUsage[date.getDay()]++;
    });

    return {
      peakHours: hourlyUsage.map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(({ hour }) => hour),
      averageDailyUsage: events.length / 7,
      weeklyPattern: {
        sunday: dailyUsage[0],
        monday: dailyUsage[1],
        tuesday: dailyUsage[2],
        wednesday: dailyUsage[3],
        thursday: dailyUsage[4],
        friday: dailyUsage[5],
        saturday: dailyUsage[6]
      }
    };
  }

  private analyzeGamePreferences(events: AnalyticsEvent[]): string[] {
    const genreCounts = new Map<string, number>();
    events.forEach(event => {
      if (event.category === 'game_activity') {
        const gameEvent = event as GameActivityEvent;
        if (gameEvent.metadata?.genre) {
          const count = genreCounts.get(gameEvent.metadata.genre) || 0;
          genreCounts.set(gameEvent.metadata.genre, count + 1);
        }
      }
    });
    
    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
  }

  private calculateAverageSessionDuration(sessions: AnalyticsEvent[][]): number {
    if (sessions.length === 0) return 0;
    
    const durations = sessions.map(session => {
      const timestamps = session.map(event => event.timestamp);
      return Math.max(...timestamps) - Math.min(...timestamps);
    });
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private calculateEngagementScore(events: AnalyticsEvent[]): number {
    const featureEvents = events.filter(e => e.category === 'feature_usage').length;
    const gameEvents = events.filter(e => e.category === 'game_activity').length;
    const feedbackEvents = events.filter(e => e.category === 'feedback').length;
    
    return (featureEvents * 1) + (gameEvents * 2) + (feedbackEvents * 3);
  }

  // ===== STORAGE METHODS =====

  private loadEventsFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.analyticsEvents || [];
      }
    } catch (error) {
      console.warn('Failed to load analytics events from storage:', error);
    }
  }

  private storeEventsInStorage(): void {
    try {
      const data = {
        analyticsEvents: this.events.slice(-1000) // Keep only last 1000 events
      };
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to store analytics events:', error);
    }
  }

  private async sendToSupabase(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert([{
          id: event.id,
          event_type: event.eventType,
          category: event.category,
          timestamp: new Date(event.timestamp).toISOString(),
          user_id: event.userId,
          session_id: event.sessionId,
          metadata: event.metadata,
          user_tier: event.userTier,
          platform: event.platform,
          version: event.version
        }]);

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to send analytics event to Supabase:', error);
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;
    
    try {
      // Send all pending events to Supabase
      await Promise.all(this.events.map(event => this.sendToSupabase(event)));
      
      // Clear events after successful send
      this.events = [];
      this.storeEventsInStorage();
    } catch (error) {
      console.warn('Failed to flush analytics events:', error);
    }
  }

  // ===== PUBLIC API =====

  async exportAnalyticsData(): Promise<string> {
    try {
      const data = {
        events: this.events,
        session: this.currentSession,
        insights: {
          userBehavior: await this.getUserBehaviorInsights(await this.getCurrentUserId() || ''),
          featureUsage: await this.getFeatureUsageStats(),
          onboardingFunnel: await this.getOnboardingFunnelStats()
        },
        exportedAt: new Date().toISOString()
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      return '{}';
    }
  }

  clearAnalyticsData(): void {
    this.events = [];
    this.currentSession.events = [];
    this.storeEventsInStorage();
  }

  getAnalyticsSummary(): {
    totalEvents: number;
    sessionDuration: number;
    eventsThisSession: number;
    lastActivity: number;
  } {
    return {
      totalEvents: this.events.length,
      sessionDuration: Date.now() - this.currentSession.startTime,
      eventsThisSession: this.currentSession.events.length,
      lastActivity: this.currentSession.lastActivity
    };
  }

  // ===== MISSING ANALYTICS METHODS =====
  
  trackOnboardingDropOff(step: any): void {
    this.trackEvent({
      eventType: 'onboarding_drop_off',
      category: 'onboarding',
      timestamp: Date.now(),
      metadata: { step }
    });
  }


  stopFeatureTimer(featureName: string): void {
    // Simple implementation - just track that feature timer was stopped
    this.trackEvent({
      eventType: 'feature_timer_stopped',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: { featureName }
    });
  }

  // ===== MISSING METHODS (STUBS) =====

  extractGameContext(conversation: any): any {
    // Stub implementation
    return {
      gameId: conversation?.game_id || 'unknown',
      genre: 'unknown',
      platform: 'unknown'
    };
  }

  trackUserFeedback(feedback: any): void {
    this.trackEvent({
      eventType: 'user_feedback',
      category: 'feedback',
      timestamp: Date.now(),
      metadata: feedback
    });
  }

  trackUserQuery(query: any): void {
    this.trackEvent({
      eventType: 'user_query',
      category: 'user_behavior',
      timestamp: Date.now(),
      metadata: query
    });
  }

  trackKnowledgeBaseUsage(usage: any): void {
    this.trackEvent({
      eventType: 'knowledge_base_usage',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: usage
    });
  }

  trackKnowledgeLearning(learning: any): void {
    this.trackEvent({
      eventType: 'knowledge_learning',
      category: 'user_behavior',
      timestamp: Date.now(),
      metadata: learning
    });
  }

  // Additional missing methods
  trackInsightTab(tab: any): void {
    this.trackEvent({
      eventType: 'insight_tab',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: tab
    });
  }

  trackInsightModification(modification: any): void {
    this.trackEvent({
      eventType: 'insight_modification',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: modification
    });
  }

  trackInsightCreated(insight: any): void {
    this.trackEvent({
      eventType: 'insight_created',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: insight
    });
  }

  trackAIResponseFeedback(feedback: any): void {
    this.trackEvent({
      eventType: 'ai_response_feedback',
      category: 'feedback',
      timestamp: Date.now(),
      metadata: feedback
    });
  }

  startFeatureTimer(featureName: string): void {
    this.trackEvent({
      eventType: 'feature_timer_started',
      category: 'feature_usage',
      timestamp: Date.now(),
      metadata: { featureName }
    });
  }

  trackTierUpgradeAttempt(attempt: any): void {
    this.trackEvent({
      eventType: 'tier_upgrade_attempt',
      category: 'user_behavior',
      timestamp: Date.now(),
      metadata: attempt
    });
  }

  getTierConversionStats(startDate: Date, endDate: Date): any {
    console.log('UnifiedAnalyticsService.getTierConversionStats (stub):', startDate, endDate);
    return { stats: 'stub stats' };
  }

  // getFeatureUsageStats method removed - duplicate implementation

  // ===== CLEANUP =====

  cleanup(): void {
    console.log('🧹 UnifiedAnalyticsService: Cleanup called');
    this.flushEvents();
    this.events = [];
    this.currentSession.events = [];
  }
}

// Export lazy singleton instance - only creates when first accessed
let _unifiedAnalyticsService: UnifiedAnalyticsService | null = null;
export const unifiedAnalyticsService = (): UnifiedAnalyticsService => {
  if (!_unifiedAnalyticsService) {
    _unifiedAnalyticsService = ServiceFactory.create(UnifiedAnalyticsService);
  }
  return _unifiedAnalyticsService;
};
