// src/components/features/SuggestedPrompts.tsx

import React from 'react';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  isLoading: boolean;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ prompts, onPromptClick, isLoading }) => {
  if (isLoading || prompts.length === 0) {
    return null; // Don't show anything while AI is thinking or if no prompts
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onPromptClick(prompt)}
          className="bg-gray-800 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;
