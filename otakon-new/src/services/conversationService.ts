import { StorageService } from './storageService';
import { Conversations, Conversation, ChatMessage, UserTier } from '../types';
import { STORAGE_KEYS, DEFAULT_CONVERSATION_TITLE, USER_TIERS } from '../constants';

// ✅ SCALABILITY: Tier-based limits for conversations and messages
const TIER_CONVERSATION_LIMITS = {
  [USER_TIERS.FREE]: 10,      // Free users: 10 conversations max
  [USER_TIERS.PRO]: 50,       // Pro users: 50 conversations max  
  [USER_TIERS.VANGUARD_PRO]: 100, // Vanguard Pro: 100 conversations max
} as const;

const TIER_MESSAGE_LIMITS = {
  [USER_TIERS.FREE]: 20,      // Free users: 20 messages per conversation
  [USER_TIERS.PRO]: 100,      // Pro users: 100 messages per conversation
  [USER_TIERS.VANGUARD_PRO]: 200, // Vanguard Pro: 200 messages per conversation
} as const;

const TIER_TOTAL_MESSAGE_LIMITS = {
  [USER_TIERS.FREE]: 200,     // Free users: 200 total messages
  [USER_TIERS.PRO]: 1000,     // Pro users: 1000 total messages
  [USER_TIERS.VANGUARD_PRO]: 2000, // Vanguard Pro: 2000 total messages
} as const;

export class ConversationService {
  // ✅ SCALABILITY: Get user tier from auth service
  private static getUserTier(): UserTier {
    try {
      // Try to get from auth service first
      const authService = require('./authService').authService;
      const user = authService.getCurrentUser();
      if (user?.tier) {
        return user.tier;
      }
    } catch (error) {
      console.warn('Could not get user tier from auth service:', error);
    }
    
    // Fallback to localStorage
    const user = StorageService.get(STORAGE_KEYS.USER, null) as any;
    return user?.tier || USER_TIERS.FREE;
  }

  // ✅ SCALABILITY: Get tier-based limits
  private static getConversationLimit(): number {
    const tier = this.getUserTier();
    return TIER_CONVERSATION_LIMITS[tier] || TIER_CONVERSATION_LIMITS[USER_TIERS.FREE];
  }

  private static getMessageLimit(): number {
    const tier = this.getUserTier();
    return TIER_MESSAGE_LIMITS[tier] || TIER_MESSAGE_LIMITS[USER_TIERS.FREE];
  }

  private static getTotalMessageLimit(): number {
    const tier = this.getUserTier();
    return TIER_TOTAL_MESSAGE_LIMITS[tier] || TIER_TOTAL_MESSAGE_LIMITS[USER_TIERS.FREE];
  }

