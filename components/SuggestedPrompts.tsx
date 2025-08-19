

import React from 'react';
import { newsPrompts } from '../services/types';

interface SuggestedPromptsProps {
    onPromptClick: (prompt: string) => void;
    isInputDisabled: boolean;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onPromptClick, isInputDisabled }) => {
    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-[#F5F5F5] mb-3">Welcome to Otakon! 🎮</h2>
                <p className="text-[#A3A3A3] text-lg leading-relaxed">
                    Your AI gaming companion is ready to help. Try a suggestion or ask your own question below.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsPrompts.map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => onPromptClick(prompt)}
                        disabled={isInputDisabled}
                        className="text-left p-6 bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 border-2 border-[#424242]/40 rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#E53A3A]/20 hover:to-[#D98C1F]/20 hover:border-[#E53A3A]/60 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 disabled:bg-[#1C1C1C]/20 disabled:border-[#2E2E2E] disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none backdrop-blur-sm group"
                    >
                        <p className="text-[#E5E5E5] font-semibold text-base leading-relaxed disabled:text-[#6E6E6E] group-hover:text-[#F5F5F5]">{prompt}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default React.memo(SuggestedPrompts);