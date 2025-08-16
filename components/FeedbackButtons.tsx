

import React, { useState, useEffect } from 'react';
import ThumbUpIcon from './ThumbUpIcon';
import ThumbDownIcon from './ThumbDownIcon';
import { ChatMessageFeedback } from '../services/types';
import { aiContextService } from '../services/aiContextService';

interface FeedbackButtonsProps {
  onFeedback: (type: 'up' | 'down') => void;
  feedbackState?: ChatMessageFeedback;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ onFeedback, feedbackState }) => {
  const hasVoted = !!feedbackState;
  const [aiContext, setAiContext] = useState<string>('');
  const [showContext, setShowContext] = useState(false);

  // Get AI context when component mounts
  useEffect(() => {
    if (!hasVoted) {
      loadAIContext();
    }
  }, [hasVoted]);

  const loadAIContext = async () => {
    try {
      const contextString = await aiContextService.generateUserContextForAI();
      if (contextString) {
        setAiContext(contextString);
      }
    } catch (error) {
      console.warn('Failed to load AI context:', error);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    // Track user behavior for AI learning
    aiContextService.trackUserBehavior(
      'feedback_given',
      { 
        feedback_type: type, 
        timestamp: Date.now(),
        has_ai_context: !!aiContext
      },
      { component: 'FeedbackButtons' }
    );
    
    onFeedback(type);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* AI Context Toggle */}
      {aiContext && !hasVoted && (
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors self-start"
        >
          {showContext ? 'Hide' : 'Show'} AI Context
        </button>
      )}

      {/* AI Context Display */}
      {showContext && aiContext && (
        <div className="text-xs text-blue-300 bg-blue-900/20 border border-blue-500/30 rounded p-2 mb-2 max-w-xs">
          <div className="font-medium mb-1">AI Context:</div>
          <div className="text-blue-200 text-xs opacity-80 truncate">
            {aiContext.replace(/\[.*?\]/g, '').trim().slice(0, 100)}...
          </div>
        </div>
      )}

      {/* Feedback Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback('up')}
          disabled={hasVoted}
          aria-pressed={feedbackState === 'up'}
          className={`p-1.5 rounded-full transition-colors duration-200
            ${feedbackState === 'up'
              ? 'bg-green-500/20 text-green-400'
              : 'text-neutral-400 hover:bg-green-700/50 hover:text-white disabled:hover:bg-transparent disabled:opacity-50'
            }`}
          aria-label="Good response"
          title="This response was helpful"
        >
          <ThumbUpIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleFeedback('down')}
          disabled={hasVoted}
          aria-pressed={feedbackState === 'down' || feedbackState === 'submitted'}
          className={`p-1.5 rounded-full transition-colors duration-200
            ${feedbackState === 'down' || feedbackState === 'submitted'
              ? 'bg-red-500/20 text-red-400'
              : 'text-neutral-400 hover:bg-red-700/50 hover:text-white disabled:hover:bg-transparent disabled:opacity-50'
            }`}
          aria-label="Bad response"
          title="This response needs improvement"
        >
          <ThumbDownIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackButtons;