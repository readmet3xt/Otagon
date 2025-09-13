import React from 'react';

interface FounderImageProps {
  className?: string;
}

const FounderImage: React.FC<FounderImageProps> = ({ className = "w-32 h-32" }) => {
  return (
    <div className={`${className} bg-gray-200 rounded-full flex items-center justify-center`}>
      <span className="text-gray-500 text-sm">Founder Image</span>
    </div>
  );
};

export default FounderImage;
