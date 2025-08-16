import React, { useState } from 'react';
import { Usage, UserTier } from '../services/types';
import StarIcon from './StarIcon';
import { TierUpgradeModal } from './TierUpgradeModal';

interface GeneralSettingsTabProps {
  usage: Usage;
  onShowUpgrade: () => void;
  onShowVanguardUpgrade: () => void;
  onResetApp: () => void;
  onLogout: () => void;
  userEmail?: string;
}

const TIER_NAMES: Record<UserTier, string> = {
    free: 'Adventurer (Free)',
    pro: 'Legend (Pro)',
    vanguard_pro: 'Founder (Vanguard Pro)'
};

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ usage, onShowUpgrade, onShowVanguardUpgrade, onResetApp, onLogout, userEmail }) => {
    const [showTierUpgrade, setShowTierUpgrade] = useState(false);
    
    const displayEmail = userEmail || (localStorage.getItem('otakonAuthMethod') !== 'skip' 
      ? `user@${localStorage.getItem('otakonAuthMethod') || 'local'}.com`
      : 'Anonymous User');

    return (
        <div className="space-y-8">
            {/* Account Info */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400">Email</label>
                        <p className="text-base text-neutral-200">{displayEmail}</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-neutral-400">Display Name</label>
                        <input
                            type="text"
                            disabled
                            placeholder="Name editing coming soon"
                            className="w-full mt-1 bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            {/* Plan Info */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Active Plan</h2>
                <div className="bg-[#2E2E2E]/60 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-white">{TIER_NAMES[usage.tier]}</p>
                            <p className="text-sm text-neutral-400">
                                {localStorage.getItem('otakonAuthMethod') === 'skip' 
                                    ? 'Development Mode - You can switch tiers for testing'
                                    : 'Your current subscription plan.'
                                }
                            </p>
                        </div>
                        {usage.tier === 'free' && (
                            <button onClick={() => setShowTierUpgrade(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                                <StarIcon className="w-4 h-4" />
                                {localStorage.getItem('otakonAuthMethod') === 'skip' ? 'Switch to Pro' : 'Upgrade'}
                            </button>
                        )}
                        {usage.tier === 'pro' && (
                             <button onClick={() => setShowTierUpgrade(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                                <StarIcon className="w-4 h-4" />
                                {localStorage.getItem('otakonAuthMethod') === 'skip' ? 'Switch to Vanguard' : 'Upgrade to Vanguard'}
                            </button>
                        )}
                    </div>
                    
                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#424242]">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{usage.textCount}</p>
                            <p className="text-sm text-neutral-400">Text Queries Used</p>
                            <p className="text-xs text-neutral-500">Limit: {usage.textLimit}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{usage.imageCount}</p>
                            <p className="text-sm text-neutral-400">Image Queries Used</p>
                            <p className="text-xs text-neutral-500">Limit: {usage.imageLimit}</p>
                        </div>
                    </div>

                    {/* Development Mode Notice */}
                    {localStorage.getItem('otakonAuthMethod') === 'skip' && (
                        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                <p className="text-sm text-yellow-300 font-medium">Development Mode</p>
                            </div>
                            <p className="text-xs text-yellow-200 mt-1">
                                You're in testing mode. Tier switching is enabled for development purposes.
                            </p>
                        </div>
                    )}
                </div>
            </div>

             {/* Danger Zone */}
            <div>
                <h2 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h2>
                <div className="space-y-4">
                    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">Logout</p>
                            <p className="text-sm text-neutral-400">Sign out of your account and return to login screen.</p>
                        </div>
                        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex-shrink-0">
                            Logout
                        </button>
                    </div>
                    
                    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">Reset Application</p>
                            <p className="text-sm text-neutral-400">This will permanently delete all data and log you out.</p>
                        </div>
                        <button onClick={onResetApp} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex-shrink-0">
                            Reset
                        </button>
                    </div>
                </div>
            </div>
            <TierUpgradeModal
                isOpen={showTierUpgrade}
                onClose={() => setShowTierUpgrade(false)}
                onUpgradeSuccess={() => {
                    setShowTierUpgrade(false);
                    // Refresh the page to show updated tier info
                    window.location.reload();
                }}
            />
        </div>
    );
};

export default GeneralSettingsTab;
