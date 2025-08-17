

import React from 'react';
import Logo from './Logo';
import PCClientDownload from './PCClientDownload';
import Button from './ui/Button';

interface InitialSplashScreenProps {
  onComplete: () => void;
}

const InitialSplashScreen: React.FC<InitialSplashScreenProps> = ({ onComplete }) => {
  return (
    <div className="h-screen bg-[#111111] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-6 pt-12 pb-16 text-center overflow-hidden animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/20 to-transparent pointer-events-none"></div>
      
      <div>
        <Logo />
      </div>

      <h1 
        className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] mt-6 mb-3"
      >
        Otakon
      </h1>

      <p 
        className="text-xl md:text-2xl text-[#CFCFCF] mb-12"
      >
        Your Spoiler-Free Gaming Companion
      </p>

      <div 
        className="flex flex-col items-center gap-4 w-full max-w-xs"
      >
        <Button
          onClick={onComplete}
          variant="primary"
          size="xl"
          fullWidth
          className="animate-pulse-glow"
        >
          Start the Adventure
        </Button>
        
        <div className="w-full">
          <PCClientDownload 
            variant="button" 
            showVersion={false}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(InitialSplashScreen);