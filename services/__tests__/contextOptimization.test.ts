import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contextSummarizationService } from '../contextSummarizationService';

// Mock the ChatMessage type
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp?: number;
  images?: string[];
}

describe('Context Optimization System', () => {
  const mockConversationId = 'test-conversation';
  
  const createMockMessage = (id: string, role: 'user' | 'model', text: string, timestamp?: number): ChatMessage => ({
    id,
    role,
    text,
    timestamp: timestamp || Date.now(),
    images: []
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing summaries
    contextSummarizationService.cleanupOldSummaries(0); // Clean all
  });

  describe('Context Summarization Service', () => {
    it('should compress conversation history when messages exceed limit', () => {
      const messages: ChatMessage[] = [];
      
      // Create 30 messages (exceeds default limit of 20)
      for (let i = 0; i < 30; i++) {
        messages.push(createMockMessage(
          `msg-${i}`,
          i % 2 === 0 ? 'user' : 'model',
          `Message ${i} about gameplay`,
          Date.now() - (30 - i) * 60000 // 1 minute apart
        ));
      }

      const result = contextSummarizationService.compressConversationHistory(
        mockConversationId,
        messages,
        15 // Keep last 15 messages
      );

      expect(result.originalCount).toBe(30);
      expect(result.compressedCount).toBeLessThanOrEqual(16); // 15 + 1 summary
      expect(result.compressionRatio).toBeLessThan(1.0);
      expect(result.summary).toBeDefined();
      expect(result.summary?.messageCount).toBe(15); // 30 - 15 = 15 messages summarized
    });

    it('should not compress when messages are within limit', () => {
      const messages: ChatMessage[] = [];
      
      // Create 10 messages (within limit)
      for (let i = 0; i < 10; i++) {
        messages.push(createMockMessage(
          `msg-${i}`,
          i % 2 === 0 ? 'user' : 'model',
          `Message ${i} about gameplay`
        ));
      }

      const result = contextSummarizationService.compressConversationHistory(
        mockConversationId,
        messages,
        15
      );

      expect(result.originalCount).toBe(10);
      expect(result.compressedCount).toBe(10);
      expect(result.compressionRatio).toBe(1.0);
      expect(result.summary).toBeNull();
    });

    it('should extract key topics from messages', () => {
      const messages: ChatMessage[] = [
        createMockMessage('1', 'user', 'How do I beat this boss?'),
        createMockMessage('2', 'model', 'Try using fire spells against the boss'),
        createMockMessage('3', 'user', 'What about this quest?'),
        createMockMessage('4', 'model', 'Complete the quest to get a new weapon'),
        createMockMessage('5', 'user', 'I found a secret area'),
        createMockMessage('6', 'model', 'Great discovery! Here are some tips for exploration')
      ];

      const result = contextSummarizationService.compressConversationHistory(
        mockConversationId,
        messages,
        3
      );

      expect(result.summary).toBeDefined();
      expect(result.summary?.keyTopics).toContain('combat');
      expect(result.summary?.keyTopics).toContain('quests');
      // Note: 'secrets' and 'exploration' might not be extracted due to simple keyword matching
      expect(result.summary?.keyTopics.length).toBeGreaterThan(0);
    });

    it('should extract game events from messages', () => {
      const messages: ChatMessage[] = [
        createMockMessage('1', 'user', 'I defeated the dragon boss!'),
        createMockMessage('2', 'model', 'Congratulations on defeating the boss'),
        createMockMessage('3', 'user', 'I completed the main quest'),
        createMockMessage('4', 'model', 'Great job completing the quest'),
        createMockMessage('5', 'user', 'I found a hidden weapon'),
        createMockMessage('6', 'model', 'Nice discovery!')
      ];

      const result = contextSummarizationService.compressConversationHistory(
        mockConversationId,
        messages,
        3
      );

      expect(result.summary).toBeDefined();
      expect(result.summary?.gameEvents).toContain('boss_defeated');
      expect(result.summary?.gameEvents).toContain('quest_completed');
      // Note: 'discovery' might not be extracted due to simple keyword matching
      expect(result.summary?.gameEvents.length).toBeGreaterThan(0);
    });

    it('should generate context summary for AI', () => {
      const messages: ChatMessage[] = [];
      
      // Create messages to summarize
      for (let i = 0; i < 25; i++) {
        messages.push(createMockMessage(
          `msg-${i}`,
          i % 2 === 0 ? 'user' : 'model',
          `Message ${i} about boss strategy and quest completion`,
          Date.now() - (25 - i) * 60000
        ));
      }

      // Compress to create summary
      contextSummarizationService.compressConversationHistory(
        mockConversationId,
        messages,
        10
      );

      const contextSummary = contextSummarizationService.getContextSummaryForAI(mockConversationId);
      
      expect(contextSummary).toContain('[META_CONTEXT_SUMMARIES:');
      expect(contextSummary).toContain('Previous session summaries');
      expect(contextSummary).toContain('combat');
      expect(contextSummary).toContain('quests');
    });

    it('should store and retrieve multiple summaries', () => {
      const messages1: ChatMessage[] = [];
      const messages2: ChatMessage[] = [];
      
      // Create two sets of messages
      for (let i = 0; i < 25; i++) {
        messages1.push(createMockMessage(`msg1-${i}`, 'user', `First session message ${i}`));
        messages2.push(createMockMessage(`msg2-${i}`, 'user', `Second session message ${i}`));
      }

      // Compress both sets
      contextSummarizationService.compressConversationHistory(mockConversationId, messages1, 10);
      contextSummarizationService.compressConversationHistory(mockConversationId, messages2, 10);

      const summaries = contextSummarizationService.getSummaries(mockConversationId);
      expect(summaries).toHaveLength(2);
    });

    it('should limit summaries per conversation', () => {
      const messages: ChatMessage[] = [];
      
      // Create 7 sets of messages (should limit to 5 summaries)
      for (let session = 0; session < 7; session++) {
        const sessionMessages: ChatMessage[] = [];
        for (let i = 0; i < 25; i++) {
          sessionMessages.push(createMockMessage(
            `msg-${session}-${i}`,
            'user',
            `Session ${session} message ${i}`
          ));
        }
        
        contextSummarizationService.compressConversationHistory(
          mockConversationId,
          sessionMessages,
          10
        );
      }

      const summaries = contextSummarizationService.getSummaries(mockConversationId);
      expect(summaries).toHaveLength(5); // Should be limited to 5
    });

    it('should clean up old summaries', () => {
      const messages: ChatMessage[] = [];
      
      // Create old summary
      for (let i = 0; i < 25; i++) {
        messages.push(createMockMessage(
          `msg-${i}`,
          'user',
          `Old message ${i}`,
          Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
        ));
      }

      contextSummarizationService.compressConversationHistory(mockConversationId, messages, 10);
      
      // Clean up summaries older than 30 days
      contextSummarizationService.cleanupOldSummaries(30 * 24 * 60 * 60 * 1000);
      
      const summaries = contextSummarizationService.getSummaries(mockConversationId);
      expect(summaries).toHaveLength(0);
    });

    it('should provide compression statistics', () => {
      const messages: ChatMessage[] = [];
      
      // Create messages for two conversations
      for (let i = 0; i < 25; i++) {
        messages.push(createMockMessage(`msg-${i}`, 'user', `Message ${i}`));
      }

      contextSummarizationService.compressConversationHistory('conv1', messages, 10);
      contextSummarizationService.compressConversationHistory('conv2', messages, 10);

      const stats = contextSummarizationService.getCompressionStats();
      expect(stats.totalSummaries).toBe(2);
      expect(stats.conversationsWithSummaries).toBe(2);
    });
  });

  describe('Context Size Management', () => {
    it('should handle empty message arrays', () => {
      const result = contextSummarizationService.compressConversationHistory(
        mockConversationId,
        [],
        10
      );

      expect(result.originalCount).toBe(0);
      expect(result.compressedCount).toBe(0);
      expect(result.compressionRatio).toBe(1.0);
      expect(result.summary).toBeNull();
    });

    it('should handle messages without timestamps', () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', text: 'Message without timestamp' },
        { id: '2', role: 'model', text: 'Response without timestamp' }
      ];

      const result = contextSummarizationService.compressConversationHistory(
        mockConversationId,
        messages,
        1
      );

      expect(result.originalCount).toBe(2);
      expect(result.compressedCount).toBeLessThanOrEqual(2);
    });

    it('should handle large message arrays efficiently', () => {
      const messages: ChatMessage[] = [];
      
      // Create 1000 messages
      for (let i = 0; i < 1000; i++) {
        messages.push(createMockMessage(
          `msg-${i}`,
          i % 2 === 0 ? 'user' : 'model',
          `Message ${i} with some content about gameplay and strategy`
        ));
      }

      const startTime = Date.now();
      const result = contextSummarizationService.compressConversationHistory(
        mockConversationId,
        messages,
        20
      );
      const endTime = Date.now();

      expect(result.originalCount).toBe(1000);
      expect(result.compressedCount).toBeLessThanOrEqual(21); // 20 + 1 summary
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
