import { supabase } from './supabase';

/**
 * 🧠 LONG-TERM MEMORY SERVICE
 * 
 * Purpose: Maintain persistent session memory across extended time periods
 * Features: Session restoration, progress tracking, timeline management
 * Duration: Permanent storage with 30-day in-memory cache
 */

interface LongTermSession {
  conversationId: string;
  gameId: string;
  sessionStart: number;
  lastInteraction: number;
  totalInteractions: number;
  messageHistory: string[];
  progressHistory: ProgressEvent[];
  insightsHistory: InsightEvent[];
  timelineHistory: TimelineEvent[];
  userPreferences: any;
  gameContext: any;
  version: string;
}

interface ProgressEvent {
  timestamp: number;
  event: string;
  progress: number;
  context: string;
  confidence: number;
}

interface InsightEvent {
  timestamp: number;
  insightType: string;
  content: string;
  relevance: number;
}

interface TimelineEvent {
  timestamp: number;
  eventType: 'screenshot' | 'query' | 'progress' | 'insight' | 'screenshot_timeline';
  data: any;
  sequence: number;
}

class LongTermMemoryService {
  private static instance: LongTermMemoryService;
  private sessions: Map<string, LongTermSession> = new Map();
  
  static getInstance(): LongTermMemoryService {
    if (!LongTermMemoryService.instance) {
      LongTermMemoryService.instance = new LongTermMemoryService();
    }
    return LongTermMemoryService.instance;
  }
  
  // Initialize or restore long-term session
  async initializeLongTermSession(conversationId: string, gameId: string): Promise<LongTermSession> {
    // Try to restore from database
    let session = await this.restoreSessionFromDatabase(conversationId);
    
    if (!session) {
      // Create new long-term session
      session = {
        conversationId,
        gameId,
        sessionStart: Date.now(),
        lastInteraction: Date.now(),
        totalInteractions: 0,
        messageHistory: [],
        progressHistory: [],
        insightsHistory: [],
        timelineHistory: [],
        userPreferences: {},
        gameContext: {},
        version: '2.0'
      };
    }
    
    this.sessions.set(conversationId, session);
    return session;
  }
  
  // Track interaction with long-term memory
  async trackInteraction(
    conversationId: string,
    interactionType: 'message' | 'screenshot' | 'progress' | 'insight' | 'screenshot_timeline',
    data: any
  ): Promise<void> {
    const session = this.sessions.get(conversationId);
    if (!session) return;
    
    session.lastInteraction = Date.now();
    session.totalInteractions++;
    
    // Add to appropriate history
    switch (interactionType) {
      case 'message':
        session.messageHistory.push(data.message);
        session.messageHistory = session.messageHistory.slice(-100); // Keep last 100
        break;
      case 'screenshot':
        session.timelineHistory.push({
          timestamp: Date.now(),
          eventType: 'screenshot',
          data,
          sequence: session.timelineHistory.length + 1
        });
        break;
      case 'screenshot_timeline':
        session.timelineHistory.push({
          timestamp: Date.now(),
          eventType: 'screenshot_timeline',
          data,
          sequence: session.timelineHistory.length + 1
        });
        break;
      case 'progress':
        session.progressHistory.push({
          timestamp: Date.now(),
          event: data.event,
          progress: data.progress,
          context: data.context,
          confidence: data.confidence
        });
        break;
      case 'insight':
        session.insightsHistory.push({
          timestamp: Date.now(),
          insightType: data.type,
          content: data.content,
          relevance: data.relevance
        });
        break;
    }
    
    // Save to database periodically
    if (session.totalInteractions % 10 === 0) {
      await this.saveSessionToDatabase(session);
    }
  }
  
