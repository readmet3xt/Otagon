import React from 'react';

interface FounderImageProps {
  className?: string;
}

const FounderImage: React.FC<FounderImageProps> = ({ className = '' }) => {
  return (
    <div className={`founder-image ${className}`}>
      <img 
        src="/images/founders/founder-bio.jpg" 
        alt="Founder" 
        className="w-full h-auto rounded-lg"
      />
    </div>
  );
};

export default FounderImage;

