import React, { useEffect, useRef } from 'react';
import { useAppStateContext } from './AppStateProvider';
// Dynamic imports to avoid circular dependencies
// import { authService } from '../../services/supabase';
// import { pwaNavigationService } from '../../services/pwaNavigationService';
// import { performanceMonitoringService } from '../../services/performanceMonitoringService';
// import { supabaseDataService } from '../../services/supabaseDataService';
// import { profileService } from '../../services/profileService';
// import { suggestedPromptsService } from '../../services/suggestedPromptsService';
// import { DailyEngagementService } from '../../services/dailyEngagementService';
import { STORAGE_KEYS, TIMING } from '../../utils/constants';
import { getTimeGreeting, extractFirstName } from '../../utils/helpers';

interface AppEffectsProps {
  addSystemMessage: (message: string, conversationId: string, isFromPC?: boolean) => void;
  refreshUsage: () => void;
  loadUsageData: () => void;
}

export const AppEffects: React.FC<AppEffectsProps> = ({
  addSystemMessage,
  refreshUsage,
  loadUsageData,
}) => {
  const { state } = useAppStateContext();
  const {
    authState,
    setAuthState,
    onboardingStatus,
    setOnboardingStatus,
    setView,
    setIsFirstTime,
    setShowDailyCheckin,
    setCurrentAchievement,
    setPwaNavigationState,
    setIsOAuthCallback,
  } = state;

  // Track processed batches to prevent duplicates
  const processedBatches = useRef(new Set<string>());
  const processedSingleShots = useRef(new Set<string>());
  const lastStopTime = useRef<number>(0);
  const cooldownMessageShown = useRef<boolean>(false);
  const globalStopFlag = useRef<boolean>(false);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      const { performanceMonitoringService } = await import('../../services/performanceMonitoringService');
      console.log('🚀 Performance monitoring initialized');
      performanceMonitoringService.initialize();
    };
    initializeServices();
  }, []);

  // Auth state subscription
  useEffect(() => {
    const setupAuthSubscription = async () => {
      const { authService } = await import('../../services/supabase');
      const unsubscribe = authService.subscribe((authState) => {
      console.log('Auth state change detected:', { 
        hasUser: !!authState.user, 
        loading: authState.loading, 
        onboardingStatus,
        authMethod: localStorage.getItem(STORAGE_KEYS.AUTH_METHOD)
      });

      setAuthState(authState);

      // Handle authentication state changes
      if (authState.user) {
        handleAuthenticatedUser();
      } else {
        handleUnauthenticatedUser();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onboardingStatus, setAuthState]);

  // PWA Navigation state subscription
  // PWA Navigation subscription
  useEffect(() => {
    const setupPwaNavigationSubscription = async () => {
      const { pwaNavigationService } = await import('../../services/pwaNavigationService');
      const unsubscribe = pwaNavigationService.subscribe((newState) => {
        setPwaNavigationState(newState);
      });
      return unsubscribe;
    };
    setupPwaNavigationSubscription();
  }, [setPwaNavigationState]);

  // OAuth callback handling
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const url = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      console.log('Checking for OAuth callback...', {
        url,
        search: window.location.search,
        hash: window.location.hash,
        urlParams: Object.fromEntries(urlParams.entries()),
        hashParams: Object.fromEntries(hashParams.entries()),
      });

      if (hashParams.has('access_token') || urlParams.has('access_token')) {
        console.log('OAuth callback detected, parameters:', Object.fromEntries(hashParams.entries()));
        
        // Clear OAuth parameters from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setIsOAuthCallback(true);
        
        // Handle OAuth callback
        try {
          const { authService } = await import('../../services/supabase');
          await authService.handleOAuthCallback();
          console.log('OAuth callback handled successfully');
        } catch (error) {
          console.error('OAuth callback handling failed:', error);
        }
      } else {
        console.log('No OAuth callback parameters found');
      }
    };

    handleOAuthCallback();
  }, [setIsOAuthCallback]);

  // Daily engagement effect
  useEffect(() => {
    if (state.view === 'app' && onboardingStatus === 'complete') {
      console.log('Daily Engagement Effect - view:', state.view, 'onboardingStatus:', onboardingStatus, 'usage.tier:', state.usage.tier);
      
      const checkDailyEngagement = async () => {
        console.log('Checking daily engagement conditions...');
        
        const { DailyEngagementService } = await import('../../services/dailyEngagementService');
        const shouldShow = await DailyEngagementService.getInstance().shouldShowDailyCheckin();
        console.log('Should show daily checkin:', shouldShow);
        
        if (shouldShow) {
          console.log('Setting showDailyCheckin to true');
          setShowDailyCheckin(true);
        }
      };

      checkDailyEngagement();
    }
  }, [state.view, onboardingStatus, state.usage.tier, setShowDailyCheckin]);

  // Note: Welcome message logic is handled in App.tsx to prevent duplication

  // Load usage data on mount - only when authenticated or in developer mode
  useEffect(() => {
    // Only load usage data if user is authenticated or in developer mode
    const isDeveloperMode = localStorage.getItem('otakon_developer_mode') === 'true';
    const authMethod = localStorage.getItem('otakonAuthMethod');
    const isDeveloperAuth = authMethod === 'skip';
    const isAuthenticated = !!authState.user;
    
    if (isAuthenticated || isDeveloperMode || isDeveloperAuth) {
      loadUsageData();
    }
  }, [loadUsageData, authState.user]);

      // Reset suggested prompts on app initialization
    useEffect(() => {
      console.log('🔄 Suggested prompts reset on app initialization');
      // const { suggestedPromptsService } = await import('../../services/suggestedPromptsService');
      // suggestedPromptsService.reset(); // Commented out as reset method doesn't exist
    }, []);

  const handleAuthenticatedUser = async () => {
    console.log('Authentication successful, transitioning to initial splash screen...');
    localStorage.removeItem(STORAGE_KEYS.AUTH_METHOD); // Clear the auth method to prevent re-triggering

    const hasCompletedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    const hasCompletedProfileSetup = localStorage.getItem(STORAGE_KEYS.PROFILE_SETUP_COMPLETED);

    console.log('Onboarding check:', { hasCompletedOnboarding, hasCompletedProfileSetup });

    // Check if we should show splash screens after logout
    const shouldShowSplashAfterLogin = localStorage.getItem(STORAGE_KEYS.SHOW_SPLASH_AFTER_LOGIN);

    if (shouldShowSplashAfterLogin === 'true') {
      // Clear the flag and show initial splash screens
      localStorage.removeItem(STORAGE_KEYS.SHOW_SPLASH_AFTER_LOGIN);
      console.log('Fresh login after logout detected, showing initial splash screens');
      setOnboardingStatus('initial');
      setView('app');
    } else if (hasCompletedOnboarding && hasCompletedProfileSetup) {
      // Returning user - skip to complete status
      console.log('Returning user, skipping to complete status');
      setOnboardingStatus('complete');
      setView('app');
    } else {
      // New user - go to initial splash screen
      console.log('New user, going to initial splash screen');
      setOnboardingStatus('initial');
      setView('app');
    }
  };

  const handleUnauthenticatedUser = () => {
    console.log('No recent auth method found, staying on login screen');
    setOnboardingStatus('login');
  };

  return null; // This component only handles effects
};
