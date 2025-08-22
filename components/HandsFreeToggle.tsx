
import React from 'react';
import { pwaNavigationService } from '../services/pwaNavigationService';

export const HandsFreeIcon: React.FC<{ isActive: boolean; className?: string }> = ({ isActive, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill={isActive ? 'currentColor' : 'none'}/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </svg>
);

interface HandsFreeToggleProps {
  isHandsFree: boolean;
  onToggle: () => void;
}

const HandsFreeToggle: React.FC<HandsFreeToggleProps> = ({ isHandsFree, onToggle }) => {
  const handleToggle = () => {
    // Update PWA navigation service with hands-free preference
    pwaNavigationService.setHandsFreePreference(!isHandsFree);
    
    // Call the original toggle function
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 h-12 rounded-xl text-sm font-medium transition-all duration-200 group
      ${
        isHandsFree
          ? 'border-2 border-[#E53A3A]/50 text-[#FF7070] hover:bg-[#E53A3A]/10 shadow-[0_0_12px_rgba(229,58,58,0.3)]'
          : 'bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105'
      }
      `}
      aria-pressed={isHandsFree}
      aria-label="Hands-Free Settings"
      title={isHandsFree ? 'Hands-Free Settings' : 'Hands-Free Settings (Pro feature)'}
    >
      <HandsFreeIcon className="w-5 h-5" isActive={isHandsFree} />
      <span className="hidden sm:inline">
        Hands-Free
      </span>
    </button>
  );
};

export default HandsFreeToggle;