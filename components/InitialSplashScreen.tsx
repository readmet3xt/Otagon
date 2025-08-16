

import React from 'react';
import Logo from './Logo';

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
                <button
                    onClick={onComplete}
                    className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-[#F5F5F5] font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 text-lg animate-pulse-glow"
                >
                    Start the Adventure
                </button>
                
                <a
                    href="https://drive.google.com/file/d/15d_Rp1lSBp6BjA9mr0dlNWwMMmtdAggh/view?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#2E2E2E]/50 border border-[#424242]/50 hover:bg-[#424242] text-[#CFCFCF] hover:text-[#F5F5F5] font-semibold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>Download PC Client</span>
                </a>
            </div>
        </div>
    );
};

export default React.memo(InitialSplashScreen);