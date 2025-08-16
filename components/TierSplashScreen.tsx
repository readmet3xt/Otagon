import React from 'react';
import Logo from './Logo';
import StarIcon from './StarIcon';
import { UserTier } from '../services/types';

interface TierSplashScreenProps {
  userTier: UserTier;
  onContinue: () => void;
  onUpgradeToPro?: () => void;
  onUpgradeToVanguard?: () => void;
}

const TierSplashScreen: React.FC<TierSplashScreenProps> = ({ 
  userTier, 
  onContinue, 
  onUpgradeToPro, 
  onUpgradeToVanguard 
}) => {
  const isFreeTier = userTier === 'free';
  const isProTier = userTier === 'pro';

  return (
    <div className="h-screen bg-[#111111] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-6 text-center overflow-hidden animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/20 to-transparent pointer-events-none"></div>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md">
        <div className="flex-shrink-0 mb-8">
          <Logo />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {isFreeTier ? 'Supercharge with Otakon' : 'Unlock Your Full Potential'}
        </h1>

        <p className="text-lg text-[#A3A3A3] mb-8">
          {isFreeTier 
            ? 'Ready to take your gaming experience to the next level?'
            : 'You\'re already a Pro! Ready to become a Vanguard?'
          }
        </p>

        {/* Tier Options */}
        <div className="w-full space-y-4 mb-8">
          {/* Pro Plan */}
          <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
            isFreeTier 
              ? 'bg-[#1C1C1C]/40 border-neutral-700 hover:border-[#E53A3A]/50 cursor-pointer' 
              : 'bg-[#1C1C1C]/20 border-neutral-600 opacity-50 cursor-not-allowed'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Pro</h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">$3.99</div>
                <div className="text-sm text-neutral-400">/month</div>
              </div>
            </div>
            
            <ul className="text-left space-y-2 mb-4 text-sm text-neutral-300">
              <li>• 1,583 Text Queries/month</li>
              <li>• 328 Image Queries/month</li>
              <li>• Advanced AI Model</li>
              <li>• Batch Screenshot Capture</li>
              <li>• Hands-Free Voice Response</li>
            </ul>

            {isFreeTier ? (
              <button
                onClick={onUpgradeToPro}
                className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105"
              >
                <StarIcon className="w-5 h-5 inline mr-2" />
                Upgrade to Pro
              </button>
            ) : (
              <div className="w-full bg-neutral-600 text-neutral-400 font-bold py-3 px-6 rounded-lg cursor-not-allowed text-center">
                Current Plan
              </div>
            )}
          </div>

          {/* Vanguard Plan */}
          <div className="relative p-6 rounded-2xl border-2 border-[#FFAB40] bg-[#111] shadow-2xl shadow-[#D98C1F]/20">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="text-sm font-bold bg-[#FFAB40] text-black px-3 py-1 rounded-full uppercase tracking-wider">
                {isProTier ? 'Recommended' : 'Most Popular'}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
                Vanguard
              </h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">$9.99</div>
                <div className="text-sm text-neutral-400">/month</div>
              </div>
            </div>
            
            <ul className="text-left space-y-2 mb-4 text-sm text-neutral-300">
              <li>• All Pro features, plus:</li>
              <li>• Permanent Price Lock-in</li>
              <li>• Exclusive "Vanguard" Badge</li>
              <li>• Founder's Council Access</li>
              <li>• Beta Access to New Features</li>
              <li>• Earn by Playing (Coming Soon)</li>
            </ul>

            <button
              onClick={onUpgradeToVanguard}
              className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105"
            >
              <StarIcon className="w-5 h-5 inline mr-2" />
              {isProTier ? 'Upgrade to Vanguard' : 'Become a Vanguard'}
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Continue with Current Plan
        </button>

        <p className="text-sm text-neutral-500 mt-4">
          You can upgrade anytime from the settings menu
        </p>
      </main>
    </div>
  );
};

export default TierSplashScreen;
