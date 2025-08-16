

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../services/types';
import Logo from './Logo';
import UserAvatar from './UserAvatar';
import TypingIndicator from './TypingIndicator';
import StarIcon from './StarIcon';
import FeedbackButtons from './FeedbackButtons';

interface ChatMessageProps {
    message: ChatMessageType;
    isLoading: boolean;
    onStop: () => void;
    onPromptClick: (prompt: string) => void;
    onUpgradeClick: () => void;
    onFeedback: (vote: 'up' | 'down') => void;
}

const Confetti: React.FC = () => {
    const confettiCount = 50;
    const colors = ['#FF4D4D', '#FFAB40', '#5CBB7B', '#5B99E3', '#F5F5F5'];
  
    return (
      <div className="confetti-container">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: colors[Math.floor(Math.random() * colors.length)],
              animationDelay: `${Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              width: `${Math.random() * 6 + 8}px`,
              height: `${Math.random() * 4 + 6}px`,
            }}
          />
        ))}
      </div>
    );
  };

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, onStop, onPromptClick, onUpgradeClick, onFeedback }) => {
    const { id, role, text, images, suggestions, isFromPC, triumph, showUpgradeButton, feedback } = message;
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (triumph) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 4000); // Duration of confetti animation
            return () => clearTimeout(timer);
        }
    }, [triumph]);

    if (role === 'user') {
        if (!text && (!images || images.length === 0)) return null;

        const containerClasses = (images && images.length > 0)
          ? "bg-[#2E2E2E] border border-[#424242] rounded-2xl rounded-tr-none p-3"
          : "bg-[#E53A3A]/20 border border-[#E53A3A]/30 rounded-2xl rounded-tr-none py-2.5 px-4";

        return (
            <div key={id} className="flex items-start gap-2 justify-end animate-fade-slide-up">
                <div className={`${containerClasses} max-w-xl`}>
                    {images && images.length > 0 && (
                        <div className={`grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${text ? 'mb-2' : ''}`}>
                            {images.map((imgSrc, index) => (
                                <img key={index} src={imgSrc} alt={`User upload ${index + 1}`} className="rounded-lg w-full object-cover" />
                            ))}
                        </div>
                    )}
                    {text && (
                        <p className="text-[#F5F5F5] whitespace-pre-wrap">{text}</p>
                    )}
                    {!text && images && images.length > 0 && (
                        <p className="text-[#A3A3A3] text-sm mt-1">
                            {images.length} screenshot{images.length > 1 ? 's' : ''} uploaded
                        </p>
                    )}
                </div>
                <UserAvatar className="w-8 h-8 flex-shrink-0 text-[#D98C1F]" />
            </div>
        );
    }

    if (role === 'model') {
        const CANCELLATION_TEXT = '*Request cancelled by user.*';
        const isCancelledMessage = text === CANCELLATION_TEXT;

        if (isCancelledMessage) {
            return (
                <div key={id} className="flex items-start gap-2 animate-fade-slide-up">
                    <Logo className="w-8 h-8 flex-shrink-0" />
                    <div className="flex items-center w-full max-w-2xl py-2.5 px-4">
                        <p className="text-sm italic text-[#FF4D4D]">Request cancelled by user.</p>
                    </div>
                </div>
            );
        }

        const bubbleClasses = `bg-[#2E2E2E]/50 border border-[#424242]/50 rounded-2xl rounded-tl-none py-2.5 px-4 relative overflow-hidden ${triumph ? 'triumph-glow' : ''}`;

        return (
            <div key={id} className="flex items-start gap-2 animate-fade-slide-up">
                <Logo className="w-8 h-8 flex-shrink-0" />
                <div className="flex flex-col gap-2 w-full max-w-2xl">
                    {showConfetti && <Confetti />}
                    {text.trim() && (
                        <div className={bubbleClasses}>
                            <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-p:text-[#CFCFCF] prose-headings:text-[#F5F5F5] prose-strong:text-[#F5F5F5] prose-a:text-[#FFAB40] prose-a:no-underline hover:prose-a:underline prose-code:text-[#FFAB40] prose-code:bg-[#1C1C1C]/50 prose-code:p-1 prose-code:rounded-md prose-li:marker:text-[#FFAB40]">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                                    }}
                                >
                                    {text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {isLoading && (
                         <div className="flex items-center gap-4 py-1 px-4">
                            <TypingIndicator />
                            <button
                                onClick={onStop}
                                className="text-xs font-semibold px-3 py-1 rounded-full border transition-colors bg-[#424242]/50 border-[#5A5A5A] hover:bg-[#424242] hover:border-[#6E6E6E] text-[#CFCFCF] hover:text-[#F5F5F5]"
                                aria-label="Stop generating response"
                            >
                                Stop
                            </button>
                        </div>
                    )}

                    {!isLoading && text.trim() && !showUpgradeButton && (
                         <div className="pl-2 pt-1">
                            <FeedbackButtons onFeedback={onFeedback} feedbackState={feedback} />
                        </div>
                    )}

                    {showUpgradeButton && !isLoading && (
                        <div className="pt-2 animate-fade-in">
                            <button
                                onClick={onUpgradeClick}
                                className="flex items-center justify-center gap-2 w-auto text-sm bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                            >
                                <StarIcon className="w-4 h-4" />
                                Upgrade to Pro
                            </button>
                        </div>
                    )}

                    {suggestions && !isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 animate-fade-in">
                            {suggestions.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => onPromptClick(prompt)}
                                    className="text-left p-3 bg-[#1C1C1C]/50 border border-[#424242] rounded-lg transition-colors duration-200 hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60"
                                >
                                    <p className="text-[#CFCFCF] font-medium text-sm">{prompt}</p>

                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default React.memo(ChatMessage);