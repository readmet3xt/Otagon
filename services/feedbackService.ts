

import { supabase } from './supabase';
import { aiContextService } from './aiContextService';
import { feedbackSecurityService } from './feedbackSecurityService';

const FEEDBACK_STORAGE_KEY = 'otakonFeedbackData';

export type Feedback = {
  id: string;
  conversationId: string;
  targetId: string; // messageId or insightId
  originalText: string;
  feedbackText: string;
  timestamp: number;
};

const getFeedbackData = (): Feedback[] => {
  try {
    const rawData = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error("Failed to parse feedback data from localStorage", error);
    return [];
  }
};

const saveFeedbackData = (data: Feedback[]) => {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save feedback data to localStorage", error);
  }
};

export const addFeedback = async (feedback: Omit<Feedback, 'id' | 'timestamp'>) => {
  // SECURITY VALIDATION: Ensure feedback only affects AI responses and insights
  const securityContext = {
    feedbackType: 'message' as const, // Default, will be updated based on context
    targetId: feedback.targetId,
    conversationId: feedback.conversationId,
    originalText: feedback.originalText,
    feedbackText: feedback.feedbackText,
    userId: 'current_user', // Will be set by aiContextService
    timestamp: Date.now()
  };

  const securityValidation = feedbackSecurityService.validateFeedbackSecurity(securityContext);

  // If feedback contains forbidden content, block it
  if (!securityValidation.isValid) {
    console.error('🚨 FEEDBACK BLOCKED: Contains forbidden system modification attempts', {
      forbiddenAttempts: securityValidation.forbiddenAttempts,
      securityWarnings: securityValidation.securityWarnings
    });
    throw new Error('Feedback contains content that could affect system settings. Only AI responses and insight content can be influenced by feedback.');
  }

  // Use sanitized feedback text
  const sanitizedFeedback = {
    ...feedback,
    feedbackText: securityValidation.sanitizedFeedback
  };

  // Store in localStorage for backward compatibility
  const allFeedback = getFeedbackData();
  const newFeedback: Feedback = {
    ...sanitizedFeedback,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  allFeedback.push(newFeedback);
  saveFeedbackData(allFeedback);

  // Store in Supabase for AI learning (with security validation)
  try {
    await aiContextService.storeAIFeedback({
      user_id: '', // Will be set by aiContextService
      conversation_id: sanitizedFeedback.conversationId,
      message_id: sanitizedFeedback.targetId,
      feedback_type: 'submitted',
      feedback_text: sanitizedFeedback.feedbackText,
      ai_response_context: {
        original_text: sanitizedFeedback.originalText,
        feedback_text: sanitizedFeedback.feedbackText,
        timestamp: Date.now(),
        feedback_category: categorizeFeedback(sanitizedFeedback.feedbackText),
        severity: analyzeFeedbackSeverity(sanitizedFeedback.feedbackText),
        security_validation: {
          allowedInfluences: securityValidation.allowedInfluences,
          sanitized: securityValidation.sanitizedFeedback !== feedback.feedbackText
        }
      },
      user_context: {
        feedback_type: 'submitted',
        conversation_id: sanitizedFeedback.conversationId,
        feedback_timestamp: Date.now()
      }
    });
  } catch (error) {
    console.warn('Failed to store feedback in Supabase for AI learning:', error);
  }
};

// Enhanced feedback analysis for AI learning
export const categorizeFeedback = (feedbackText: string): string => {
  const text = feedbackText.toLowerCase();
  
  if (text.includes('spoiler') || text.includes('ruined') || text.includes('reveal')) {
    return 'spoiler_alert';
  }
  if (text.includes('incorrect') || text.includes('wrong') || text.includes('false')) {
    return 'factual_error';
  }
  if (text.includes('unhelpful') || text.includes('useless') || text.includes('not helpful')) {
    return 'unhelpful_response';
  }
  if (text.includes('format') || text.includes('structure') || text.includes('layout')) {
    return 'formatting_issue';
  }
  if (text.includes('too long') || text.includes('verbose') || text.includes('wordy')) {
    return 'response_length';
  }
  if (text.includes('too short') || text.includes('brief') || text.includes('not detailed')) {
    return 'response_length';
  }
  
  return 'general_feedback';
};

export const analyzeFeedbackSeverity = (feedbackText: string): 'low' | 'medium' | 'high' => {
  const text = feedbackText.toLowerCase();
  
  // High severity indicators
  if (text.includes('spoiler') || text.includes('ruined') || text.includes('incorrect')) {
    return 'high';
  }
  
  // Medium severity indicators
  if (text.includes('unhelpful') || text.includes('wrong') || text.includes('bad')) {
    return 'medium';
  }
  
  // Low severity indicators
  if (text.includes('format') || text.includes('could be better') || text.includes('suggestion')) {
    return 'low';
  }
  
  return 'medium';
};

export const getRecentNegativeFeedback = (limit: number = 3): Feedback[] => {
  const allFeedback = getFeedbackData();
  // Sort by most recent first, then take the top 'limit'
  return allFeedback.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
};
