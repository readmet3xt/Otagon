import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`logo ${className}`}>
      <span className="text-2xl font-bold text-blue-600">Otakon</span>
    </div>
  );
};

export default Logo;

