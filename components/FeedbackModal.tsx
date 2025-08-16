

import React, { useState, useEffect } from 'react';
import { aiContextService } from '../services/aiContextService';

interface FeedbackModalProps {
  originalText: string;
  onSubmit: (feedbackText: string) => void;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ originalText, onSubmit, onClose }) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Get AI insights based on feedback text
  useEffect(() => {
    if (feedbackText.length > 10) {
      generateAIInsights();
    }
  }, [feedbackText]);

  const generateAIInsights = async () => {
    setIsLoadingInsights(true);
    try {
      // Get global learning patterns to provide insights
      const patterns = await aiContextService.getGlobalLearningPatterns();
      const errorPatterns = patterns.filter(p => p.learning_type === 'error_correction');
      
      if (errorPatterns.length > 0) {
        const similarPatterns = errorPatterns
          .filter(p => p.pattern_data.feedback_category === categorizeFeedback(feedbackText))
          .slice(0, 2);
        
        if (similarPatterns.length > 0) {
          const insights = similarPatterns.map(p => 
            `• ${p.pattern_data.feedback_category.replace('_', ' ')} (${p.usage_count} similar reports)`
          ).join('\n');
          
          setAiInsights(`AI has learned from similar feedback:\n${insights}`);
        } else {
          setAiInsights('This appears to be new feedback. Your input will help improve AI responses.');
        }
      } else {
        setAiInsights('Your feedback will help establish learning patterns for better AI responses.');
      }
    } catch (error) {
      console.warn('Failed to generate AI insights:', error);
      setAiInsights('Your feedback is valuable for improving AI responses.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const categorizeFeedback = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('spoiler')) return 'spoiler_alert';
    if (lowerText.includes('incorrect')) return 'factual_error';
    if (lowerText.includes('unhelpful')) return 'unhelpful_response';
    if (lowerText.includes('format')) return 'formatting_issue';
    if (lowerText.includes('long') || lowerText.includes('short')) return 'response_length';
    return 'general_feedback';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      onSubmit(feedbackText.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-8 w-full max-w-lg m-4 relative flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-2">Provide Feedback</h2>
        <p className="text-neutral-400 mb-4">Your feedback is valuable. Please tell us what was wrong with the response so we can improve.</p>

        <div className="mb-4 p-3 bg-black/30 rounded-lg border border-neutral-700 max-h-32 overflow-y-auto">
            <p className="text-sm text-neutral-500 italic line-clamp-4">Original response: "{originalText}"</p>
        </div>

        {/* AI Learning Insights */}
        {aiInsights && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <h4 className="text-sm font-medium text-blue-300">AI Learning Insights</h4>
            </div>
            <p className="text-sm text-blue-200 whitespace-pre-line">{aiInsights}</p>
          </div>
        )}

        {isLoadingInsights && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm text-blue-300">Analyzing feedback patterns...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="e.g., The hint was a spoiler, the information was incorrect, the formatting was bad..."
            required
            className="flex-grow w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] resize-none mb-6"
            rows={5}
          />
          <div className="flex flex-col sm:flex-row-reverse gap-3">
            <button
              type="submit"
              disabled={!feedbackText.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 px-6 rounded-md transition-opacity disabled:opacity-50"
            >
              Send Feedback
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-neutral-600 hover:bg-neutral-700 text-white font-medium py-2.5 px-6 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
