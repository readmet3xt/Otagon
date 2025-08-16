

import React, { useState, useEffect } from 'react';
import ScreenshotIcon from './ScreenshotIcon';
import HintIcon from './HintIcon';
import DesktopIcon from './DesktopIcon';
import BookmarkIcon from './BookmarkIcon';
import { ConnectionStatus } from '../services/types';

const slides = [
  {
    icon: <ScreenshotIcon className="w-20 h-20 text-[#FF4D4D]" />,
    title: "Instant Context from Any Screenshot",
    description: "Upload a screenshot from any game. Otakon instantly identifies the game, your location, and what's happening. Get answers, not spoilers."
  },
  {
    icon: <HintIcon className="w-20 h-20 text-[#FF4D4D]" />,
    title: "Hints that Don't Spoil the Story",
    description: "Stuck on a puzzle or boss? Get contextual, spoiler-free guidance. Discover rich lore about the world without ruining the surprise."
  },
  {
    icon: <BookmarkIcon className="w-20 h-20 text-[#FF4D4D]" />,
    title: "Automatic Progress Tracking",
    description: "Otakon automatically organizes your chats by game and tracks your main story progress. Easily see how far you've come and pick up right where you left off."
  },
  {
    icon: <DesktopIcon className="w-20 h-20 text-[#FF4D4D]" />,
    title: "Connect Your PC for Instant Help",
    description: "Link your desktop and mobile app to get help without leaving your game. Press a hotkey to instantly send a screenshot for analysis."
  }
];

interface SplashScreenProps {
  onComplete: () => void;
  onSkipConnection: () => void;
  onConnect: (code: string) => void;
  onDisconnect: () => void;
  status: ConnectionStatus;
  error: string | null;
  connectionCode: string | null;
  onConnectionSuccess: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
    onComplete,
    onSkipConnection,
    onConnect,
    status,
    error,
    connectionCode,
    onConnectionSuccess,
 }) => {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState(connectionCode || '');
  const [syncInitiated, setSyncInitiated] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  useEffect(() => {
    // This effect transitions to the next screen ONLY if the connection
    // was successful AND it was initiated by the user clicking the button.
    if (syncInitiated && status === ConnectionStatus.CONNECTED) {
        onConnectionSuccess();
    }
  }, [status, onConnectionSuccess, syncInitiated]);

  const currentSlide = slides[step];
  const isLastStep = step === slides.length - 1;
  const isConnecting = status === ConnectionStatus.CONNECTING;
  const isConnected = status === ConnectionStatus.CONNECTED;

  const handleNext = () => {
    if (!isLastStep) {
      setStep(s => s + 1);
    }
  };
  
  const handlePrev = () => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  };

  const handleConnectClick = () => {
    if (isConnecting || isConnected) return;
    setSyncInitiated(true);
    onConnect(code);
  };
  
  const handleSkip = () => {
    onComplete();
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); // Clear end on new touch
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    // Reset after swipe action
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const isCodeValid = /^\d{4}$/.test(code);

  return (
    <div 
        className="h-screen bg-[#111111] text-[#F5F5F5] flex flex-col font-inter animate-fade-in"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <div className="flex-shrink-0 px-6 pt-8 flex justify-end">
        <button onClick={handleSkip} className="text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors text-sm font-medium">Skip Intro</button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-6">
        <div className="text-center max-w-md w-full my-auto">
          <div className="mb-8 flex justify-center items-center h-20">
            {currentSlide.icon}
          </div>
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-4">{currentSlide.title}</h1>
          <p className="text-[#CFCFCF] text-lg mb-8">{currentSlide.description}</p>
          
          {isLastStep && (
              <div className="space-y-4 text-left">
                  <div className="text-center pb-2">
                      <a
                          href="https://drive.google.com/file/d/15d_Rp1lSBp6BjA9mr0dlNWwMMmtdAggh/view?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[#FF4D4D] hover:text-[#FF4D4D] hover:underline transition-colors"
                      >
                          Need the PC client? Download it here.
                      </a>
                  </div>
                  <div>
                      <label htmlFor="connection-code" className="block text-sm font-medium text-[#CFCFCF] mb-1">
                      4-Digit Connection Code
                      </label>
                      <input
                      id="connection-code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="1234"
                      maxLength={4}
                      pattern="\d{4}"
                      title="Enter exactly 4 digits"
                      disabled={isConnecting || isConnected}
                      required
                      className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] disabled:opacity-50"
                      />
                  </div>
                  <div className="h-5 text-center text-sm">
                      {error && <p className="text-[#E53A3A]">{error}</p>}
                      {isConnected && <p className="text-[#5CBB7B]">You're all set! Your PC is now connected.</p>}
                      {isConnecting && <p className="text-[#A3A3A3]">Attempting to connect...</p>}
                  </div>
              </div>
          )}
        </div>
      </main>
      
      <footer className="flex-shrink-0 px-6 pt-4 pb-12">
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-center items-center mb-6 gap-2">
                {slides.map((_, index) => (
                    <div key={index} className={`w-2.5 h-2.5 rounded-full transition-all ${step === index ? 'bg-[#FF4D4D] scale-125' : 'bg-[#424242]'}`}></div>
                ))}
            </div>
            
            {isLastStep ? (
                <div className="space-y-3">
                    {!isConnected && (
                        <button
                            onClick={handleConnectClick}
                            disabled={isConnecting || !isCodeValid}
                            className={`w-full flex items-center justify-center text-[#F5F5F5] font-bold py-3 px-4 rounded-full transition-all duration-200
                                ${
                                    isCodeValid && !isConnecting
                                    ? 'bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] hover:brightness-110' // Green and ready state
                                    : 'bg-[#424242] hover:bg-[#5A5A5A] disabled:bg-[#2E2E2E] disabled:text-[#6E6E6E] disabled:cursor-not-allowed' // Default gray/disabled state
                                }
                            `}
                        >
                        {isConnecting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F5F5F5] mr-3"></div>
                                Connecting...
                            </>
                        ) : (
                            'Sync Now'
                        )}
                        </button>
                    )}
                    <button
                        onClick={isConnected ? onComplete : onSkipConnection}
                        className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-[#F5F5F5] font-bold py-3 px-4 rounded-full transition-all duration-300 transform hover:scale-105"
                    >
                    {isConnected ? "Continue to App" : "Skip for Now"}
                    </button>
            </div>
            ) : (
                <button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-[#F5F5F5] font-bold py-3 px-4 rounded-full transition-all duration-300 transform hover:scale-105"
                >
                Next
                </button>
            )}
        </div>
      </footer>
    </div>
  );
};

export default React.memo(SplashScreen);