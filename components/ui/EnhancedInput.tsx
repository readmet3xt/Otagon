import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface EnhancedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  className,
  disabled,
  ...props
}, ref) => {
  const baseClasses = cn(
    "w-full transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "placeholder:text-[#A3A3A3]"
  );

  const sizeClasses = {
    sm: "h-8 px-3 text-sm rounded-md",
    md: "h-10 px-4 text-base rounded-lg",
    lg: "h-12 px-5 text-lg rounded-lg"
  };

  const variantClasses = {
    default: cn(
      "bg-[#1C1C1C] border border-[#424242] text-[#F5F5F5]",
      "hover:border-[#525252] focus:border-[#FFAB40] focus:ring-[#FFAB40]/50",
      "disabled:bg-[#0A0A0A] disabled:border-[#2E2E2E]"
    ),
    filled: cn(
      "bg-[#2E2E2E] border-0 text-[#F5F5F5]",
      "hover:bg-[#424242] focus:bg-[#424242] focus:ring-[#FFAB40]/50",
      "disabled:bg-[#1C1C1C]"
    ),
    outlined: cn(
      "bg-transparent border-2 border-[#424242] text-[#F5F5F5]",
      "hover:border-[#525252] focus:border-[#FFAB40] focus:ring-[#FFAB40]/50",
      "disabled:border-[#2E2E2E]"
    )
  };

  const inputClasses = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    leftIcon && "pl-10",
    rightIcon && "pr-10",
    error && "border-red-500 focus:border-red-500 focus:ring-red-500/50",
    fullWidth && "w-full",
    className
  );

  const containerClasses = cn(
    "relative",
    fullWidth && "w-full"
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A3A3A3]">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A3A3A3]">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-[#A3A3A3]">
          {helperText}
        </p>
      )}
    </div>
  );
});

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;
