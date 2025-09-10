import React from 'react';
import { cn } from '../../utils/cn';
import { theme } from '../../utils/designTokens';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'floating' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  as?: React.ElementType;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  href?: string;
  target?: string;
  rel?: string;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  as: Component = 'button',
  children,
  leftIcon,
  rightIcon,
  loadingText,
  ...props
}) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "relative overflow-hidden group",
    "transform-gpu will-change-transform"
  );
  
  const sizeClasses = {
    xs: "h-6 px-2 text-xs rounded-md gap-1",
    sm: "h-8 px-3 text-sm rounded-md gap-1.5",
    md: "h-10 px-4 text-base rounded-lg gap-2",
    lg: "h-12 px-6 text-lg rounded-lg gap-2.5",
    xl: "h-14 px-8 text-xl rounded-xl gap-3"
  };
  
  const variantClasses = {
    primary: cn(
      "bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white",
      "hover:from-[#dc2626] hover:to-[#f59e0b] hover:scale-[1.02]",
      "active:scale-[0.98] active:from-[#b91c1c] active:to-[#d97706]",
      "focus:ring-[#FFAB40]/50 shadow-lg hover:shadow-xl",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent",
      "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
    ),
    secondary: cn(
      "bg-[#2E2E2E] border border-[#424242] text-[#CFCFCF]",
      "hover:bg-[#424242] hover:text-[#F5F5F5] hover:border-[#525252]",
      "active:bg-[#424242] active:scale-[0.98]",
      "focus:ring-[#FFAB40]/50 shadow-sm hover:shadow-md"
    ),
    outline: cn(
      "bg-transparent border-2 border-[#424242] text-[#CFCFCF]",
      "hover:bg-[#2E2E2E] hover:text-[#F5F5F5] hover:border-[#FFAB40]",
      "active:bg-[#424242] active:scale-[0.98]",
      "focus:ring-[#FFAB40]/50"
    ),
    ghost: cn(
      "bg-transparent text-[#A3A3A3]",
      "hover:bg-[#2E2E2E]/50 hover:text-[#F5F5F5]",
      "active:bg-[#2E2E2E] active:scale-[0.98]",
      "focus:ring-[#FFAB40]/50"
    ),
    danger: cn(
      "bg-red-600 text-white",
      "hover:bg-red-700 hover:scale-[1.02]",
      "active:scale-[0.98] active:bg-red-800",
      "focus:ring-red-500/50 shadow-lg hover:shadow-xl"
    ),
    success: cn(
      "bg-green-600 text-white",
      "hover:bg-green-700 hover:scale-[1.02]",
      "active:scale-[0.98] active:bg-green-800",
      "focus:ring-green-500/50 shadow-lg hover:shadow-xl"
    ),
    floating: cn(
      "bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white rounded-full",
      "hover:from-[#dc2626] hover:to-[#f59e0b] hover:scale-110",
      "active:scale-95 shadow-2xl hover:shadow-[0_0_20px_rgba(229,58,58,0.3)]",
      "focus:ring-[#FFAB40]/50"
    ),
    icon: cn(
      "bg-transparent text-[#A3A3A3] p-2 rounded-lg",
      "hover:bg-[#2E2E2E] hover:text-[#F5F5F5]",
      "active:scale-95 focus:ring-[#FFAB40]/50"
    )
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  
  const classes = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClass,
    className
  );

  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current border-r-current" />
  );

  return (
    <Component
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          {loadingText || children}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </Component>
  );
};

export default EnhancedButton;
