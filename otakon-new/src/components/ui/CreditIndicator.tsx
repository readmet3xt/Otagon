import React from 'react';
import { User } from '../../types';

interface CreditIndicatorProps {
  user: User;
  onClick: () => void;
}


const CreditIndicator: React.FC<CreditIndicatorProps> = ({ user, onClick }) => {
  const { textCount, textLimit, imageCount, imageLimit } = user.usage;
  

  const textPercentRemaining = textLimit > 0 ? Math.max(0, 100 - (textCount / textLimit) * 100) : 0;
  const imagePercentRemaining = imageLimit > 0 ? Math.max(0, 100 - (imageCount / imageLimit) * 100) : 0;

  const radiusOuter = 13;
  const circumferenceOuter = 2 * Math.PI * radiusOuter;
  const offsetOuter = circumferenceOuter - (textPercentRemaining / 100) * circumferenceOuter;

  const radiusInner = 8;
  const circumferenceInner = 2 * Math.PI * radiusInner;
  const offsetInner = circumferenceInner - (imagePercentRemaining / 100) * circumferenceInner;

  const strokeWidth = 3.5;

  return (
    <div 
      className="credit-indicator-wrapper"
      style={{
        boxShadow: '0 4px 15px rgba(229, 58, 58, 0.25), 0 2px 8px rgba(217, 140, 31, 0.2), 0 0 10px rgba(229, 58, 58, 0.15)',
        display: 'inline-block'
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className="credit-indicator-button flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px]"
        style={{
          background: 'rgba(0, 0, 0, 0.3) !important',
          border: '2px solid transparent !important',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(135deg, rgba(229, 58, 58, 0.4), rgba(217, 140, 31, 0.4)) !important',
          backgroundOrigin: 'border-box !important',
          backgroundClip: 'padding-box, border-box !important',
          outline: 'none !important',
          boxShadow: 'none !important'
        }}
        aria-label="View query credits"
      >
        {/* All Screen Sizes: Circular Bars */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 flex items-center justify-center rounded-full p-0.5" style={{
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="sky-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="emerald-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Outer circle (text) - only the colored ring */}
            <circle 
              cx="16" cy="16" r={radiusOuter} 
              stroke="url(#sky-gradient)" 
              strokeWidth={strokeWidth} 
              strokeDasharray={circumferenceOuter}
              strokeDashoffset={offsetOuter}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
            {/* Inner circle (image) - only the colored ring */}
            <circle 
              cx="16" cy="16" r={radiusInner} 
              stroke="url(#emerald-gradient)" 
              strokeWidth={strokeWidth}
              strokeDasharray={circumferenceInner}
              strokeDashoffset={offsetInner}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
            />
          </svg>
        </div>
      </button>
    </div>
  );
};

export default CreditIndicator;
