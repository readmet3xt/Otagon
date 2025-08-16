import React, { useState, useEffect } from 'react';
import { tierService, TierInfo } from '../services/tierService';
import { authService } from '../services/supabase';
import StarIcon from './StarIcon';
import CheckIcon from './CheckIcon';

interface TierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
}) => {
  const [tiers, setTiers] = useState<Record<string, TierInfo>>({});
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTierInfo();
    }
  }, [isOpen]);

  const loadTierInfo = async () => {
    try {
      const allTiers = tierService.getAllTiers();
      setTiers(allTiers);

      // Get current user's tier
      const authState = authService.getAuthState();
      if (authState.user) {
        const userTier = await tierService.getUserTier(authState.user.id);
        if (userTier) {
          setCurrentTier(userTier.tier);
        }
      }
    } catch (error) {
      console.error('Error loading tier info:', error);
    }
  };

  const handleUpgrade = async (targetTier: string) => {
    if (targetTier === currentTier) return;

    setIsLoading(true);
    setUpgradeMessage('');

    try {
      const authState = authService.getAuthState();
      if (!authState.user) {
        setUpgradeMessage('Please log in to upgrade your tier.');
        return;
      }

      let success = false;
      if (targetTier === 'pro') {
        success = await tierService.upgradeToPro(authState.user.id);
      } else if (targetTier === 'vanguard_pro') {
        success = await tierService.upgradeToVanguardPro(authState.user.id);
      }

      if (success) {
        setCurrentTier(targetTier);
        setUpgradeMessage(`Successfully upgraded to ${targetTier.replace('_', ' ')}!`);
        onUpgradeSuccess?.();
        
        // Reload tier info
        setTimeout(() => {
          loadTierInfo();
        }, 1000);
      } else {
        setUpgradeMessage('Failed to upgrade. Please try again.');
      }
    } catch (error) {
      console.error('Error upgrading tier:', error);
      setUpgradeMessage('An error occurred during upgrade.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const tierOrder = ['free', 'pro', 'vanguard_pro'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {upgradeMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              upgradeMessage.includes('Successfully') 
                ? 'bg-green-900/20 text-green-400 border border-green-700' 
                : 'bg-red-900/20 text-red-400 border border-red-700'
            }`}>
              {upgradeMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tierOrder.map((tierKey) => {
              const tier = tiers[tierKey];
              if (!tier) return null;

              const isCurrentTier = tierKey === currentTier;
              const canUpgrade = tierService.canUpgradeTo(currentTier as any, tierKey as any);

              return (
                <div
                  key={tierKey}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    isCurrentTier
                      ? 'border-[#FFAB40] bg-[#2A2A2A]'
                      : canUpgrade
                      ? 'border-[#424242] bg-[#2A2A2A] hover:border-[#FFAB40] hover:bg-[#323232]'
                      : 'border-[#424242] bg-[#2A2A2A] opacity-60'
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#FFAB40] text-black px-3 py-1 rounded-full text-sm font-semibold">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {tierKey === 'free' ? 'Free' : tierKey === 'pro' ? 'Pro' : 'Vanguard Pro'}
                    </h3>
                    {tier.price && (
                      <div className="text-3xl font-bold text-[#FFAB40]">
                        ${tier.price}
                        <span className="text-lg text-neutral-400">/month</span>
                      </div>
                    )}
                    {!tier.price && (
                      <div className="text-2xl font-bold text-green-400">
                        Free Forever
                      </div>
                    )}
                  </div>

                                      <div className="space-y-3 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                                {tier.textLimit.toLocaleString()}
                            </div>
                            <div className="text-sm text-neutral-400">Text Queries</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                                {tier.imageLimit.toLocaleString()}
                            </div>
                            <div className="text-sm text-neutral-400">Image Queries</div>
                        </div>
                    </div>

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-neutral-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {canUpgrade && !isCurrentTier && (
                    <button
                      onClick={() => handleUpgrade(tierKey)}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Upgrading...
                        </div>
                      ) : (
                        `Upgrade to ${tierKey === 'pro' ? 'Pro' : 'Vanguard Pro'}`
                      )}
                    </button>
                  )}

                  {isCurrentTier && (
                    <div className="text-center text-[#FFAB40] font-semibold py-3">
                      Current Plan
                    </div>
                  )}

                  {!canUpgrade && !isCurrentTier && (
                    <div className="text-center text-neutral-500 py-3">
                      Already on higher tier
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              * Payment integration coming soon. Upgrades are currently free for testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
