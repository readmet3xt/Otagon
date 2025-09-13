import React from 'react';
import { cn } from '../../utils/cn';

// ===== LOADING SPINNER =====

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 sm:w-5 sm:h-5',
    md: 'w-6 h-6 sm:w-8 sm:h-8',
    lg: 'w-8 h-8 sm:w-10 sm:h-10',
    xl: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14'
  };

  const colorClasses = {
    primary: 'text-[#E53A3A]',
    secondary: 'text-[#FFAB40]',
    white: 'text-white',
    gray: 'text-[#A3A3A3]'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

// ===== SKELETON LOADER =====

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-[#2E2E2E] rounded';
  
  const variantClasses = {
    text: 'h-4 rounded-md',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
};

// ===== SKELETON COMPONENTS =====

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="rectangular" height={100} />
    <div className="space-y-2">
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </div>
  </div>
);

const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

const SkeletonButton: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32'
  };

  return (
    <Skeleton
      variant="rectangular"
      className={cn(sizeClasses[size], 'rounded-lg', className)}
    />
  );
};

// ===== PROGRESS BAR =====

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    primary: 'bg-gradient-to-r from-[#E53A3A] to-[#FFAB40]',
    secondary: 'bg-[#FFAB40]',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-[#A3A3A3] mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-[#2E2E2E] rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ===== LOADING OVERLAY =====

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  spinner?: React.ReactNode;
  text?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  spinner,
  text,
  className
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="flex flex-col items-center space-y-4">
          {spinner || <LoadingSpinner size="lg" />}
          {text && (
            <p className="text-[#CFCFCF] text-sm font-medium">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== LOADING BUTTON =====

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  loadingText,
  className,
  disabled,
  onClick
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white rounded-lg font-medium transition-all duration-200',
        'hover:from-[#dc2626] hover:to-[#f59e0b] hover:scale-[1.02]',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:ring-offset-2 focus:ring-offset-transparent',
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && <LoadingSpinner size="sm" color="white" />}
      {isLoading ? (loadingText || children) : children}
    </button>
  );
};

export {
  LoadingSpinner,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonButton,
  ProgressBar,
  LoadingOverlay,
  LoadingButton
};
