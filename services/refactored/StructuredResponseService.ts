import { PlayerProfile, GameContext, ResponseFormatting, ResponseSection } from '../types';
import { BaseService } from '../ServiceFactory';

/**
 * Refactored StructuredResponseService using the new ServiceFactory pattern
 * 
 * This service handles structured response formatting and user intent analysis
 * for AI-generated content.
 */
export class StructuredResponseService extends BaseService {
  
  // Analyze user intent and context
  analyzeUserIntent(
    currentMessage: string,
    conversationHistory: string[],
    lastGameId: string,
    currentGameId: string
  ): 'new_help' | 'clarification' | 'follow_up' | 'game_switch' {
    
    // Check for game switching
    if (lastGameId !== currentGameId && lastGameId !== '') {
      return 'game_switch';
    }
    
    // Check for follow-up questions
    const followUpIndicators = [
      'what about', 'how do i', 'can you explain', 'tell me more',
      'what next', 'and then', 'also', 'additionally', 'continue',
      'expand on', 'elaborate', 'go deeper', 'what else',
      'more details', 'further', 'next step', 'after that'
    ];
    
    const messageLower = currentMessage.toLowerCase();
    const hasFollowUpIndicator = followUpIndicators.some(indicator => 
      messageLower.includes(indicator)
    );
    
    if (hasFollowUpIndicator && conversationHistory.length > 0) {
      return 'follow_up';
    }
    
    // Check for clarification requests
    const clarificationIndicators = [
      'what do you mean', 'i don\'t understand', 'can you clarify',
      'explain that', 'what does that mean', 'i\'m confused',
      'not clear', 'unclear', 'confusing'
    ];
    
    const hasClarificationIndicator = clarificationIndicators.some(indicator => 
      messageLower.includes(indicator)
    );
    
    if (hasClarificationIndicator) {
      return 'clarification';
    }
    
    // Default to new help request
    return 'new_help';
  }

  // Format response based on user intent and context
  formatResponse(
    content: string,
    intent: 'new_help' | 'clarification' | 'follow_up' | 'game_switch',
    profile: PlayerProfile,
    gameContext: GameContext,
    formatting: ResponseFormatting
  ): string {
    
    let formattedContent = content;
    
    // Apply intent-specific formatting
    switch (intent) {
      case 'clarification':
        formattedContent = this.formatClarificationResponse(formattedContent, profile);
        break;
      case 'follow_up':
        formattedContent = this.formatFollowUpResponse(formattedContent, profile);
        break;
      case 'game_switch':
        formattedContent = this.formatGameSwitchResponse(formattedContent, gameContext);
        break;
      default:
        formattedContent = this.formatNewHelpResponse(formattedContent, profile, gameContext);
    }
    
    // Apply general formatting
    formattedContent = this.applyGeneralFormatting(formattedContent, formatting);
    
    return formattedContent;
  }

  private formatClarificationResponse(content: string, profile: PlayerProfile): string {
    // Add clarification-specific formatting
    const experienceLevel = profile.experienceLevel || 'beginner';
    
    if (experienceLevel === 'beginner') {
      return `Let me break this down more simply:\n\n${content}`;
    }
    
    return `Here's a clearer explanation:\n\n${content}`;
  }

  private formatFollowUpResponse(content: string, profile: PlayerProfile): string {
    // Add follow-up specific formatting
    return `Continuing from where we left off:\n\n${content}`;
  }

  private formatGameSwitchResponse(content: string, gameContext: GameContext): string {
    // Add game switch specific formatting
    const gameName = gameContext.gameName || 'this game';
    return `Now, regarding ${gameName}:\n\n${content}`;
  }

  private formatNewHelpResponse(content: string, profile: PlayerProfile, gameContext: GameContext): string {
    // Add new help specific formatting
    const gameName = gameContext.gameName || 'your game';
    return `Here's how to help with ${gameName}:\n\n${content}`;
  }

  private applyGeneralFormatting(content: string, formatting: ResponseFormatting): string {
    let formatted = content;
    
    // Apply sections if specified
    if (formatting.sections && formatting.sections.length > 0) {
      formatted = this.applySections(formatted, formatting.sections);
    }
    
    // Apply tone
    if (formatting.tone) {
      formatted = this.applyTone(formatted, formatting.tone);
    }
    
    // Apply length constraints
    if (formatting.maxLength) {
      formatted = this.applyLengthConstraint(formatted, formatting.maxLength);
    }
    
    return formatted;
  }

  private applySections(content: string, sections: ResponseSection[]): string {
    let formatted = content;
    
    for (const section of sections) {
      const sectionHeader = `## ${section.title}\n\n`;
      const sectionContent = section.content || '';
      const sectionFooter = section.footer ? `\n\n${section.footer}` : '';
      
      formatted += `\n\n${sectionHeader}${sectionContent}${sectionFooter}`;
    }
    
    return formatted;
  }

  private applyTone(content: string, tone: 'casual' | 'formal' | 'encouraging' | 'technical'): string {
    // This is a simplified implementation
    // In a real application, you might use more sophisticated tone analysis
    
    switch (tone) {
      case 'casual':
        return content.replace(/you should/g, 'you might want to');
      case 'formal':
        return content.replace(/you can/g, 'you may');
      case 'encouraging':
        return content.replace(/try/g, 'give it a try');
      case 'technical':
        return content.replace(/thing/g, 'element');
      default:
        return content;
    }
  }

  private applyLengthConstraint(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    // Truncate and add ellipsis
    return content.substring(0, maxLength - 3) + '...';
  }

  // Cleanup method for the service
  cleanup(): void {
    console.log('🧹 StructuredResponseService: Cleanup called');
    // Add any cleanup logic here
  }
}
