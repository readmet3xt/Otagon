import React from 'react';

interface CircularProgressProps {
  variant?: 'indeterminate' | 'determinate';
  value?: number; // 0-100 for determinate variant
  size?: 'small' | 'medium' | 'large';
  thickness?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  showLabel?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  variant = 'indeterminate',
  value = 0,
  size = 'medium',
  thickness = 4,
  color = 'primary',
  className = '',
  showLabel = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6';
      case 'large':
        return 'w-16 h-16';
      default:
        return 'w-8 h-8';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return {
          track: 'border-[#424242]/30',
          progress: 'border-[#FF4D4D]',
          center: 'bg-[#FF4D4D]'
        };
      case 'secondary':
        return {
          track: 'border-[#424242]/30',
          progress: 'border-[#FFAB40]',
          center: 'bg-[#FFAB40]'
        };
      case 'success':
        return {
          track: 'border-[#424242]/30',
          progress: 'border-[#5CBB7B]',
          center: 'bg-[#5CBB7B]'
        };
      case 'warning':
        return {
          track: 'border-[#424242]/30',
          progress: 'border-[#FFAB40]',
          center: 'bg-[#FFAB40]'
        };
      case 'error':
        return {
          track: 'border-[#424242]/30',
          progress: 'border-[#FF4D4D]',
          center: 'bg-[#FF4D4D]'
        };
      default:
        return {
          track: 'border-[#424242]/30',
          progress: 'border-[#FF4D4D]',
          center: 'bg-[#FF4D4D]'
        };
    }
  };

  const getMultiColorClasses = () => ({
    track: 'border-[#424242]/30',
    progress: 'border-transparent',
    center: 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]'
  });

  const colors = color === 'primary' ? getMultiColorClasses() : getColorClasses();
  const sizeClasses = getSizeClasses();

  if (variant === 'determinate') {
    const circumference = 2 * Math.PI * (parseInt(sizeClasses.split(' ')[0].replace('w-', '')) / 4 - thickness / 2);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <svg className={`${sizeClasses} transform -rotate-90`} viewBox="0 0 24 24">
          {/* Background track */}
          <circle
            className={`${colors.track}`}
            strokeWidth={thickness}
            fill="transparent"
            r={(parseInt(sizeClasses.split(' ')[0].replace('w-', '')) / 4) - thickness / 2}
            cx="12"
            cy="12"
          />
          {/* Progress circle */}
          <circle
            className={`${colors.progress} transition-all duration-300 ease-in-out`}
            strokeWidth={thickness}
            fill="transparent"
            r={(parseInt(sizeClasses.split(' ')[0].replace('w-', '')) / 4) - thickness / 2}
            cx="12"
            cy="12"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {showLabel && (
            <span className="text-xs font-medium text-[#CFCFCF]">{Math.round(value)}%</span>
          )}
        </div>
      </div>
    );
  }

  // Indeterminate variant (spinning)
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses} relative`}>
        {/* Outer ring (track) */}
        <div className={`absolute inset-0 ${sizeClasses} border-2 ${colors.track} rounded-full`}></div>
        
        {/* Animated ring (progress) */}
        <div 
          className={`absolute inset-0 ${sizeClasses} border-2 ${colors.progress} rounded-full animate-spin`}
          style={{
            borderTopColor: color === 'primary' ? '#FF4D4D' : undefined,
            borderRightColor: color === 'primary' ? '#FFAB40' : undefined,
            borderBottomColor: color === 'primary' ? '#5CBB7B' : undefined,
            borderLeftColor: 'transparent'
          }}
        ></div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-2 h-2 ${colors.center} rounded-full animate-pulse`}></div>
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;








