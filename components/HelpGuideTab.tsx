import React from 'react';
import KeyboardIcon from './KeyboardIcon';
import ScreenshotIcon from './ScreenshotIcon';
import { HandsFreeIcon } from './HandsFreeToggle';
import PauseIcon from './PauseIcon';
import PlayIcon from './PlayIcon';

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 pb-2 border-b-2 border-neutral-700">{title}</h2>
        <div className="space-y-4 text-neutral-300 leading-relaxed prose prose-invert max-w-none prose-p:text-neutral-300 prose-li:text-neutral-300 prose-strong:text-white prose-code:text-amber-300 prose-code:bg-black/50 prose-code:p-1 prose-code:rounded-md">
            {children}
        </div>
    </div>
);

const ProBadge = () => (
    <span className="text-xs font-bold bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
        PRO
    </span>
);

const HelpGuideTab: React.FC = () => {
    return (
        <div>
            <HelpSection title="How Features Work">
                <h3 className="text-xl font-semibold text-white !mb-2">Instant Capture</h3>
                <p>Use hotkeys on the PC client to analyze your game. The toggle button in the chat input switches between modes:</p>
                <ul className="list-disc list-inside mt-2">
                    <li><strong className="text-white">Auto-Send Mode (<PlayIcon className="w-4 h-4 inline-block text-neutral-400" />):</strong> Screenshots are sent for analysis instantly. Perfect for quick hints.</li>
                    <li><strong className="text-white">Manual Review Mode (<PauseIcon className="w-4 h-4 inline-block text-sky-400" />):</strong> Screenshots are added to the chat input for you to review, add text to, and send manually.</li>
                </ul>

                <h3 className="text-xl font-semibold text-white !mt-6 !mb-2">Insight Tabs <ProBadge /></h3>
                <p>Pro users get a personalized wiki that grows as they play. You can manage these tabs directly from chat:</p>
                <ul className="list-disc list-inside mt-2 space-y-2">
                    <li>To update a tab's content, type: <code>@Tab Name [your new request]</code></li>
                    <li>To rewrite or rename a tab, type: <code>@Tab Name \modify [new content or title]</code></li>
                    <li>To delete a tab, type: <code>@Tab Name \delete</code></li>
                </ul>

                <h3 className="text-xl font-semibold text-white !mt-6 !mb-2">Hands-Free Mode <ProBadge /></h3>
                <p>Enable Hands-Free mode from the header to have hints and lore read aloud to you. This keeps you focused on your game, especially useful for console gaming or intense moments.</p>
            </HelpSection>

            <HelpSection title="Hotkeys">
                 <div className="space-y-3">
                    <p><strong className="text-white">Single Shot:</strong> Use <kbd className="px-2 py-1 mx-1 font-sans font-semibold text-neutral-200 bg-neutral-900/50 border border-neutral-700 rounded-md">Ctrl+Shift+Z</kbd> to capture your primary monitor.</p>
                    <p><strong className="text-white">Batch Shot<ProBadge />:</strong> Use <kbd className="px-2 py-1 mx-1 font-sans font-semibold text-neutral-200 bg-neutral-900/50 border border-neutral-700 rounded-md">Ctrl+Shift+X</kbd> to analyze multiple key moments from the last few minutes of gameplay.</p>
                </div>
            </HelpSection>

            <HelpSection title="Best Practices for Screenshots">
                <p>To get the most accurate hints, provide clear screenshots. Good examples include:</p>
                <ul className="list-disc list-inside mt-2">
                    <li>Your full inventory, skill tree, or character stats screen.</li>
                    <li>The entire map screen, showing your current location.</li>
                    <li>A wide view of a boss arena, including the boss and any UI elements.</li>
                    <li>The specific puzzle you're stuck on, with all its components visible.</li>
                </ul>
                <p>Avoid screenshots that are blurry, too dark, or have other windows covering the game.</p>
            </HelpSection>
            
            <HelpSection title="Frequently Asked Questions (FAQs)">
                <h3 className="text-lg font-semibold text-white !mb-1">How does Otakon avoid spoilers?</h3>
                <p>Our AI is given strict instructions to only use information relevant to your current in-game progress, which it estimates from your screenshot and conversation history. It's designed to give you a nudge, not the entire solution.</p>
                
                <h3 className="text-lg font-semibold text-white !mt-4 !mb-1">What happens when I run out of credits?</h3>
                <p>Your query credits reset on the first day of each month. If you need more, you can upgrade to a Pro plan for significantly higher limits.</p>

                <h3 className="text-lg font-semibold text-white !mt-4 !mb-1">Why isn't a game being identified correctly?</h3>
                <p>While our AI is very accurate, sometimes obscure or newly released games can be tricky. Ensure your screenshot is clear and shows a unique part of the game's UI or world. The more information the AI has, the better it performs.</p>
            </HelpSection>
        </div>
    );
};

export default HelpGuideTab;
