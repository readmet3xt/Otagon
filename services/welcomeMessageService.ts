import { supabase } from './supabase';
import { secureConversationService } from './secureConversationService';
import { playerProfileService } from './playerProfileService';

export type WelcomeReason = 'first_run' | 'returning';

interface WelcomeDecision {
  shouldShow: boolean;
  reason: WelcomeReason | 'none';
}

class WelcomeMessageService {
  private static instance: WelcomeMessageService;

  static getInstance(): WelcomeMessageService {
    if (!WelcomeMessageService.instance) {
      WelcomeMessageService.instance = new WelcomeMessageService();
    }
    return WelcomeMessageService.instance;
  }

  async decide(): Promise<WelcomeDecision> {
    try {
      // Always show welcome message for empty conversations
      // The actual check for existing welcome messages happens in ensureInserted()
      // This method just determines the reason for the welcome message
      const shouldShow = await playerProfileService.shouldShowWelcomeMessage();
      if (shouldShow) {
        return { shouldShow: true, reason: 'first_run' };
      }
      // Even if backend says no, we still want to show welcome for empty conversations
      return { shouldShow: true, reason: 'returning' };
    } catch (error) {
      // Fallback: always show welcome message for empty conversations
      console.warn('[welcomeMessageService] decide() failed, defaulting to show welcome:', error);
      return { shouldShow: true, reason: 'returning' };
    }
  }

  getText(reason: WelcomeReason): string {
    // Can be extended for localization/A-B testing
    return 'Welcome to Otagon! I\'m your AI gaming assistant, here to help you get unstuck in games with hints, not spoilers. Upload screenshots, ask questions, or connect your PC for instant help while playing!';
  }

  private async getUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }

  private buildMessageMetadata(userId: string, conversationId: string, reason: WelcomeReason) {
    return {
      type: 'welcome',
      reason,
      messageId: `welcome:${userId}:${conversationId}`,
      createdAt: new Date().toISOString()
    };
  }

  async ensureInserted(conversationId: string, title: string): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      if (!userId) return false;

      // Decide reason based on backend flag
      const decision = await this.decide();
      const reason: WelcomeReason = decision.reason === 'none' ? 'returning' : (decision.reason as WelcomeReason);

      // Load existing conversation (if present)
      const existing = await secureConversationService.getConversation(conversationId);
      const existingMessages: any[] = existing.success && existing.conversation ? (existing.conversation.messages || []) : [];

      // Check for existing welcome by metadata
      const expectedId = `welcome:${userId}:${conversationId}`;
      const hasWelcome = existingMessages.some((m: any) => m && m.metadata && m.metadata.type === 'welcome' && m.metadata.messageId === expectedId);
      if (hasWelcome) {
        return false;
      }

      const message = {
        id: (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: 'model',
        text: this.getText(reason),
        metadata: this.buildMessageMetadata(userId, conversationId, reason)
      };

      const messagesToSave = [...existingMessages, message];

      const save = await secureConversationService.saveConversation(
        conversationId,
        title,
        messagesToSave,
        [],
        {},
        undefined,
        false,
        true
      );

      if (!save.success) {
        console.warn('[welcomeMessageService] Failed to save conversation with welcome:', save.error);
        return false;
      }

      // Update backend tracking, ignore failures
      try { await playerProfileService.updateWelcomeMessageShown(reason); } catch {}

      return true;
    } catch (error) {
      console.warn('[welcomeMessageService] ensureInserted() failed:', error);
      return false;
    }
  }
}

export const welcomeMessageService = WelcomeMessageService.getInstance();


