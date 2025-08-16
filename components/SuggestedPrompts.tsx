

import React from 'react';
import { newsPrompts } from '../services/types';

interface SuggestedPromptsProps {
    onPromptClick: (prompt: string) => void;
    isInputDisabled: boolean;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onPromptClick, isInputDisabled }) => {
    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="mb-4 text-center">
                <p className="text-[#A3A3A3]">
                    Try a suggestion or ask your own question below.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {newsPrompts.map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => onPromptClick(prompt)}
                        disabled={isInputDisabled}
                        className="text-left p-4 bg-[#1C1C1C]/50 border border-[#424242] rounded-lg transition-colors duration-200 hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60 disabled:bg-[#1C1C1C]/20 disabled:border-[#2E2E2E] disabled:cursor-not-allowed"
                    >
                        <p className="text-[#E5E5E5] font-medium disabled:text-[#6E6E6E]">{prompt}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default React.memo(SuggestedPrompts);