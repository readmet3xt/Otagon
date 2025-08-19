import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'avatar' | 'card';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | false;
  className?: string;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  lines = 1
}) => {
  const getAnimationClass = () => {
    if (animation === false) return '';
    if (animation === 'wave') return 'animate-wave';
    return 'animate-pulse';
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded';
      case 'circular':
        return 'rounded-full bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]';
      case 'rectangular':
        return 'bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded';
      case 'avatar':
        return 'w-12 h-12 rounded-full bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]';
      case 'card':
        return 'bg-gradient-to-r from-[#2E2E2E]/50 to-[#1C1C1C]/50 rounded-lg border border-[#424242]/30 p-4';
      default:
        return 'h-4 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded';
    }
  };

  const getDefaultDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: width || '100%', height: height || '1rem' };
      case 'circular':
        return { width: width || '2rem', height: height || '2rem' };
      case 'rectangular':
        return { width: width || '100%', height: height || '200px' };
      case 'avatar':
        return { width: width || '3rem', height: height || '3rem' };
      case 'card':
        return { width: width || '100%', height: height || 'auto' };
      default:
        return { width: width || '100%', height: height || '1rem' };
    }
  };

  const dimensions = getDefaultDimensions();

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${getVariantClasses()} ${getAnimationClass()}`}
            style={{
              width: index === lines - 1 ? '80%' : '100%',
              height: dimensions.height
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${getVariantClasses()} ${getAnimationClass()} ${className}`} style={{ width: dimensions.width, height: dimensions.height }}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded" style={{ width: '60%' }}></div>
              <div className="h-3 bg-gradient-to-r from-[#FFAB40]/20 to-[#5CBB7B]/20 rounded" style={{ width: '40%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-[#5CBB7B]/20 to-[#FF4D4D]/20 rounded"></div>
            <div className="h-4 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded" style={{ width: '90%' }}></div>
            <div className="h-4 bg-gradient-to-r from-[#FFAB40]/20 to-[#5CBB7B]/20 rounded" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${getVariantClasses()} ${getAnimationClass()} ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    />
  );
};

export default Skeleton;




