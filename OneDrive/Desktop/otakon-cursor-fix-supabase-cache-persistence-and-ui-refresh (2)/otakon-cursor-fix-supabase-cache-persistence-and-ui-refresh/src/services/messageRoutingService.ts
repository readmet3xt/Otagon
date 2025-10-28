/* eslint-disable no-console */
import { ConversationService } from './conversationService';
import { ChatMessage, Conversations } from '../types';

/**
 * Message Routing Service
 * Handles atomic message migration between tabs to prevent race conditions
 */
export class MessageRoutingService {
  /**
   * Atomically migrate messages from one conversation to another
   * This prevents race conditions by doing all operations in a single transaction
   */
  static async migrateMessagesAtomic(
    messageIds: string[],
    fromConversationId: string,
    toConversationId: string
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 [MessageRouting] Starting atomic migration:', {
        messageIds,
        from: fromConversationId,
        to: toConversationId
      });
    }

    // Get current state from service
    const conversations = await ConversationService.getConversations();
    
    const fromConv = conversations[fromConversationId];
    const toConv = conversations[toConversationId];
    
    if (!fromConv) {
      throw new Error(`Source conversation ${fromConversationId} not found`);
    }
    
    if (!toConv) {
      throw new Error(`Destination conversation ${toConversationId} not found`);
    }
    
    // Get messages to move
    const messagesToMove = fromConv.messages.filter(m => messageIds.includes(m.id));
    
    if (messagesToMove.length === 0) {
      console.warn('⚠️ [MessageRouting] No messages found to migrate');
      return;
    }
    
    // Check for duplicates in destination (prevent duplicate messages)
    const messagesToAdd = messagesToMove.filter(msg => 
      !toConv.messages.some(existing => existing.id === msg.id)
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 [MessageRouting] Migration details:', {
        found: messagesToMove.length,
        toAdd: messagesToAdd.length,
        duplicatesSkipped: messagesToMove.length - messagesToAdd.length
      });
    }
    
    // ATOMIC UPDATE: Modify both conversations in a single object
    const updatedConversations: Conversations = {
      ...conversations,
      [toConversationId]: {
        ...toConv,
        messages: [...toConv.messages, ...messagesToAdd],
        updatedAt: Date.now()
      },
      [fromConversationId]: {
        ...fromConv,
        messages: fromConv.messages.filter(m => !messageIds.includes(m.id)),
        updatedAt: Date.now()
      }
    };
    
    // Single write operation
    await ConversationService.setConversations(updatedConversations);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [MessageRouting] Migration complete:', {
        migrated: messagesToAdd.length,
        fromMessages: updatedConversations[fromConversationId].messages.length,
        toMessages: updatedConversations[toConversationId].messages.length
      });
    }
  }

  /**
   * Check if a message should be routed to a different tab based on game detection
   */
  static shouldRouteMessage(
    currentTabId: string,
    targetGameTabId: string | null,
    isGameHub: boolean
  ): boolean {
    // Don't route if no target game detected
    if (!targetGameTabId) {
      return false;
    }
    
    // Don't route if already in the target tab
    if (currentTabId === targetGameTabId) {
      return false;
    }
    
    // Route if currently in Game Hub and game detected
    if (isGameHub && targetGameTabId) {
      return true;
    }
    
    return false;
  }

  /**
   * Duplicate check for messages before adding
   */
  static messageExists(messages: ChatMessage[], messageId: string): boolean {
    return messages.some(m => m.id === messageId);
  }
}
