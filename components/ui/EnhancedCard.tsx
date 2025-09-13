import React from 'react';
import { cn } from '../../utils/cn';

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  variant = 'default',
  size = 'md',
  hover = false,
  interactive = false,
  className,
  children,
  ...props
}) => {
  const baseClasses = cn(
    "relative overflow-hidden transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:ring-offset-2 focus:ring-offset-transparent"
  );

  const sizeClasses = {
    sm: "p-4 rounded-lg",
    md: "p-6 rounded-xl",
    lg: "p-8 rounded-2xl"
  };

  const variantClasses = {
    default: cn(
      "bg-[#1C1C1C] border border-[#424242]/40",
      "shadow-lg"
    ),
    elevated: cn(
      "bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#424242]/40",
      "shadow-2xl",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#E53A3A]/10 before:to-[#FFAB40]/10 before:opacity-0 before:transition-opacity before:duration-300",
      "hover:before:opacity-100"
    ),
    outlined: cn(
      "bg-transparent border-2 border-[#424242]",
      "hover:border-[#FFAB40]/50"
    ),
    filled: cn(
      "bg-[#2E2E2E] border-0",
      "hover:bg-[#424242]"
    )
  };

  const interactionClasses = cn(
    hover && "hover:scale-[1.02] hover:shadow-xl",
    interactive && "cursor-pointer hover:bg-[#2E2E2E]/50 active:scale-[0.98]"
  );

  const classes = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    interactionClasses,
    className
  );

  return (
    <div
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({ className, children, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  >
    {children}
  </div>
);

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle: React.FC<CardTitleProps> = ({ 
  className, 
  children, 
  as: Component = 'h3',
  ...props 
}) => (
  <Component
    className={cn("text-lg font-semibold leading-none tracking-tight text-[#F5F5F5]", className)}
    {...props}
  >
    {children}
  </Component>
);

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const CardDescription: React.FC<CardDescriptionProps> = ({ className, children, ...props }) => (
  <p
    className={cn("text-sm text-[#A3A3A3]", className)}
    {...props}
  >
    {children}
  </p>
);

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardContent: React.FC<CardContentProps> = ({ className, children, ...props }) => (
  <div
    className={cn("pt-0", className)}
    {...props}
  >
    {children}
  </div>
);

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardFooter: React.FC<CardFooterProps> = ({ className, children, ...props }) => (
  <div
    className={cn("flex items-center pt-4", className)}
    {...props}
  >
    {children}
  </div>
);

export {
  EnhancedCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};
