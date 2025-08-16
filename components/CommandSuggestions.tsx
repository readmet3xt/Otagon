
import React from 'react';

interface CommandSuggestionsProps {
  suggestions: string[];
  activeIndex: number;
  onSelect: (suggestion: string) => void;
  onHover: (index: number) => void;
}

const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ suggestions, activeIndex, onSelect, onHover }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#2E2E2E] border border-[#424242] rounded-lg shadow-lg max-h-48 overflow-y-auto z-20 animate-fade-in">
      <ul className="p-1">
        {suggestions.map((suggestion, index) => (
          <li key={suggestion}>
            <button
              type="button"
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                index === activeIndex ? 'bg-[#424242] text-white' : 'text-neutral-300 hover:bg-[#424242]'
              }`}
              onClick={() => onSelect(suggestion)}
              onMouseMove={() => onHover(index)}
            >
              @{suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommandSuggestions;
