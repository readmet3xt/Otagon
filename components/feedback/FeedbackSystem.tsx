import React, { useState, useCallback } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { EnhancedButton, EnhancedInput, EnhancedCard, CardContent } from '../ui';
import { cn } from '../../utils/cn';

// ===== FEEDBACK TYPES =====

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general' | 'praise';

export interface FeedbackData {
  type: FeedbackType;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  userAgent?: string;
  timestamp?: Date;
}

// ===== FEEDBACK MODAL =====

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
  initialType?: FeedbackType;
  context?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialType = 'general',
  context
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: ExclamationTriangleIcon, color: 'text-red-500' },
    { id: 'feature', label: 'Feature Request', icon: InformationCircleIcon, color: 'text-blue-500' },
    { id: 'improvement', label: 'Improvement', icon: CheckCircleIcon, color: 'text-green-500' },
    { id: 'praise', label: 'Praise', icon: ChatBubbleLeftRightIcon, color: 'text-yellow-500' },
    { id: 'general', label: 'General', icon: ChatBubbleLeftRightIcon, color: 'text-gray-500' }
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    
    const feedbackData: FeedbackData = {
      type: feedbackType,
      title: title.trim(),
      description: description.trim(),
      priority,
      category: context,
      userAgent: navigator.userAgent,
      timestamp: new Date()
    };

    try {
      await onSubmit(feedbackData);
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] rounded-2xl border border-[#424242]/40 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#424242]/40">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#F5F5F5]">Share Your Feedback</h2>
            <button
              onClick={onClose}
              className="p-2 text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          {context && (
            <p className="text-sm text-[#A3A3A3] mt-2">
              Context: {context}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Feedback Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[#CFCFCF] mb-3">
              What type of feedback is this?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFeedbackType(type.id as FeedbackType)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all duration-200 text-center',
                      feedbackType === type.id
                        ? 'border-[#FFAB40] bg-[#FFAB40]/10'
                        : 'border-[#424242] hover:border-[#525252]'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 mx-auto mb-1', type.color)} />
                    <span className="text-xs text-[#CFCFCF]">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <EnhancedInput
            label="Title"
            placeholder="Brief description of your feedback"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about your feedback..."
              className="w-full h-32 px-4 py-3 bg-[#1C1C1C] border border-[#424242] text-[#F5F5F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:border-[#FFAB40] resize-none"
              required
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-[#CFCFCF] mb-3">
              Priority Level
            </label>
            <div className="flex gap-2">
              {[
                { id: 'low', label: 'Low', color: 'bg-green-500' },
                { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                { id: 'high', label: 'High', color: 'bg-red-500' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id as 'low' | 'medium' | 'high')}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 transition-all duration-200',
                    priority === p.id
                      ? 'border-[#FFAB40] bg-[#FFAB40]/10'
                      : 'border-[#424242] hover:border-[#525252]'
                  )}
                >
                  <div className={cn('w-3 h-3 rounded-full mx-auto mb-1', p.color)} />
                  <span className="text-xs text-[#CFCFCF]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#424242]/40 flex items-center justify-end gap-3">
          <EnhancedButton variant="outline" onClick={onClose}>
            Cancel
          </EnhancedButton>
          <EnhancedButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || isSubmitting}
            loading={isSubmitting}
            loadingText="Submitting..."
            rightIcon={<PaperAirplaneIcon className="w-4 h-4" />}
          >
            Submit Feedback
          </EnhancedButton>
        </div>
      </div>
    </div>
  );
};

// ===== CONTEXTUAL HELP =====

interface ContextualHelpProps {
  title: string;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  title,
  content,
  position = 'top',
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="w-5 h-5 text-[#A3A3A3] hover:text-[#FFAB40] transition-colors"
      >
        <InformationCircleIcon className="w-full h-full" />
      </button>
      
      {isVisible && (
        <div className={cn(
          'absolute z-50 w-64 p-3 bg-[#1C1C1C] border border-[#424242] rounded-lg shadow-lg',
          positionClasses[position]
        )}>
          <h4 className="text-sm font-semibold text-[#F5F5F5] mb-2">{title}</h4>
          <div className="text-sm text-[#A3A3A3]">{content}</div>
          
          {/* Arrow */}
          <div className={cn(
            'absolute w-2 h-2 bg-[#1C1C1C] border border-[#424242] transform rotate-45',
            position === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0',
            position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0',
            position === 'left' && 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2 border-l-0 border-b-0',
            position === 'right' && 'right-full top-1/2 -translate-y-1/2 translate-x-1/2 border-r-0 border-t-0'
          )} />
        </div>
      )}
    </div>
  );
};

// ===== FEEDBACK TRIGGER =====

interface FeedbackTriggerProps {
  context?: string;
  type?: FeedbackType;
  className?: string;
  children?: React.ReactNode;
}

const FeedbackTrigger: React.FC<FeedbackTriggerProps> = ({
  context,
  type = 'general',
  className,
  children
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = useCallback(async (feedback: FeedbackData) => {
    // Here you would typically send the feedback to your backend
    console.log('Feedback submitted:', feedback);
    
    // For now, we'll just show a success message
    // In a real app, you'd integrate with your feedback system
  }, []);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 text-sm text-[#A3A3A3] hover:text-[#FFAB40] transition-colors rounded-lg hover:bg-white/10',
          className
        )}
      >
        {children || (
          <>
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Feedback
          </>
        )}
      </button>
      
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialType={type}
        context={context}
      />
    </>
  );
};

export {
  FeedbackModal,
  ContextualHelp,
  FeedbackTrigger
};
