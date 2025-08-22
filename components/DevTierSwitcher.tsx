import React from 'react';
import { UserTier } from '../services/types';
import { unifiedUsageService } from '../services/unifiedUsageService';

interface DevTierSwitcherProps {
  currentTier: UserTier;
  onSwitch: () => void;
}

const TIER_NAMES: Record<UserTier, string> = {
    free: 'Free',
    pro: 'Pro',
    vanguard_pro: 'Vanguard'
};

const DevTierSwitcher: React.FC<DevTierSwitcherProps> = ({ currentTier, onSwitch }) => {
  const tiers: UserTier[] = ['free', 'pro', 'vanguard_pro'];

  const handleCycleTier = () => {
    const currentIndex = tiers.indexOf(currentTier);
    const nextIndex = (currentIndex + 1) % tiers.length;
    const nextTier = tiers[nextIndex];

    if (nextTier === 'free') {
              unifiedUsageService.switchToFree();
    } else if (nextTier === 'pro') {
              unifiedUsageService.switchToPro();
    } else if (nextTier === 'vanguard_pro') {
              unifiedUsageService.switchToVanguard();
    }
    onSwitch();
  };

  return (
    <button
      type="button"
      onClick={handleCycleTier}
      className="flex items-center justify-center gap-2 px-3 h-12 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-[#2E2E2E] to-[#1C1C1C] border-2 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242] hover:to-[#2E2E2E] hover:border-[#5A5A5A] hover:scale-105"
      title={`Dev Tier: ${TIER_NAMES[currentTier]}. Click to cycle.`}
    >
      <span className="hidden sm:inline">Tier:</span>
      <span className="font-bold">{TIER_NAMES[currentTier]}</span>
    </button>
  );
};

export default DevTierSwitcher;
