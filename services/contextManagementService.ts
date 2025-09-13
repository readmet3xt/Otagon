import { ConversationContext, ChatMessage } from './types';
import { supabase } from './supabase';

class ContextManagementService {
  private static instance: ContextManagementService;
  private conversationContexts: Map<string, ConversationContext> = new Map();
  
  static getInstance(): ContextManagementService {
    if (!ContextManagementService.instance) {
      ContextManagementService.instance = new ContextManagementService();
    }
    return ContextManagementService.instance;
  }

  // Initialize or update conversation context
  initializeConversationContext(
    conversationId: string,
    gameId: string | null = null
  ): ConversationContext {
    
    const existing = this.conversationContexts.get(conversationId);
    const now = Date.now();
    
    if (existing) {
      // Update existing context
      existing.lastInteraction = now;
      existing.messageHistory = existing.messageHistory.slice(-10); // Keep last 10 messages
      return existing;
    }
    
    // Create new context
    const newContext: ConversationContext = {
      conversationId,
      gameId,
      lastInteraction: now,
      sessionStart: now,
      messageHistory: [],
      userIntent: 'new_query',
      contextTags: {}
    };
    
    this.conversationContexts.set(conversationId, newContext);
    return newContext;
  }

  // Analyze user intent based on message and context
  analyzeUserIntent(
    conversationId: string,
    message: string,
    previousMessages: ChatMessage[]
  ): 'new_query' | 'clarification' | 'follow_up' | 'game_switch' {
    
    const context = this.conversationContexts.get(conversationId);
    if (!context) return 'new_query';

    // Check for game switching
    const gameSwitchIndicators = [
      'switch to', 'play', 'start', 'begin', 'new game',
      'let\'s play', 'i want to play', 'can we play',
      'change to', 'move to', 'go to game'
    ];
    
    const isGameSwitch = gameSwitchIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
    
    if (isGameSwitch) {
      context.userIntent = 'game_switch';
      return 'game_switch';
    }

    // Check for follow-up questions
    const followUpIndicators = [
      'what about', 'how do i', 'can you explain', 'tell me more',
      'what next', 'and then', 'also', 'additionally', 'more details',
      'expand on', 'elaborate', 'go deeper', 'continue',
      'what else', 'anything else', 'other options'
    ];
    
    const isFollowUp = followUpIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
    
    if (isFollowUp) {
      context.userIntent = 'follow_up';
      return 'follow_up';
    }

    // Check for clarification requests
    const clarificationIndicators = [
      'i don\'t understand', 'can you clarify', 'what do you mean',
      'i\'m confused', 'explain better', 'not clear', 'unclear',
      'what does that mean', 'i don\'t get it', 'huh?',
      'i\'m lost', 'help me understand', 'break it down'
    ];
    
    const isClarification = clarificationIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
    
    if (isClarification) {
      context.userIntent = 'clarification';
      return 'clarification';
    }

    // Default to new query
    context.userIntent = 'new_query';
    return 'new_query';
  }

  // Add message to conversation history
  addMessageToHistory(conversationId: string, message: string): void {
    const context = this.conversationContexts.get(conversationId);
    if (context) {
      context.messageHistory.push(message);
      context.messageHistory = context.messageHistory.slice(-10); // Keep last 10
      context.lastInteraction = Date.now();
    }
  }

  // Get conversation context for AI injection
  getContextForAI(conversationId: string): string {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return '';

    const sessionDuration = Math.floor((Date.now() - context.sessionStart) / 60000);
    const timeSinceLastInteraction = Math.floor((Date.now() - context.lastInteraction) / 60000);

    let contextString = '';
    
    // Session context
    contextString += `[META_SESSION_DURATION: ${sessionDuration} minutes]\n`;
    contextString += `[META_TIME_SINCE_LAST_INTERACTION: ${timeSinceLastInteraction} minutes]\n`;
    
    // Intent context
    contextString += `[META_USER_INTENT: ${context.userIntent}]\n`;
    
    // Message history context (last 3 messages)
    if (context.messageHistory.length > 0) {
      const recentMessages = context.messageHistory.slice(-3);
      contextString += `[META_RECENT_MESSAGE_HISTORY: ${recentMessages.join(' | ')}]\n`;
    }
    
    // Game context
    if (context.gameId) {
      contextString += `[META_CURRENT_GAME_ID: ${context.gameId}]\n`;
    }
    
    return contextString;
  }

