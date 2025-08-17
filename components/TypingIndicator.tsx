import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-[#FF4D4D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-[#FFAB40] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-[#5CBB7B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm text-[#A3A3A3] font-medium">AI is thinking...</span>
    </div>
  );
};

export default TypingIndicator;