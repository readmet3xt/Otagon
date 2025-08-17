
import React from 'react';
import KeyboardIcon from './KeyboardIcon';
import ScreenshotIcon from './ScreenshotIcon';
import { HandsFreeIcon } from './HandsFreeToggle';
import PauseIcon from './PauseIcon';
import PlayIcon from './PlayIcon';

interface HowToUseSplashScreenProps {
    onComplete: () => void;
}

const InsightsIcon = ({ className = 'w-12 h-12' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
);

const ProBadge = () => (
    <span className="text-xs font-bold bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
        PRO
    </span>
);

const FeatureItem: React.FC<{ icon: React.ReactNode; title: React.ReactNode; children: React.ReactNode; }> = ({ icon, title, children }) => {
    return (
        <div className="flex items-start gap-4 p-4 transition-all duration-300">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 mt-1 rounded-lg bg-gradient-to-br from-[#FF4D4D]/10 to-[#FFAB40]/10 border border-neutral-700/50">
                {icon}
            </div>
            <div className="flex-grow">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center">{title}</h3>
                <div className="text-neutral-400 text-base leading-relaxed">{children}</div>
            </div>
        </div>
    );
};

const HowToUseSplashScreen: React.FC<HowToUseSplashScreenProps> = ({ onComplete }) => {
    return (
        <div className="h-screen bg-[#111111] text-[#F5F5F5] flex flex-col font-inter animate-fade-in">
            {/* Fixed Header */}
            <header className="flex-shrink-0 px-6 pt-12 pb-6 text-center z-10 bg-[#111111]">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">You're Connected!</h1>
                <p className="text-lg text-neutral-400">Master Otakon in four easy steps.</p>
            </header>

            {/* Scrollable Main Content */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    {/* Item 1: Capture */}
                    <FeatureItem
                        icon={<KeyboardIcon className="w-7 h-7 text-[#FFAB40]" />}
                        title="1. Instant Capture"
                    >
                        <p className="mb-3">Use hotkeys to instantly analyze your game screen. Toggle the 
                            <span className="inline-flex items-center align-middle mx-1.5 px-1.5 py-0.5 rounded-md bg-black/50 border border-neutral-700">
                                <PauseIcon className="w-4 h-4 text-sky-400" />
                                <span className="text-white mx-0.5">/</span>
                                <PlayIcon className="w-4 h-4 text-neutral-400" />
                            </span>
                             button to switch between auto-sending and manual review.</p>
                        <div className="space-y-2 text-sm p-3 bg-black/30 rounded-md">
                            <p><strong className="text-neutral-200">Single Shot:</strong> <kbd className="px-2 py-1 mx-1 font-sans font-semibold text-neutral-200 bg-neutral-900/50 border border-neutral-700 rounded-md">Ctrl+Shift+Z</kbd></p>
                            <p><strong className="text-neutral-200">Batch Shot<ProBadge />:</strong> <kbd className="px-2 py-1 mx-1 font-sans font-semibold text-neutral-200 bg-neutral-900/50 border border-neutral-700 rounded-md">Ctrl+Shift+X</kbd></p>
                        </div>
                    </FeatureItem>

                    {/* Item 2: Screenshot Quality */}
                    <FeatureItem
                        icon={<ScreenshotIcon className="w-7 h-7 text-[#FFAB40]" />}
                        title="2. The Perfect Screenshot"
                    >
                        <p>For the best hints, capture clear, full-screen views of:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Your inventory, skill tree, or map screen.</li>
                            <li>The entire boss arena, including the boss.</li>
                            <li>The specific puzzle or object you're stuck on.</li>
                        </ul>
                    </FeatureItem>

                    {/* Item 3: Insights */}
                    <FeatureItem
                        icon={<InsightsIcon className="w-7 h-7 text-[#FFAB40]" />}
                        title={<>3. Manage Insights<ProBadge /></>}
                    >
                        <p className="mb-3">
                            Take direct control of your game wiki with natural language commands.
                        </p>
                        <div className="space-y-3 text-sm p-3 bg-black/30 rounded-md">
                            <p>
                                <strong className="text-neutral-200">Add new tab:</strong><br/>
                                <kbd className="px-2 py-1 mt-1 inline-block font-sans font-semibold text-neutral-200 bg-neutral-900/50 border border-neutral-700 rounded-md w-full text-left">"add tab [title]"</kbd>
                            </p>
                            <p>
                                <strong className="text-neutral-200">Modify existing tab:</strong><br/>
                                <kbd className="px-2 py-1 mt-1 inline-block font-sans font-semibold text-neutral-200 bg-neutral-900/50 border border-neutral-700 rounded-md w-full text-left">"modify tab [id] to [new title]"</kbd>
                            </p>
                            <p>
                                <strong className="text-neutral-200">Delete a tab:</strong><br/>
                                <kbd className="px-2 py-1 mt-1 inline-block font-sans font-semibold text-neutral-200 bg-neutral-900/50 border border-neutral-700 rounded-md w-full text-left">"delete tab [id] confirm"</kbd>
                            </p>
                            <p className="text-xs text-neutral-400 mt-2">
                                💡 <strong>Examples:</strong> "add tab Game Progress", "modify tab tab_123 to Current Objectives"
                            </p>
                        </div>
                    </FeatureItem>

                    {/* Item 4: Hands-Free */}
                    <FeatureItem
                        icon={<HandsFreeIcon isActive={true} className="w-7 h-7 text-[#FFAB40]" />}
                        title={<>4. Go Hands-Free<ProBadge /></>}
                    >
                        <p>Stay immersed in the action. Enable Hands-Free mode to have hints and lore read aloud to you, keeping you focused on your game.</p>
                    </FeatureItem>
                </div>
            </main>

            {/* Fixed Footer */}
            <footer className="flex-shrink-0 px-6 pt-4 pb-12 z-10 bg-[#111111]">
                <div className="w-full max-w-md mx-auto">
                    <button
                        onClick={onComplete}
                        className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Let's Begin
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default React.memo(HowToUseSplashScreen);
