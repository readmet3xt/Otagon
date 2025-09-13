import React from 'react';

interface SimpleLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const SimpleLoadingSpinner: React.FC<SimpleLoadingSpinnerProps> = ({ 
  size = 'md', 
  color = '#FF4D4D',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 sm:w-5 sm:h-5',
    md: 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10',
    lg: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div 
        className="w-full h-full border-2 border-gray-300 border-t-current rounded-full animate-spin"
        style={{ borderTopColor: color }}
      />
    </div>
  );
};

export default SimpleLoadingSpinner;
