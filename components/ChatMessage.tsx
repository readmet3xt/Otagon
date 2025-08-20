

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../services/types';
import Logo from './Logo';
import UserAvatar from './UserAvatar';
import TypingIndicator from './TypingIndicator';
import StarIcon from './StarIcon';
import FeedbackButtons from './FeedbackButtons';
import DownloadIcon from './DownloadIcon';

interface ChatMessageProps {
    message: ChatMessageType;
    isLoading: boolean;
    onStop: () => void;
    onPromptClick: (prompt: string) => void;
    onUpgradeClick: () => void;
    onFeedback: (vote: 'up' | 'down') => void;
    onRetry?: () => void;
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
              transform: `rotate(${Math.random() * 360}deg)`,
              width: `${Math.random() * 6 + 8}px`,
              height: `${Math.random() * 4 + 6}px`,
            }}
          />
        ))}
      </div>
    );
  };

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, onStop, onPromptClick, onUpgradeClick, onFeedback, onRetry }) => {
    const { id, role, text, images, suggestions, isFromPC, triumph, showUpgradeButton, feedback } = message;
    const [showConfetti, setShowConfetti] = useState(false);

    // Function to download image in high quality
    const downloadImage = (imageSrc: string, index: number) => {
        try {
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = imageSrc;
            
            // Generate filename based on source and index
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = isFromPC 
                ? `otakon-screenshot-${index + 1}-${timestamp}.png`
                : `otakon-upload-${index + 1}-${timestamp}.png`;
            
            link.download = filename;
            link.target = '_blank';
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to download image:', error);
            // Fallback: open image in new tab
            window.open(imageSrc, '_blank');
        }
    };

    // Function to download all images in a group
    const downloadAllImages = () => {
        if (!images || images.length === 0) return;
        
        images.forEach((imageSrc, index) => {
            setTimeout(() => {
                downloadImage(imageSrc, index);
            }, index * 100); // Small delay between downloads to avoid browser blocking
        });
    };

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
          ? "bg-[#2E2E2E] border border-[#424242] rounded-2xl rounded-tr-none p-4"
          : "bg-[#E53A3A]/20 border border-[#E53A3A]/30 rounded-2xl rounded-tr-none py-3 px-4";

        // Determine grid layout based on image count
        const getGridClasses = (imageCount: number) => {
            if (imageCount === 1) return 'grid-cols-1';
            if (imageCount === 2) return 'grid-cols-2';
            if (imageCount === 3) return 'grid-cols-3';
            if (imageCount === 4) return 'grid-cols-2 sm:grid-cols-4';
            if (imageCount === 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
            return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
        };

        return (
            <div key={id} className="flex items-start gap-3 justify-end">
                <div className={`${containerClasses} max-w-2xl`}>
                    {images && images.length > 0 && (
                        <div className={`grid gap-3 ${getGridClasses(images.length)} ${text ? 'mb-3' : ''}`}>
                            {images.map((imgSrc, index) => (
                                <div key={index} className="relative group overflow-hidden rounded-xl bg-[#1C1C1C]/30 border border-[#424242]/30">
                                    <img 
                                        src={imgSrc} 
                                        alt={`Screenshot ${index + 1}`} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                        style={{ aspectRatio: '16/9' }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full border border-white/20">
                                        {index + 1}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            ))}
                        </div>
                    )}
                    {text && (
                        <p className="text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">{text}</p>
                    )}
                    {!text && images && images.length > 0 && (
                        <p className="text-[#A3A3A3] text-sm mt-2 font-medium">
                            📸 {images.length} screenshot{images.length > 1 ? 's' : ''} uploaded
                        </p>
                    )}
                    
                    {/* Download buttons for images */}
                    {images && images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#424242]/30">
                            {images.length === 1 ? (
                                <button
                                    onClick={() => downloadImage(images[0], 0)}
                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white text-sm font-medium rounded-lg hover:from-[#E53A3A] hover:to-[#D98C1F] transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                    title="Download this screenshot"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Download
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={downloadAllImages}
                                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] text-white text-sm font-medium rounded-lg hover:from-[#4CAF50] hover:to-[#45A049] transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                        title="Download all screenshots"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        Download All ({images.length})
                                    </button>
                                    <div className="flex gap-1">
                                        {images.map((imgSrc, index) => (
                                            <button
                                                key={index}
                                                onClick={() => downloadImage(imgSrc, index)}
                                                className="px-2 py-2 bg-[#2E2E2E] text-[#A3A3A3] text-xs font-medium rounded-lg hover:bg-[#424242] hover:text-[#F5F5F5] transition-all duration-300 hover:scale-105"
                                                title={`Download screenshot ${index + 1}`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <UserAvatar className="w-8 h-8 flex-shrink-0 text-[#D98C1F]" />
            </div>
        );
    }

    if (role === 'model') {
        const CANCELLATION_TEXT = '*Request cancelled by user.*';
        const isCancelledMessage = text === CANCELLATION_TEXT;
        
        // Check if this is a failed response (error message)
        const isFailedResponse = text.includes('Error:') || 
                               text.includes('Failed') || 
                               text.includes('QUOTA_EXCEEDED') ||
                               text.includes('Network error') ||
                               text.includes('Timeout') ||
                               text.includes('Rate limit');

        if (isCancelledMessage) {
            return (
                <div key={id} className="flex items-start gap-3">
                    <Logo className="w-8 h-8 flex-shrink-0" />
                    <div className="flex items-center w-full max-w-2xl py-3 px-4">
                        <p className="text-sm italic text-[#CFCFCF]">Request cancelled by user.</p>
                    </div>
                </div>
            );
        }

        const bubbleClasses = `bg-[#2E2E2E]/60 border border-[#424242]/60 rounded-2xl rounded-tl-none py-3 px-4 relative overflow-hidden ${triumph ? 'triumph-glow' : ''} backdrop-blur-sm`;

        return (
                            <div key={id} className="flex items-start gap-3">
                    <Logo className="w-8 h-8 flex-shrink-0" />
                    <div className="flex flex-col gap-3 w-full max-w-2xl">
                        {showConfetti && <Confetti />}
                        {text.trim() && (
                            <div className={bubbleClasses}>
                                <div className="ai-response max-w-none text-[#CFCFCF]">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                                            p: ({ children, ...props }) => (
                                                <p {...props} className="mb-4 last:mb-0 leading-relaxed">
                                                    {children}
                                                </p>
                                            ),
                                            h1: ({ children, ...props }) => (
                                                <h1 {...props} className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-[#F5F5F5]">
                                                    {children}
                                                </h1>
                                            ),
                                            h2: ({ children, ...props }) => (
                                                <h2 {...props} className="text-xl font-bold mb-3 mt-5 first:mt-0 text-[#F5F5F5]">
                                                    {children}
                                                </h2>
                                            ),
                                            h3: ({ children, ...props }) => (
                                                <h3 {...props} className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-[#F5F5F5]">
                                                    {children}
                                                </h3>
                                            ),
                                            ul: ({ children, ...props }) => (
                                                <ul {...props} className="list-disc list-inside mb-4 space-y-1">
                                                    {children}
                                                </ul>
                                            ),
                                            ol: ({ children, ...props }) => (
                                                <ol {...props} className="list-decimal list-inside mb-4 space-y-1">
                                                    {children}
                                                </ol>
                                            ),
                                            li: ({ children, ...props }) => (
                                                <li {...props} className="text-[#CFCFCF]">
                                                    {children}
                                                </li>
                                            ),
                                            blockquote: ({ children, ...props }) => (
                                                <blockquote {...props} className="border-l-4 border-[#FF4D4D] bg-[#FF4D4D]/10 pl-4 py-2 my-4 rounded-r-md italic">
                                                    {children}
                                                </blockquote>
                                            ),
                                            code: ({ children, ...props }) => (
                                                <code {...props} className="bg-[#FFAB40]/20 text-[#FFAB40] px-1.5 py-0.5 rounded text-sm font-mono">
                                                    {children}
                                                </code>
                                            ),
                                            pre: ({ children, ...props }) => (
                                                <pre {...props} className="bg-[#1C1C1C]/80 p-4 rounded-lg overflow-x-auto my-4">
                                                    <code className="text-[#CFCFCF]">
                                                        {children}
                                                    </code>
                                                </pre>
                                            )
                                        }}
                                    >
                                        {text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                    {isLoading && (
                         <div className="flex items-center gap-4 py-3 px-4 bg-[#2E2E2E]/30 rounded-xl border border-[#424242]/40 backdrop-blur-sm">
                            <TypingIndicator />
                            <button
                                onClick={onStop}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 bg-[#424242]/60 border-[#5A5A5A] hover:bg-[#424242] hover:border-[#6E6E6E] text-[#CFCFCF] hover:text-[#F5F5F5] hover:scale-105"
                                aria-label="Stop generating response"
                            >
                                Stop
                            </button>
                        </div>
                    )}

                    {!isLoading && text.trim() && !showUpgradeButton && !isFailedResponse && (
                         <div className="pl-2 pt-2">
                            <FeedbackButtons onFeedback={onFeedback} feedbackState={feedback} />
                        </div>
                    )}

                    {/* Retry button for failed responses */}
                    {!isLoading && isFailedResponse && onRetry && (
                        <div className="pt-3 animate-fade-in">
                            <button
                                onClick={onRetry}
                                className="flex items-center justify-center gap-2 w-auto text-sm bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-[#5CBB7B]/25"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </button>
                        </div>
                    )}

                    {showUpgradeButton && !isLoading && (
                        <div className="pt-3 animate-fade-in">
                            <button
                                onClick={onUpgradeClick}
                                className="flex items-center justify-center gap-2 w-auto text-sm bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E53A3A]/25"
                            >
                                <StarIcon className="w-4 h-4" />
                                Upgrade to Pro
                            </button>
                        </div>
                    )}

                    {suggestions && !isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-fade-in">
                            {suggestions.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => onPromptClick(prompt)}
                                    className="text-left p-4 bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-xl transition-all duration-200 hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60 hover:scale-[1.02] backdrop-blur-sm"
                                >
                                    <p className="text-[#CFCFCF] font-medium text-sm leading-relaxed">{prompt}</p>
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