

import React from 'react';
import Logo from './Logo';

interface InitialSplashScreenProps {
  onComplete: () => void;
}

const InitialSplashScreen: React.FC<InitialSplashScreenProps> = ({ onComplete }) => {
  const handleDownloadPCClient = () => {
    // Hardcoded download URL for the specific file
    const downloadUrl = 'https://github.com/readmet3xt/otakon-pc-client/releases/download/v1.0.0/Otakon.Connector.Setup.1.0.0.exe';
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-8 pt-16 pb-20 text-center overflow-hidden animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/30 to-transparent pointer-events-none"></div>
      
      <div className="animate-fade-slide-up">
        <Logo />
      </div>

      <h1 
        className="text-7xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] mt-8 mb-6 animate-fade-slide-up leading-tight"
      >
        Otakon
      </h1>

      <p 
        className="text-2xl md:text-3xl text-[#CFCFCF] mb-16 leading-relaxed animate-fade-slide-up"
      >
        Your Spoiler-Free Gaming Companion
      </p>

      <div 
        className="flex flex-col items-center justify-center gap-6 w-full max-w-lg animate-fade-slide-up"
      >
        <button
          onClick={onComplete}
          className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25 animate-pulse-glow text-lg"
        >
          Start the Adventure
        </button>
        
        <button
          onClick={handleDownloadPCClient}
          className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-lg"
        >
          Download PC Client
        </button>
      </div>
    </div>
  );
};

export default React.memo(InitialSplashScreen);