import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">O</span>
      </div>
      <span className="text-xl font-bold text-gray-900">Otagon</span>
    </div>
  );
};

export default Logo;
