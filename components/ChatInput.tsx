import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import CameraIcon from './CameraIcon';
import SendIcon from './SendIcon';
import { ConnectionStatus, Usage, Conversation } from '../services/types';
import ManualUploadToggle from './ManualUploadToggle';
import CommandSuggestions from './CommandSuggestions';

type ImageFile = { base64: string; mimeType: string, dataUrl: string };

const fileToBase64 = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [meta, data] = dataUrl.split(',');
      if (!meta || !data) {
        return reject(new Error('Invalid data URL format.'));
      }
      const mimeType = meta.split(';')[0].split(':')[1];
      resolve({ base64: data, mimeType, dataUrl });
    };
    reader.onerror = (error) => reject(error);
  });
};

const convertImage = (file: File, targetMimeType: 'image/jpeg' | 'image/png'): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
          if (!event.target?.result) {
              return reject(new Error("Couldn't read file."));
          }
          const img = new Image();
          img.src = event.target.result as string;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                  return reject(new Error('Could not get canvas context'));
              }
              if (targetMimeType === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL(targetMimeType, 0.9);
              const [meta, data] = dataUrl.split(',');
              if (!meta || !data) {
                return reject(new Error('Could not convert image to data URL.'));
              }
              resolve({ base64: data, mimeType: targetMimeType, dataUrl });
          };
          img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
  });
};


interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSendMessage: (text: string, images?: ImageFile[]) => void;
    isCooldownActive: boolean;
    onImageProcessingError: (string) => void;
    usage: Usage;
    imagesForReview: ImageFile[];
    onImagesReviewed: () => void;
    isManualUploadMode: boolean;
    onToggleManualUploadMode: () => void;
    connectionStatus: ConnectionStatus;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    onBatchUploadAttempt: () => void;
    hasInsights: boolean;
    activeConversation: Conversation | undefined;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSendMessage, isCooldownActive, onImageProcessingError, usage, imagesForReview, onImagesReviewed, isManualUploadMode, onToggleManualUploadMode, connectionStatus, textareaRef, onBatchUploadAttempt, hasInsights, activeConversation }) => {
    const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Command Suggestion State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [suggestionStartPosition, setSuggestionStartPosition] = useState<number | null>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            const MAX_HEIGHT = 144; // Approx 6 lines of text
            const MIN_HEIGHT = 44;

            if (value.trim() === '' && selectedImages.length === 0) {
                 textarea.style.height = `${MIN_HEIGHT}px`;
            } else {
                textarea.style.height = 'auto';
                const scrollHeight = textarea.scrollHeight;
                const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
                textarea.style.height = `${newHeight}px`;
            }
        }
    }, [value, selectedImages, textareaRef]);

    useEffect(() => {
        if (imagesForReview && imagesForReview.length > 0) {
            setSelectedImages(prev => {
                const combined = [...prev, ...imagesForReview];
                const limit = usage.tier !== 'free' ? 5 : 1;
                if (combined.length > limit) {
                    return combined.slice(-limit);
                }
                return combined;
            });
            onImagesReviewed();
        }
    }, [imagesForReview, onImagesReviewed, usage.tier]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            if (event.target) event.target.value = '';
            return;
        }

        if (usage.tier === 'free' && (files.length > 1 || selectedImages.length > 0)) {
            onBatchUploadAttempt();
            if (event.target) event.target.value = '';
            return;
        }

        const limit = usage.tier !== 'free' ? 5 : 1;
        if (selectedImages.length + files.length > limit) {
            onImageProcessingError(`You can select a maximum of ${limit} image(s).`);
            if (event.target) event.target.value = '';
            return;
        }

        const newImagesPromises = Array.from(files).map(async file => {
            if (!file.type.startsWith('image/')) return null;
            try {
                if (file.type === 'image/avif' || file.type === 'image/heic' || file.type === 'image/heif') {
                    return await convertImage(file, 'image/jpeg');
                } else {
                    return await fileToBase64(file);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during file processing.';
                onImageProcessingError(`Failed to process image. ${errorMessage}`);
                return null;
            }
        });

        const newImages = (await Promise.all(newImagesPromises)).filter((img): img is ImageFile => img !== null);
        setSelectedImages(prev => [...prev, ...newImages]);

        if (event.target) event.target.value = '';
    };
    
    const submitMessage = () => {
        if (!value.trim() && selectedImages.length === 0) return;
        onSendMessage(value, selectedImages.length > 0 ? selectedImages : undefined);
        setSelectedImages([]);
        setShowSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
            handleSelectSuggestion(suggestions[activeSuggestionIndex]);
        } else {
            submitMessage();
        }
    };

    const handleSelectSuggestion = (suggestion: string) => {
        if (suggestionStartPosition === null) return;

        const textBefore = value.substring(0, suggestionStartPosition);
        const textAfter = value.substring(suggestionStartPosition + suggestionQuery.length + 1); // +1 for the @

        const newValue = `${textBefore}@${suggestion} ${textAfter.trimStart()}`;
        onChange(newValue);

        setShowSuggestions(false);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeSuggestionIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitMessage();
        }
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        if (usage.tier === 'free' || !activeConversation || !activeConversation.insights) {
            setShowSuggestions(false);
            return;
        }

        const cursorPos = e.target.selectionStart;
        const textUpToCursor = newValue.slice(0, cursorPos);
        const atIndex = textUpToCursor.lastIndexOf('@');
        
        // Trigger condition: '@' is at the start of the string or preceded by a space.
        const isTrigger = atIndex !== -1 && (atIndex === 0 || /\s/.test(newValue[atIndex - 1]));

        if (isTrigger) {
            const query = textUpToCursor.substring(atIndex + 1);
            // Don't show suggestions if there's another '@' or a newline after the trigger.
            if (query.includes('@') || query.includes('\n')) {
                setShowSuggestions(false);
                return;
            }

            const insightTitles = activeConversation.insightsOrder
                ? activeConversation.insightsOrder.map(id => activeConversation.insights![id].title)
                : [];

            const filtered = insightTitles.filter(title => title.toLowerCase().includes(query.toLowerCase()));
            
            if (filtered.length > 0) {
                setSuggestions(filtered);
                setActiveSuggestionIndex(0);
                setSuggestionQuery(query);
                setSuggestionStartPosition(atIndex);
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const isProcessing = isCooldownActive;
    const canSubmit = (!!value.trim() || selectedImages.length > 0) && !isProcessing;
    const showReviewToggle = connectionStatus === ConnectionStatus.CONNECTED;

    const getPlaceholderText = () => {
        if (isProcessing) {
            return "AI is thinking...";
        }
        if (usage.tier !== 'free' && hasInsights) {
            return "Ask, or use @ to manage tabs...";
        }
        return "Ask a question";
    };
    const placeholderText = getPlaceholderText();
    const maxImages = usage.tier !== 'free' ? 5 : 1;

    return (
        <div className="pt-2 pb-4 px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto flex flex-col gap-2">
                {selectedImages.length > 0 && (
                     <div className="flex overflow-x-auto space-x-2 p-2 scroll-smooth">
                        {selectedImages.map((image, index) => (
                            <div key={index} className="relative flex-shrink-0 animate-fade-in">
                                <img src={image.dataUrl} alt={`Selected preview ${index + 1}`} className="h-20 w-auto rounded-md"/>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute -top-2 -right-2 bg-[#E53A3A] text-[#F5F5F5] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-[#E53A3A] hover:brightness-90 transition-transform hover:scale-110"
                                    aria-label={`Remove image ${index + 1}`}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-[1px] bg-neutral-800/80 rounded-full focus-within:bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] transition-colors duration-200">
                    <div className="flex items-center bg-[#181818] rounded-full w-full px-2 gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,image/avif" 
                            multiple={usage.tier !== 'free'} 
                            className="hidden"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Upload screenshot"
                            disabled={isProcessing || selectedImages.length >= maxImages}
                            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-[#FF4D4D] hover:bg-[#2E2E2E] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                            <CameraIcon className="w-5 h-5"/>
                        </button>
                        <div className="relative flex-grow">
                             {showSuggestions && (
                                <CommandSuggestions
                                    suggestions={suggestions}
                                    activeIndex={activeSuggestionIndex}
                                    onSelect={handleSelectSuggestion}
                                    onHover={setActiveSuggestionIndex}
                                />
                            )}
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                style={{ height: '44px' }}
                                value={value}
                                onChange={handleValueChange}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholderText}
                                className="flex-grow w-full bg-transparent py-2.5 px-2 text-[#F5F5F5] placeholder-[#A3A3A3] focus:outline-none resize-none overflow-y-auto disabled:opacity-60"
                                aria-label="Chat input"
                                disabled={isProcessing}
                            />
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-1">
                            {showReviewToggle && (
                                <ManualUploadToggle
                                    isManualMode={isManualUploadMode}
                                    onToggle={onToggleManualUploadMode}
                                />
                            )}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                aria-label="Send message"
                                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 disabled:cursor-not-allowed ${
                                    canSubmit 
                                    ? 'bg-[#FFAB40] text-[#181818] scale-100 hover:brightness-95 active:scale-95' 
                                    : 'bg-neutral-800 text-neutral-600 scale-100'
                                }`}
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default React.memo(ChatInput);