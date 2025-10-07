// src/components/ui/ActiveSessionToggle.tsx

import React from 'react';

interface ActiveSessionToggleProps {
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const ActiveSessionToggle: React.FC<ActiveSessionToggleProps> = ({ isActive, onClick, disabled }) => {
  const buttonClasses = `
    px-4 py-2 rounded-lg text-sm font-semibold border
    transition-colors duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${isActive
      ? 'bg-red-500 border-red-400 text-white'
      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
    }
  `;

  return (
    <button onClick={onClick} disabled={disabled} className={buttonClasses}>
      {isActive ? '● Active Session' : '○ Start Session'}
    </button>
  );
};
