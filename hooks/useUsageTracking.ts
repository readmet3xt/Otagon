import { useCallback } from 'react';
import { Usage } from '../services/types';
import { unifiedUsageService } from '../services/unifiedUsageService';

interface UseUsageTrackingProps {
  usage: Usage;
  setUsage: (usage: Usage) => void;
}

export const useUsageTracking = ({ usage, setUsage }: UseUsageTrackingProps) => {
  
  const refreshUsage = useCallback(async () => {
    try {
      // Add a small delay to ensure any pending backend updates have propagated
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Get the current tier directly without calling getUsage (which calls checkAndResetUsage)
      const currentTier = await unifiedUsageService.getCurrentTier();
      
      // Get the current usage data
      const syncedUsage = await unifiedUsageService.getUsage();
      
      // Ensure the tier is correct and all required properties are present
      const updatedUsage: Usage = {
        textQueries: (syncedUsage as any).textQueries || 0,
        imageQueries: (syncedUsage as any).imageQueries || 0,
        insights: (syncedUsage as any).insights || 0,
        textCount: syncedUsage.textCount || 0,
        imageCount: syncedUsage.imageCount || 0,
        textLimit: syncedUsage.textLimit || 0,
        imageLimit: syncedUsage.imageLimit || 0,
        tier: currentTier
      };
      
      console.log('🔄 Refreshing usage with verified tier:', currentTier);
      setUsage(updatedUsage);
    } catch (error) {
      console.error('Failed to refresh usage:', error);
    }
  }, [setUsage]);

  const loadUsageData = useCallback(async () => {
    try {
      const usageData = await unifiedUsageService.getUsage();
      // Ensure all required properties are present
      const completeUsageData: Usage = {
        textQueries: (usageData as any).textQueries || 0,
        imageQueries: (usageData as any).imageQueries || 0,
        insights: (usageData as any).insights || 0,
        textCount: usageData.textCount || 0,
        imageCount: usageData.imageCount || 0,
        textLimit: usageData.textLimit || 0,
        imageLimit: usageData.imageLimit || 0,
        tier: usageData.tier
      };
      setUsage(completeUsageData);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    }
  }, [setUsage]);

  const handleUpgrade = useCallback(async () => {
    await unifiedUsageService.upgradeToPro();
    await refreshUsage();
  }, [refreshUsage]);

  const handleUpgradeToVanguard = useCallback(async () => {
    await unifiedUsageService.upgradeToVanguard();
    await refreshUsage();
  }, [refreshUsage]);

  const canMakeQuery = useCallback(async (type: 'text' | 'image', count: number = 1): Promise<boolean> => {
    try {
      return await unifiedUsageService.canMakeQuery(type, count);
    } catch (error) {
      console.error('Failed to check query limits:', error);
      return false;
    }
  }, []);

  const recordQuery = useCallback(async (type: 'text' | 'image', count: number = 1) => {
    try {
      // await unifiedUsageService.recordQuery(type, count); // Method not available
      await refreshUsage();
    } catch (error) {
      console.error('Failed to record query:', error);
    }
  }, [refreshUsage]);

  return {
    refreshUsage,
    loadUsageData,
    handleUpgrade,
    handleUpgradeToVanguard,
    canMakeQuery,
    recordQuery,
  };
};
