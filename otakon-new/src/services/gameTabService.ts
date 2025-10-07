// src/services/gameTabService.ts

import { v4 as uuidv4 } from 'uuid';
import { SubTab, insightTabsConfig, Conversation } from '../types';
import { ConversationService } from './conversationService';

interface GameInfo {
  gameTitle: string;
  genre?: string;
}

class GameTabService {
  /**
   * Main function to create a new game conversation (tab).
   * It generates the sub-tabs and saves everything to the database.
   */
  public async createGameTab(gameInfo: GameInfo, _userId: string): Promise<Conversation> {
    const { gameTitle, genre = 'Default' } = gameInfo;

    // 1. Generate the sub-tabs based on genre
    const subtabs = this.generateSubtabs(genre);

    // 2. Create the initial "Chat" content for the chat sub-tab
    const chatSubTab = subtabs.find(st => st.id === 'chat');
    if (chatSubTab) {
        chatSubTab.content = `Welcome to your adventure in ${gameTitle}! Ask me anything.`;
        chatSubTab.status = 'loaded';
    }

    // 3. Create the new conversation object
    const newConversation: Conversation = {
      id: uuidv4(),
      title: gameTitle,
      messages: [{
          id: `msg_${Date.now()}`,
          content: `Begin your journey in ${gameTitle}. I'll keep track of your progress here.`,
          role: 'assistant',
          timestamp: Date.now()
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      gameId: gameTitle.toLowerCase().replace(/\s+/g, '-'), // Simple slug for now
      gameTitle: gameTitle,
      genre: genre,
      subtabs: subtabs,
      subtabsOrder: subtabs.map(st => st.id),
    };

    // 4. Persist to Supabase (via conversationService)
    await ConversationService.addConversation(newConversation);

    return newConversation;
  }

  /**
   * Generates the initial structure for sub-tabs based on the game's genre.
   */
  private generateSubtabs(genre: string): SubTab[] {
    const config = insightTabsConfig[genre] || insightTabsConfig['Default'];

    const subtabs: SubTab[] = [
      // Every game starts with a Chat tab
      {
        id: 'chat',
        title: 'Chat',
        content: '',
        type: 'chat',
        isNew: false,
        status: 'loading',
      },
      // Add the rest from the config
      ...config.map(c => ({
        ...c,
        content: '', // Initially empty
        isNew: true,
        status: 'loading' as 'loading',
      }))
    ];

    return subtabs;
  }
}

export const gameTabService = new GameTabService();
