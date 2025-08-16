import { supabase } from './supabase';
import { Conversations, Conversation, ChatMessage } from './types';

export interface DatabaseConversation {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  progress?: number;
  inventory?: string[];
  last_trailer_timestamp?: number;
  last_interaction_timestamp?: number;
  genre?: string;
  insights?: Record<string, any>;
  insights_order?: string[];
  is_pinned?: boolean;
  active_objective?: { description: string; isCompleted: boolean; } | null;
}

export interface DatabaseUsage {
  id: string;
  user_id: string;
  text_count: number;
  image_count: number;
  text_limit: number;
  image_limit: number;
  tier: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private static instance: DatabaseService;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Conversation methods
  async saveConversations(conversations: Conversations, userId: string): Promise<boolean> {
    try {
      const conversationEntries = Object.entries(conversations).map(([id, conversation]) => ({
        id,
        user_id: userId,
        title: conversation.title,
        messages: conversation.messages,
        created_at: new Date(conversation.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
        progress: conversation.progress,
        inventory: conversation.inventory,
        last_trailer_timestamp: conversation.lastTrailerTimestamp,
        last_interaction_timestamp: conversation.lastInteractionTimestamp,
        genre: conversation.genre,
        insights: conversation.insights,
        insights_order: conversation.insightsOrder,
        is_pinned: conversation.isPinned,
        active_objective: conversation.activeObjective,
      }));

      // Upsert conversations (insert or update)
      const { error } = await supabase
        .from('conversations')
        .upsert(conversationEntries, { 
          onConflict: 'id,user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving conversations:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveConversations:', error);
      return false;
    }
  }

  async loadConversations(userId: string): Promise<Conversations> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return {};
      }

      const conversations: Conversations = {};
      
      data?.forEach((dbConversation: DatabaseConversation) => {
        conversations[dbConversation.id] = {
          id: dbConversation.id,
          title: dbConversation.title,
          messages: dbConversation.messages || [],
          createdAt: new Date(dbConversation.created_at).getTime(),
          progress: dbConversation.progress,
          inventory: dbConversation.inventory,
          lastTrailerTimestamp: dbConversation.last_trailer_timestamp,
          lastInteractionTimestamp: dbConversation.last_interaction_timestamp,
          genre: dbConversation.genre,
          insights: dbConversation.insights,
          insightsOrder: dbConversation.insights_order,
          isPinned: dbConversation.is_pinned,
          activeObjective: dbConversation.active_objective,
        };
      });

      return conversations;
    } catch (error) {
      console.error('Error in loadConversations:', error);
      return {};
    }
  }

  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return false;
    }
  }

  async updateConversation(conversation: Conversation, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          title: conversation.title,
          messages: conversation.messages,
          updated_at: new Date().toISOString(),
          progress: conversation.progress,
          inventory: conversation.inventory,
          last_trailer_timestamp: conversation.lastTrailerTimestamp,
          last_interaction_timestamp: conversation.lastInteractionTimestamp,
          genre: conversation.genre,
          insights: conversation.insights,
          insights_order: conversation.insightsOrder,
          is_pinned: conversation.isPinned,
          active_objective: conversation.activeObjective,
        })
        .eq('id', conversation.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversation:', error);
      return false;
    }
  }

    // Usage methods
  async saveUsage(usage: any, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usage')
        .upsert({
          user_id: userId,
          text_count: usage.textCount,
          image_count: usage.imageCount,
          text_limit: usage.textLimit,
          image_limit: usage.imageLimit,
          tier: usage.tier,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveUsage:', error);
      return false;
    }
  }

  async loadUsage(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('usage')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading usage:', error);
        return null;
      }

      return {
        textCount: data.text_count,
        imageCount: data.image_count,
        textLimit: data.text_limit,
        imageLimit: data.image_limit,
        tier: data.tier,
      };
    } catch (error) {
      console.error('Error in loadUsage:', error);
      return null;
    }
  }

  // Migration helper
  async migrateFromLocalStorage(userId: string): Promise<boolean> {
    try {
      // Load from localStorage
      const conversationsData = localStorage.getItem('otakonConversations');
      const usageData = localStorage.getItem('otakonUsage');

      if (conversationsData) {
        const conversations = JSON.parse(conversationsData);
        await this.saveConversations(conversations, userId);
      }

      if (usageData) {
        const usage = JSON.parse(usageData);
        await this.saveUsage(usage, userId);
      }

      return true;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return false;
    }
  }

  // Cleanup localStorage after successful migration
  async cleanupLocalStorage(): Promise<void> {
    try {
      localStorage.removeItem('otakonConversations');
      localStorage.removeItem('otakonUsage');
      localStorage.removeItem('lastConnectionCode');
      localStorage.removeItem('otakonOnboardingComplete');
      localStorage.removeItem('otakonHasConnectedBefore');
      localStorage.removeItem('otakonAuthMethod');
      localStorage.removeItem('otakonInstallDismissed');
    } catch (error) {
      console.error('Error cleaning up localStorage:', error);
    }
  }
}

export const databaseService = DatabaseService.getInstance();
