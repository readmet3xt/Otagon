

import React, { useState, useEffect } from 'react';
import DownloadIcon from './DownloadIcon';
import CloseIcon from './CloseIcon';
import StarIcon from './StarIcon';

interface PWAInstallBannerProps {
  className?: string;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);
  const [showMobileFeatures, setShowMobileFeatures] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setHasInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setHasInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if we should show mobile features banner
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !hasInstalled) {
      setShowMobileFeatures(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [hasInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setHasInstalled(true);
        setShowBanner(false);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowMobileFeatures(false);
  };

  const handleMobileFeaturesClick = () => {
    setShowMobileFeatures(false);
    // Show install banner if available
    if (deferredPrompt) {
      setShowBanner(true);
    }
  };

  if (hasInstalled) {
    return null;
  }

  return (
    <>
      {/* Main Install Banner */}
      {showBanner && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1C1C1C] to-[#2E2E2E] border-t border-[#424242] p-4 ${className}`}>
          <div className="max-w-md mx-auto flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-lg flex items-center justify-center">
                <DownloadIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">Install Otakon AI</h3>
              <p className="text-neutral-400 text-xs mt-1">
                Get the full mobile experience with voice commands and offline access
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white text-sm font-medium px-4 py-2 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Installing...
                  </div>
                ) : (
                  'Install'
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Features Banner */}
      {showMobileFeatures && !showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1C1C1C] to-[#2E2E2E] border-t border-[#424242] p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#FFAB40] to-[#E53A3A] rounded-lg flex items-center justify-center">
                <StarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">🎮 Mobile Gaming Experience</h3>
                <p className="text-neutral-400 text-xs">Voice commands, offline access, and more!</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#2E2E2E] p-3 rounded-lg">
                <div className="text-[#FFAB40] text-lg mb-1">🎤</div>
                <div className="text-white text-xs font-medium">Voice Commands</div>
                <div className="text-neutral-400 text-xs">Hands-free gaming help</div>
              </div>
              
              <div className="bg-[#2E2E2E] p-3 rounded-lg">
                <div className="text-[#FFAB40] text-lg mb-1">📱</div>
                <div className="text-white text-xs font-medium">Offline Access</div>
                <div className="text-neutral-400 text-xs">Use without internet</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleMobileFeaturesClick}
                className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white text-sm font-medium py-2 rounded-lg transition-transform hover:scale-105"
              >
                Get Mobile App
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-neutral-400 hover:text-white transition-colors text-sm"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;