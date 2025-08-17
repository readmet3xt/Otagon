import React from 'react';
import StarIcon from './StarIcon';
import Button from './ui/Button';
import { useAnalytics } from '../hooks/useAnalytics';

interface UpgradeSplashScreenProps {
    onUpgrade: () => void;
    onUpgradeToVanguard: () => void;
    onClose: () => void;
}

const CheckFeatureLine: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-3">
        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span className="text-neutral-300">{children}</span>
    </li>
);

const StarFeatureLine: React.FC<{ children: React.ReactNode; comingSoon?: boolean }> = ({ children, comingSoon }) => (
    <li className="flex items-start gap-3">
        <StarIcon className="w-5 h-5 mt-1 text-[#FFAB40] flex-shrink-0" />
        <span className="text-neutral-200 font-medium">
            {children}
            {comingSoon && (
                 <span className="ml-2 text-xs font-semibold align-middle bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full uppercase">Coming Soon</span>
            )}
        </span>
    </li>
);

const proFeatures = [
    '1,583 Text Queries/month',
    '328 Image Queries/month',
    'Advanced AI Model',
    'Batch Screenshot Capture',
    'Hands-Free Voice Response',
    'In-depth Insight Tabs',
    'Priority Support',
    'No ads'
];

const vanguardFeatures = [
    { text: 'Permanent Price Lock-in' },
    { text: 'Exclusive "Vanguard" Badge' },
    { text: "Access to Founder's Council" },
    { text: 'Beta Access to New Features' },
    { text: 'Earn by playing new games', comingSoon: true },
];

const UpgradeSplashScreen: React.FC<UpgradeSplashScreenProps> = ({ onUpgrade, onUpgradeToVanguard, onClose }) => {
    const { trackTierUpgradeAttempt, trackButtonClick } = useAnalytics();

    const handleProUpgrade = () => {
        trackTierUpgradeAttempt({
            fromTier: 'free',
            toTier: 'pro',
            attemptSource: 'splash_screen',
            success: false, // Will be updated when payment succeeds
            amount: 3.99,
            metadata: { source: 'UpgradeSplashScreen' }
        });
        trackButtonClick('go_pro', 'UpgradeSplashScreen');
        onUpgrade();
    };

    const handleVanguardUpgrade = () => {
        trackTierUpgradeAttempt({
            fromTier: 'free',
            toTier: 'vanguard_pro',
            attemptSource: 'splash_screen',
            success: false, // Will be updated when payment succeeds
            amount: 20.00,
            metadata: { source: 'UpgradeSplashScreen' }
        });
        trackButtonClick('become_vanguard', 'UpgradeSplashScreen');
        onUpgradeToVanguard();
    };

    const handleClose = () => {
        trackButtonClick('maybe_later', 'UpgradeSplashScreen');
        onClose();
    };

    return (
        <div className="h-screen bg-black text-white flex flex-col items-center justify-center font-inter p-4 sm:p-6 animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#FF4D4D]/20 to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-4xl mx-auto bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-6 sm:p-8 text-center animate-scale-in relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-10"
                    aria-label="Close modal"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] mb-2">Upgrade Your Plan</h1>
                <p className="text-neutral-400 mb-8">Unlock your full potential and support the community.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 text-left">
                    {/* Pro Plan */}
                    <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6 flex flex-col">
                        <h3 className="text-2xl font-bold text-white">Pro</h3>
                        <p className="text-neutral-400 mt-1 mb-6">For serious gamers who want the best.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">$3.99</span>
                            <span className="text-base text-neutral-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8 text-sm">
                            {proFeatures.map(feature => <CheckFeatureLine key={feature}>{feature}</CheckFeatureLine>)}
                        </ul>
                        <div className="mt-auto">
                            <Button onClick={handleProUpgrade} variant="secondary" size="lg" fullWidth className="bg-neutral-700 hover:bg-neutral-600">
                                Go Pro
                            </Button>
                        </div>
                    </div>

                    {/* Vanguard Plan */}
                    <div className="relative border-2 border-[#FFAB40] rounded-xl p-6 bg-[#111] shadow-2xl shadow-[#D98C1F]/20 flex flex-col">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FF4D4D] to-[#D98C1F] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Best Value
                        </div>
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">Pro Vanguard</h3>
                        <p className="text-neutral-400 mt-1 mb-6">Become a founding member.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">$20</span>
                            <span className="text-base text-neutral-400">/year</span>
                            <p className="text-sm text-green-400 mt-1">Limited Offer - Price Locked Forever!</p>
                        </div>
                        <ul className="space-y-3 mb-8 text-sm">
                            <CheckFeatureLine><b>All Pro features, plus:</b></CheckFeatureLine>
                            {vanguardFeatures.map(feature => <StarFeatureLine key={feature.text} comingSoon={feature.comingSoon}>{feature.text}</StarFeatureLine>)}
                        </ul>
                        <div className="mt-auto">
                            <Button onClick={handleVanguardUpgrade} variant="primary" size="lg" fullWidth>
                                Become a Vanguard
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Button
                        onClick={handleClose}
                        variant="ghost"
                        size="md"
                    >
                        Maybe Later
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(UpgradeSplashScreen);