  // ✅ SCALABILITY: Check if user can create new conversation
  static canCreateConversation(): { allowed: boolean; reason?: string } {
    const conversations = this.getConversations();
    const conversationLimit = this.getConversationLimit();
    const tier = this.getUserTier();
    
    if (Object.keys(conversations).length >= conversationLimit) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${conversationLimit} conversations for ${tier} tier. Upgrade to create more conversations.`
      };
    }
    
    return { allowed: true };
  }

  // ✅ SCALABILITY: Check if user can add message to conversation
  static canAddMessage(conversationId: string): { allowed: boolean; reason?: string } {
    const conversations = this.getConversations();
    const conversation = conversations[conversationId];
    
    if (!conversation) {
      return { allowed: false, reason: 'Conversation not found' };
    }
    
    const messageLimit = this.getMessageLimit();
    const totalMessageLimit = this.getTotalMessageLimit();
    const tier = this.getUserTier();
    
    // Check per-conversation limit
    if (conversation.messages.length >= messageLimit) {
      return {
        allowed: false,
        reason: `This conversation has reached the maximum of ${messageLimit} messages for ${tier} tier. Start a new conversation.`
      };
    }
    
    // Check total message limit across all conversations
    const totalMessages = Object.values(conversations)
      .reduce((total, conv) => total + conv.messages.length, 0);
    
    if (totalMessages >= totalMessageLimit) {
      return {
        allowed: false,
        reason: `You've reached the maximum of ${totalMessageLimit} total messages for ${tier} tier. Upgrade to send more messages.`
      };
    }
    
    return { allowed: true };
  }

  static getConversations(): Conversations {
    const conversations = StorageService.get(STORAGE_KEYS.CONVERSATIONS, {}) as Conversations;
    
    // Migration: Update existing "General Chat" titles to "Everything else" (one-time migration)
    let needsUpdate = false;
    Object.values(conversations).forEach((conv: Conversation) => {
      if (conv.title === 'General Chat') {
        conv.title = 'Everything else';
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      this.setConversations(conversations);
    }
    
    // ✅ SCALABILITY: Enforce tier-based conversation limits
    const conversationArray = Object.values(conversations);
    const conversationLimit = this.getConversationLimit();
    
    if (conversationArray.length > conversationLimit) {
      // Keep only the most recent conversations
      const sortedConversations = conversationArray
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, conversationLimit);
      
      const limitedConversations: Conversations = {};
      sortedConversations.forEach(conv => {
        limitedConversations[conv.id] = conv;
      });
      
      this.setConversations(limitedConversations);
      return limitedConversations;
    }
    
    return conversations;
  }

  static setConversations(conversations: Conversations): void {
    StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);
  }

  static createConversation(title?: string): Conversation {
    const now = Date.now();
    const id = `conv_${now}`;
    
    return {
      id,
      title: title || DEFAULT_CONVERSATION_TITLE,
      messages: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
  }

  static addConversation(conversation: Conversation): { success: boolean; reason?: string } {
    // ✅ SCALABILITY: Check if user can create conversation
    const canCreate = this.canCreateConversation();
    if (!canCreate.allowed) {
      return { success: false, reason: canCreate.reason };
    }
    
    const conversations = this.getConversations();
    const conversationLimit = this.getConversationLimit();
    
    // If at limit, remove oldest conversation
    if (Object.keys(conversations).length >= conversationLimit) {
      const oldestConversation = Object.values(conversations)
        .sort((a, b) => a.updatedAt - b.updatedAt)[0];
      delete conversations[oldestConversation.id];
    }
    
    conversations[conversation.id] = conversation;
    this.setConversations(conversations);
    return { success: true };
  }

  static updateConversation(id: string, updates: Partial<Conversation>): void {
    const conversations = this.getConversations();
    if (conversations[id]) {
      conversations[id] = {
        ...conversations[id],
        ...updates,
        updatedAt: Date.now(),
      };
      this.setConversations(conversations);
    }
  }

  static deleteConversation(id: string): void {
    const conversations = this.getConversations();
    delete conversations[id];
    this.setConversations(conversations);
  }

  static addMessage(conversationId: string, message: ChatMessage): { success: boolean; reason?: string } {
    // ✅ SCALABILITY: Check if user can add message
    const canAdd = this.canAddMessage(conversationId);
    if (!canAdd.allowed) {
      return { success: false, reason: canAdd.reason };
    }
    
    const conversations = this.getConversations();
    if (conversations[conversationId]) {
      const conversation = conversations[conversationId];
      const messageLimit = this.getMessageLimit();
      
      // If at per-conversation limit, remove oldest message
      if (conversation.messages.length >= messageLimit) {
        conversation.messages.shift();
      }
      
      conversation.messages.push(message);
      conversation.updatedAt = Date.now();
      
      // ✅ SCALABILITY: Check global message limit
      const totalMessageLimit = this.getTotalMessageLimit();
      const totalMessages = Object.values(conversations)
        .reduce((total, conv) => total + conv.messages.length, 0);
      
      if (totalMessages > totalMessageLimit) {
        this.cleanupOldMessages(conversations);
      }
      
      this.setConversations(conversations);
      return { success: true };
    }
    
    return { success: false, reason: 'Conversation not found' };
  }

  // ✅ SCALABILITY: Cleanup old messages to prevent memory bloat
  private static cleanupOldMessages(conversations: Conversations): void {
    const totalMessageLimit = this.getTotalMessageLimit();
    const targetMessages = Math.floor(totalMessageLimit * 0.8); // Keep 80% of limit
    
    // Get all messages with conversation info
    const allMessages: Array<{ message: ChatMessage; conversationId: string; conversation: Conversation }> = [];
    
    Object.values(conversations).forEach(conv => {
      conv.messages.forEach(msg => {
        allMessages.push({ message: msg, conversationId: conv.id, conversation: conv });
      });
    });
    
    // Sort by timestamp (oldest first)
    allMessages.sort((a, b) => a.message.timestamp - b.message.timestamp);
    
    // Remove oldest messages until we're under the target
    let messagesToRemove = allMessages.length - targetMessages;
    for (let i = 0; i < messagesToRemove && i < allMessages.length; i++) {
      const { conversationId, message } = allMessages[i];
      const conversation = conversations[conversationId];
      if (conversation) {
        const messageIndex = conversation.messages.findIndex(m => m.id === message.id);
        if (messageIndex !== -1) {
          conversation.messages.splice(messageIndex, 1);
        }
      }
    }
  }

  static getActiveConversation(): Conversation | null {
    const conversations = this.getConversations();
    const activeConversation = Object.values(conversations).find(conv => conv.isActive);
    return activeConversation || null;
  }

  // ✅ SCALABILITY: Get user's current usage statistics
  static getUsageStats(): {
    conversations: { current: number; limit: number; tier: UserTier };
    messages: { current: number; limit: number; tier: UserTier };
    totalMessages: { current: number; limit: number; tier: UserTier };
  } {
    const conversations = this.getConversations();
    const tier = this.getUserTier();
    
    const conversationCount = Object.keys(conversations).length;
    const conversationLimit = this.getConversationLimit();
    
    const totalMessages = Object.values(conversations)
      .reduce((total, conv) => total + conv.messages.length, 0);
    const totalMessageLimit = this.getTotalMessageLimit();
    
    // Get max messages per conversation for display
    const messageLimit = this.getMessageLimit();
    
    return {
      conversations: {
        current: conversationCount,
        limit: conversationLimit,
        tier
      },
      messages: {
        current: 0, // This would be per-conversation, calculated when needed
        limit: messageLimit,
        tier
      },
      totalMessages: {
        current: totalMessages,
        limit: totalMessageLimit,
        tier
      }
    };
  }

  // ✅ SCALABILITY: Get conversation-specific message count
  static getConversationMessageCount(conversationId: string): { current: number; limit: number; tier: UserTier } {
    const conversations = this.getConversations();
    const conversation = conversations[conversationId];
    const tier = this.getUserTier();
    const messageLimit = this.getMessageLimit();
    
    return {
      current: conversation?.messages.length || 0,
      limit: messageLimit,
      tier
    };
  }

  static setActiveConversation(id: string): void {
    const conversations = this.getConversations();
    
    // Set all conversations to inactive
    Object.values(conversations).forEach(conv => {
      conv.isActive = false;
    });
    
    // Set the selected conversation as active
    if (conversations[id]) {
      conversations[id].isActive = true;
    }
    
    this.setConversations(conversations);
  }

  static clearAllConversations(): void {
    this.setConversations({});
  }
}
