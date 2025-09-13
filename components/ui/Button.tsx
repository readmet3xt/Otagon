import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  as?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  disabled,
  as: Component = 'button',
  children,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeClasses = {
    sm: "py-2 px-3 text-sm rounded-md",
    md: "py-3 px-6 text-base rounded-lg",
    lg: "py-4 px-8 text-lg rounded-lg",
    xl: "py-4 px-10 text-lg rounded-full"
  };
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white hover:scale-105 focus:ring-[#FFAB40] shadow-lg",
    secondary: "bg-[#2E2E2E] border border-[#424242] text-[#CFCFCF] hover:bg-[#424242] hover:text-[#F5F5F5] focus:ring-[#FFAB40]",
    outline: "bg-transparent border-2 border-[#424242] text-[#CFCFCF] hover:bg-[#424242] hover:text-[#F5F5F5] focus:ring-[#FFAB40]",
    ghost: "bg-transparent text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#2E2E2E]/30 focus:ring-[#FFAB40]",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  
  const classes = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClass,
    className
  );

  return (
    <Component
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-transparent border-t-current border-r-current border-b-current mr-2" />
      )}
      {children}
    </Component>
  );
};

export default Button;
