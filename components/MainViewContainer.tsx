

import React, { useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Conversation, ChatMessage as ChatMessageType } from '../services/types';
import ChatMessage from './ChatMessage';
import SuggestedPrompts from './SuggestedPrompts';
import FeedbackButtons from './FeedbackButtons';

interface MainViewContainerProps {
  activeConversation: Conversation;
  activeSubView: string;
  onSubViewChange: (id: string) => void;
  onSendMessage: (text: string) => void;
  stopMessage: (id: string) => void;
  isInputDisabled: boolean;
  messages: ChatMessageType[];
  loadingMessages: string[];
  onUpgradeClick: () => void;
  onFeedback: (type: 'message' | 'insight', convId: string, targetId: string, originalText: string, vote: 'up' | 'down') => void;
}

const usePrevious = <T,>(value: T) => {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};


const MainViewContainer: React.FC<MainViewContainerProps> = ({
  activeConversation,
  activeSubView,
  onSubViewChange,
  onSendMessage,
  stopMessage,
  isInputDisabled,
  messages,
  loadingMessages,
  onUpgradeClick,
  onFeedback,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const orderedInsightIds = activeConversation.insightsOrder || Object.keys(activeConversation.insights || {});

  const views = useMemo(() => {
    return ['chat', ...orderedInsightIds];
  }, [orderedInsightIds]);

  const activeIndex = views.indexOf(activeSubView);
  const previousIndex = usePrevious(activeIndex);

  useEffect(() => {
    if (activeSubView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages, activeSubView]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      const nextIndex = Math.min(activeIndex + 1, views.length - 1);
      onSubViewChange(views[nextIndex]);
    } else if (isRightSwipe) {
      const prevIndex = Math.max(activeIndex - 1, 0);
      onSubViewChange(views[prevIndex]);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const renderContent = () => {
    return views.map(viewId => {
      if (viewId === 'chat') {
        return (
          <div key="chat-view" className="flex-shrink-0 w-full h-full overflow-y-auto px-4 pt-4 pb-2">
            {messages.length === 0 && loadingMessages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-end h-full">
                <SuggestedPrompts onPromptClick={onSendMessage} isInputDisabled={isInputDisabled} />
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto my-4">
                {messages.map(msg => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isLoading={loadingMessages.includes(msg.id)}
                    onStop={() => stopMessage(msg.id)}
                    onPromptClick={onSendMessage}
                    onUpgradeClick={onUpgradeClick}
                    onFeedback={(vote) => onFeedback('message', activeConversation.id, msg.id, msg.text, vote)}
                  />
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        );
      }
      
      const insight = activeConversation.insights?.[viewId];
      if (insight) {
        return (
          <div key={insight.id} className="flex-shrink-0 w-full h-full overflow-y-auto p-6">
            <div className="prose prose-invert prose-base sm:prose-lg max-w-none prose-p:text-[#CFCFCF] prose-headings:text-[#F5F5F5] prose-strong:text-white prose-a:text-[#FFAB40] prose-a:no-underline hover:prose-a:underline prose-code:text-[#FFAB40] prose-code:bg-[#1C1C1C] prose-code:p-1 prose-code:rounded-md prose-li:marker:text-[#FFAB40] prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {insight.content}
              </ReactMarkdown>
            </div>
            {insight.status === 'loaded' && insight.content && (
              <div className="mt-6 pt-4 border-t border-neutral-800/50">
                <FeedbackButtons 
                    onFeedback={(vote) => onFeedback('insight', activeConversation.id, insight.id, insight.content, vote)} 
                    feedbackState={insight.feedback} 
                />
              </div>
            )}
          </div>
        );
      }
      return <div key={viewId} className="flex-shrink-0 w-full h-full"></div>;
    });
  };

  return (
    <div
      className="flex-1 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="h-full flex transition-transform duration-300"
        style={{ 
          transform: `translateX(-${activeIndex * 100}%)`,
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default MainViewContainer;