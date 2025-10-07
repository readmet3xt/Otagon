import { Conversation, User } from '../types';

/**
 * This service is responsible for creating a condensed, context-rich summary
 * to inject into the AI prompt, acting as the AI's "long-term memory".
 */
class ChatMemoryService {
  public async getContextualSummary(conversation: Conversation, user: User): Promise<string> {
    let summary = "--- User & Game Context ---\n";

    // User Preferences
    summary += `Spoiler Preference: ${user.preferences?.spoilerPreference || 'not set'}\n`;
    
    // Game State
    if (conversation.gameTitle) {
      summary += `Game: ${conversation.gameTitle}\n`;
      summary += `Progress: ${conversation.gameProgress || 0}%\n`;
      summary += `Current Objective: ${conversation.activeObjective || 'None specified'}\n`;
    }

    // Recent Key Events (a more advanced implementation could summarize messages)
    const keyMessages = conversation.messages
      .filter(msg => msg.content.includes('objective') || msg.content.includes('defeated'))
      .slice(-3);
      
    if (keyMessages.length > 0) {
        summary += "\nRecent Key Events:\n";
        keyMessages.forEach(msg => {
            summary += `- ${msg.role} mentioned: "${msg.content.substring(0, 70)}..."\n`;
        });
    }
    
    summary += "--- End Context ---\n";
    return summary;
  }
}

export const chatMemoryService = new ChatMemoryService();