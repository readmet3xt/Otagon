import { useCallback, useEffect, useRef } from 'react';
import { unifiedAnalyticsService, FeatureUsageEvent } from '../services/unifiedAnalyticsService';
import { OnboardingStep, TierUpgradeAttempt } from '../services/types';
import { authService } from '../services/supabase';

/**
 * Hook for easy analytics tracking in React components
 */
export const useAnalytics = () => {
  const featureTimers = useRef<Map<string, number>>(new Map());
  const onboardingSteps = useRef<Map<string, OnboardingStep>>(new Map());
  
  // Check if user is authenticated before using analytics
  const isAuthenticated = () => {
    const authState = authService.getCurrentState();
    return !!authState.user || 
           localStorage.getItem('otakon_developer_mode') === 'true' ||
           localStorage.getItem('otakonAuthMethod') === 'skip';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isAuthenticated()) {
        return; // Skip cleanup if not authenticated
      }
      
      // Stop any active feature timers
      featureTimers.current.forEach((_, featureName) => {
        unifiedAnalyticsService().stopFeatureTimer(featureName);
      });
      
      // Track any incomplete onboarding steps as drop-offs
      onboardingSteps.current.forEach((step, key) => {
        unifiedAnalyticsService().trackOnboardingDropOff(
          step.stepName,
          step.stepOrder,
          'component_unmounted',
          { component: 'useAnalytics', reason: 'unmount' }
        );
      });
    };
  }, []);

  // ===== ONBOARDING FUNNEL TRACKING =====

  const startOnboardingStep = useCallback((
    stepName: string,
    stepOrder: number,
    metadata?: Record<string, any>
  ) => {
    if (!isAuthenticated()) {
      console.log('🚫 Skipping analytics - user not authenticated');
      return;
    }
    
    const stepKey = `${stepName}_${stepOrder}`;
    onboardingSteps.current.set(stepKey, {
      stepName,
      stepOrder,
      startTime: Date.now(),
      metadata
    });
    
    unifiedAnalyticsService().startOnboardingStep(stepName, stepOrder, metadata);
  }, []);

  const completeOnboardingStep = useCallback((
    stepName: string,
    stepOrder: number,
    metadata?: Record<string, any>
  ) => {
    if (!isAuthenticated()) {
      console.log('🚫 Skipping analytics - user not authenticated');
      return;
    }
    
    const stepKey = `${stepName}_${stepOrder}`;
    onboardingSteps.current.delete(stepKey);
    
    unifiedAnalyticsService().completeOnboardingStep(stepName, stepOrder, metadata);
  }, []);

  const trackOnboardingDropOff = useCallback((
    stepName: string,
    stepOrder: number,
    reason: string,
    metadata?: Record<string, any>
  ) => {
    if (!isAuthenticated()) {
      console.log('🚫 Skipping analytics - user not authenticated');
      return;
    }
    
    const stepKey = `${stepName}_${stepOrder}`;
    onboardingSteps.current.delete(stepKey);
    
    unifiedAnalyticsService().trackOnboardingDropOff(stepName, stepOrder, reason, metadata);
  }, []);

  // ===== TIER UPGRADE TRACKING =====

  const trackTierUpgradeAttempt = useCallback((
    attempt: TierUpgradeAttempt
  ) => {
    unifiedAnalyticsService().trackTierUpgradeAttempt(attempt);
  }, []);

  // ===== FEATURE USAGE TRACKING =====

  const startFeatureTimer = useCallback((featureName: string) => {
    featureTimers.current.set(featureName, Date.now());
    unifiedAnalyticsService().startFeatureTimer(featureName);
  }, []);

  const stopFeatureTimer = useCallback((
    featureName: string,
    metadata?: Record<string, any>
  ) => {
    featureTimers.current.delete(featureName);
    unifiedAnalyticsService().stopFeatureTimer(featureName, metadata);
  }, []);

  const trackFeatureUsage = useCallback((
    event: FeatureUsageEvent
  ) => {
    unifiedAnalyticsService().trackFeatureUsage(event);
  }, []);

  // ===== QUICK TRACKING HELPERS =====

  const trackButtonClick = useCallback((
    buttonName: string,
    component: string,
    metadata?: Record<string, any>
  ) => {
    trackFeatureUsage({
      id: `button_${buttonName}_${Date.now()}`,
      eventType: 'feature_usage',
      category: 'feature_usage' as const,
      timestamp: Date.now(),
      sessionId: 'session-' + Date.now(),
      featureName: `button_${buttonName}`,
      featureCategory: 'other' as const,
      action: 'click' as const,
      metadata: { component, action: 'click', ...metadata }
    });
  }, [trackFeatureUsage]);

  const trackPageView = useCallback((
    pageName: string,
    metadata?: Record<string, any>
  ) => {
    trackFeatureUsage({
      id: `page_${pageName}_${Date.now()}`,
      eventType: 'feature_usage',
      category: 'feature_usage' as const,
      timestamp: Date.now(),
      sessionId: 'session-' + Date.now(),
      featureName: `page_${pageName}`,
      featureCategory: 'other' as const,
      action: 'view' as const,
      metadata: { action: 'view', ...metadata }
    });
  }, [trackFeatureUsage]);

  const trackFormSubmission = useCallback((
    formName: string,
    success: boolean,
    metadata?: Record<string, any>
  ) => {
    trackFeatureUsage({
      id: `form_${formName}_${Date.now()}`,
      eventType: 'feature_usage',
      category: 'feature_usage' as const,
      timestamp: Date.now(),
      sessionId: 'session-' + Date.now(),
      featureName: `form_${formName}`,
      featureCategory: 'other' as const,
      action: 'complete' as const,
      metadata: { action: 'submit', success, ...metadata }
    });
  }, [trackFeatureUsage]);

  const trackError = useCallback((
    errorType: string,
    errorMessage: string,
    component: string,
    metadata?: Record<string, any>
  ) => {
    trackFeatureUsage({
      id: `error_${errorType}_${Date.now()}`,
      eventType: 'feature_usage',
      category: 'feature_usage' as const,
      timestamp: Date.now(),
      sessionId: 'session-' + Date.now(),
      featureName: `error_${errorType}`,
      featureCategory: 'other' as const,
      action: 'interact' as const,
      metadata: { 
        component, 
        errorMessage, 
        timestamp: Date.now(),
        ...metadata 
      }
    });
  }, [trackFeatureUsage]);

  // ===== ANALYTICS QUERIES =====

  const getOnboardingFunnelStats = useCallback((
    startDate?: Date,
    endDate?: Date
  ) => {
    return unifiedAnalyticsService().getOnboardingFunnelStats(startDate, endDate);
  }, []);

  const getTierConversionStats = useCallback((
    startDate?: Date,
    endDate?: Date
  ) => {
    return unifiedAnalyticsService().getTierConversionStats(startDate, endDate);
  }, []);

  const getFeatureUsageStats = useCallback((
    startDate?: Date,
    endDate?: Date
  ) => {
    return unifiedAnalyticsService().getFeatureUsageStats(undefined, startDate, endDate);
  }, []);

  return {
    // Onboarding tracking
    startOnboardingStep,
    completeOnboardingStep,
    trackOnboardingDropOff,
    
    // Tier upgrade tracking
    trackTierUpgradeAttempt,
    
    // Feature usage tracking
    startFeatureTimer,
    stopFeatureTimer,
    trackFeatureUsage,
    
    // Quick tracking helpers
    trackButtonClick,
    trackPageView,
    trackFormSubmission,
    trackError,
    
    // Analytics queries
    getOnboardingFunnelStats,
    getTierConversionStats,
    getFeatureUsageStats,
  };
};