  // Detect session continuation
  isSessionContinuation(conversationId: string): boolean {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return false;
    
    // EXTENDED: If more than 30 days have passed, consider it a new session (was 30 minutes)
    const timeSinceLastInteraction = Date.now() - context.lastInteraction;
    return timeSinceLastInteraction < 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  // Get session summary
  getSessionSummary(conversationId: string): string {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return '';
    
    const sessionDuration = Math.floor((Date.now() - context.sessionStart) / 60000);
    const messageCount = context.messageHistory.length;
    
    return `Session Duration: ${sessionDuration} minutes | Messages: ${messageCount} | Intent: ${context.userIntent}`;
  }

  // Update game ID for a conversation
  updateGameId(conversationId: string, gameId: string | null): void {
    const context = this.conversationContexts.get(conversationId);
    if (context) {
      context.gameId = gameId;
    }
  }

  // Get all active conversation contexts
  getActiveConversations(): ConversationContext[] {
    return Array.from(this.conversationContexts.values());
  }

  // Clean up old contexts (older than 30 days)
  cleanupOldContexts(): void {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000; // EXTENDED: 30 days instead of 24 hours
    
    for (const [conversationId, context] of this.conversationContexts.entries()) {
      if (now - context.lastInteraction > thirtyDays) {
        this.conversationContexts.delete(conversationId);
      }
    }
  }

  // NEW: Long-term session restoration from database
  async restoreLongTermSession(conversationId: string): Promise<ConversationContext | null> {
    try {
      // Try to restore from database first
      const dbContext = await this.getContextFromDatabase(conversationId);
      if (dbContext) {
        this.conversationContexts.set(conversationId, dbContext);
        return dbContext;
      }
      
      // Fallback to localStorage
      const localContext = this.getContextFromLocalStorage(conversationId);
      if (localContext) {
        this.conversationContexts.set(conversationId, localContext);
        return localContext;
      }
      
      return null;
    } catch (error) {
      console.error('Error restoring long-term session:', error);
      return null;
    }
  }

  // NEW: Save context to database for long-term persistence
  async saveContextToDatabase(conversationId: string): Promise<void> {
    const context = this.conversationContexts.get(conversationId);
    if (!context) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Save to conversations.context JSONB field
      await supabase
        .from('conversations')
        .update({
          context: {
            ...context,
            lastSaved: Date.now(),
            version: '2.0' // Version for future updates
          }
        })
        .eq('id', conversationId)
        .eq('user_id', user.id);
        
    } catch (error) {
      console.error('Error saving context to database:', error);
    }
  }

  // NEW: Get context from database
  private async getContextFromDatabase(conversationId: string): Promise<ConversationContext | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('conversations')
        .select('context')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      
      if (error || !data?.context) return null;
      
      return data.context as ConversationContext;
    } catch (error) {
      console.error('Error getting context from database:', error);
      return null;
    }
  }

  // NEW: Get context from localStorage (fallback)
  private getContextFromLocalStorage(conversationId: string): ConversationContext | null {
    try {
      const key = `otakon_context_${conversationId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting context from localStorage:', error);
      return null;
    }
  }

  // NEW: Save context to localStorage (fallback)
  private saveContextToLocalStorage(conversationId: string, context: ConversationContext): void {
    try {
      const key = `otakon_context_${conversationId}`;
      localStorage.setItem(key, JSON.stringify(context));
    } catch (error) {
      console.error('Error saving context to localStorage:', error);
    }
  }
}

export const contextManagementService = ContextManagementService.getInstance();