  // Get comprehensive session context for AI
  getLongTermContext(conversationId: string): string {
    const session = this.sessions.get(conversationId);
    if (!session) return '';
    
    const daysSinceStart = Math.floor((Date.now() - session.sessionStart) / (24 * 60 * 60 * 1000));
    const daysSinceLastInteraction = Math.floor((Date.now() - session.lastInteraction) / (24 * 60 * 60 * 1000));
    
    let context = `
[META_LONG_TERM_SESSION: Active for ${daysSinceStart} days, ${daysSinceLastInteraction} days since last interaction]
[META_TOTAL_INTERACTIONS: ${session.totalInteractions} interactions across ${daysSinceStart} days]
[META_SESSION_CONTINUITY: This is a long-term gaming session - maintain context and build upon previous interactions]
`;
    
    // Add recent progress context
    if (session.progressHistory.length > 0) {
      const recentProgress = session.progressHistory.slice(-5);
      context += `[META_RECENT_PROGRESS: ${recentProgress.map(p => `${p.event} (${p.progress}%)`).join(', ')}]\n`;
    }
    
    // Add recent insights context
    if (session.insightsHistory.length > 0) {
      const recentInsights = session.insightsHistory.slice(-3);
      context += `[META_RECENT_INSIGHTS: ${recentInsights.map(i => i.insightType).join(', ')}]\n`;
    }
    
    // Add timeline context
    if (session.timelineHistory.length > 0) {
      const recentTimeline = session.timelineHistory.slice(-10);
      context += `[META_TIMELINE_CONTEXT: ${recentTimeline.length} recent events in sequence]\n`;
    }
    
    return context;
  }
  
  // Restore session from database
  private async restoreSessionFromDatabase(conversationId: string): Promise<LongTermSession | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('conversations')
        .select('context, ai_data, messages')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) return null;
      
      // Reconstruct session from stored data
      const session: LongTermSession = {
        conversationId,
        gameId: data.context?.gameId || '',
        sessionStart: data.context?.sessionStart || Date.now(),
        lastInteraction: data.context?.lastInteraction || Date.now(),
        totalInteractions: data.context?.totalInteractions || 0,
        messageHistory: data.messages?.slice(-100) || [],
        progressHistory: data.ai_data?.progressHistory || [],
        insightsHistory: data.ai_data?.insightsHistory || [],
        timelineHistory: data.ai_data?.timelineHistory || [],
        userPreferences: data.context?.userPreferences || {},
        gameContext: data.context?.gameContext || {},
        version: data.context?.version || '1.0'
      };
      
      return session;
    } catch (error) {
      console.error('Error restoring session from database:', error);
      return null;
    }
  }
  
  // Save session to database
  private async saveSessionToDatabase(session: LongTermSession): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from('conversations')
        .update({
          context: {
            gameId: session.gameId,
            sessionStart: session.sessionStart,
            lastInteraction: session.lastInteraction,
            totalInteractions: session.totalInteractions,
            userPreferences: session.userPreferences,
            gameContext: session.gameContext,
            lastSaved: Date.now(),
            version: session.version
          },
          ai_data: {
            progressHistory: session.progressHistory,
            insightsHistory: session.insightsHistory,
            timelineHistory: session.timelineHistory,
            lastUpdated: Date.now()
          }
        })
        .eq('id', session.conversationId)
        .eq('user_id', user.id);
        
    } catch (error) {
      console.error('Error saving session to database:', error);
    }
  }

  // Get session statistics
  getSessionStats(conversationId: string): any {
    const session = this.sessions.get(conversationId);
    if (!session) return null;
    
    const daysSinceStart = Math.floor((Date.now() - session.sessionStart) / (24 * 60 * 60 * 1000));
    const daysSinceLastInteraction = Math.floor((Date.now() - session.lastInteraction) / (24 * 60 * 60 * 1000));
    
    return {
      conversationId: session.conversationId,
      gameId: session.gameId,
      daysSinceStart,
      daysSinceLastInteraction,
      totalInteractions: session.totalInteractions,
      messageCount: session.messageHistory.length,
      progressEvents: session.progressHistory.length,
      insightsCount: session.insightsHistory.length,
      timelineEvents: session.timelineHistory.length,
      version: session.version
    };
  }

  // Clean up old sessions from memory (keep database data)
  cleanupOldSessions(): void {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    for (const [conversationId, session] of this.sessions.entries()) {
      if (now - session.lastInteraction > thirtyDays) {
        // Save to database before removing from memory
        this.saveSessionToDatabase(session);
        this.sessions.delete(conversationId);
      }
    }
  }
}

export const longTermMemoryService = LongTermMemoryService.getInstance();
