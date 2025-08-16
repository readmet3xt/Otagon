import React from 'react';
import FounderImage from './FounderImage';

interface FounderProfileProps {
  className?: string;
  variant?: 'card' | 'inline' | 'hero';
}

const FounderProfile: React.FC<FounderProfileProps> = ({ 
  className = "", 
  variant = 'card' 
}) => {
  if (variant === 'hero') {
    return (
      <div className={`text-center ${className}`}>
        <div className="flex justify-center mb-6">
          <FounderImage size="xl" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-3">
          Meet Our Founder
        </h2>
        
        <p className="text-lg text-[#A3A3A3] mb-4 max-w-2xl mx-auto">
          A passionate gamer and AI enthusiast who envisioned a future where every player 
          has an intelligent companion to enhance their gaming experience.
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm text-[#A3A3A3]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>AI Gaming Visionary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#E53A3A] rounded-full"></div>
            <span>Gaming Enthusiast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#D98C1F] rounded-full"></div>
            <span>Tech Innovator</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <FounderImage size="md" />
        <div>
          <h3 className="text-lg font-semibold text-white">Founder & CEO</h3>
          <p className="text-sm text-[#A3A3A3]">
            AI Gaming Visionary • Gaming Enthusiast • Tech Innovator
          </p>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`bg-[#1C1C1C]/60 border border-[#424242] rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <FounderImage size="lg" />
        <div>
          <h3 className="text-xl font-bold text-white">Founder & CEO</h3>
          <p className="text-[#A3A3A3]">AI Gaming Visionary</p>
        </div>
      </div>
      
      <p className="text-[#A3A3A3] mb-4 leading-relaxed">
        A passionate gamer and AI enthusiast who envisioned a future where every player 
        has an intelligent companion to enhance their gaming experience. With years of 
        experience in both gaming and artificial intelligence, our founder has created 
        Otakon to bridge the gap between human creativity and AI assistance.
      </p>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>AI Expert</span>
        </div>
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          <div className="w-2 h-2 bg-[#E53A3A] rounded-full"></div>
          <span>Gamer</span>
        </div>
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          <div className="w-2 h-2 bg-[#D98C1F] rounded-full"></div>
          <span>Innovator</span>
        </div>
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          <div className="w-2 h-2 bg-[#FFAB40] rounded-full"></div>
          <span>Visionary</span>
        </div>
      </div>
    </div>
  );
};

export default FounderProfile;
