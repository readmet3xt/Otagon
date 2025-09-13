// ========================================
// 🚀 FIXED APP STATE SERVICE
// ========================================
// This fixes all app state management issues with:
// - Simplified state determination
// - Clear state transitions
// - Robust error handling
// - Developer mode support

import { authService, supabase } from './supabase';

export interface UserState {
  isAuthenticated: boolean;
  isDeveloper: boolean;
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
  hasProfileSetup: boolean;
  hasSeenSplashScreens: boolean;
  hasWelcomeMessage: boolean;
  hasConversations: boolean;
  hasInteractedWithChat: boolean;
  tier: string;
  userId: string | null;
}

export interface AppView {
  view: 'landing' | 'app';
  onboardingStatus: 'login' | 'initial' | 'features' | 'complete' | 'error';
  error?: string;
}

export interface AppStateService {
  getUserState(): Promise<UserState>;
  determineView(userState: UserState): AppView;
  determineOnboardingStatus(userState: UserState): string;
  updateOnboardingStatus(status: string): Promise<void>;
  markOnboardingComplete(): Promise<void>;
  markProfileSetupComplete(): Promise<void>;
  markSplashScreensSeen(): Promise<void>;
  markWelcomeMessageShown(): Promise<void>;
  markFirstRunComplete(): Promise<void>;
  resetOnboarding(): Promise<void>;
}

class FixedAppStateService implements AppStateService {
  private static instance: FixedAppStateService;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FixedAppStateService {
    if (!FixedAppStateService.instance) {
      FixedAppStateService.instance = new FixedAppStateService();
    }
    return FixedAppStateService.instance;
  }

  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`📱 [${timestamp}] ${message}`, data || '');
  }

  private error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`📱 [${timestamp}] ERROR: ${message}`, error || '');
  }

  private getCacheKey(key: string): string {
    return `app_state_${key}`;
  }

  private getCached<T>(key: string): T | null {
    const cacheKey = this.getCacheKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    this.cache.delete(cacheKey);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  private isDeveloperMode(): boolean {
    return localStorage.getItem('otakonAuthMethod') === 'developer';
  }

  private async getDeveloperData(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(`otakon_dev_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.error(`Failed to get developer data for ${key}`, error);
      return null;
    }
  }

  private async setDeveloperData(key: string, data: any): Promise<void> {
    try {
      localStorage.setItem(`otakon_dev_${key}`, JSON.stringify(data));
    } catch (error) {
      this.error(`Failed to set developer data for ${key}`, error);
    }
  }

  private async getSupabaseData(key: string): Promise<any> {
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('users')
        .select(key)
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        this.error(`Failed to get Supabase data for ${key}`, error);
        return null;
      }

      return data?.[key] || null;
    } catch (error) {
      this.error(`Failed to get Supabase data for ${key}`, error);
      return null;
    }
  }

  private async setSupabaseData(key: string, data: any): Promise<void> {
    try {
      const userId = authService.getCurrentUserId();
      if (!userId) return;

      const { error } = await supabase
        .from('users')
        .update({ [key]: data, updated_at: new Date().toISOString() })
        .eq('auth_user_id', userId);

      if (error) {
        this.error(`Failed to set Supabase data for ${key}`, error);
        throw error;
      }
    } catch (error) {
      this.error(`Failed to set Supabase data for ${key}`, error);
      throw error;
    }
  }

  async getUserState(): Promise<UserState> {
    try {
      this.log('Getting user state...');
      
      const authState = authService.getCurrentState();
      const isAuthenticated = !!authState.user && !authState.loading;
      const isDeveloper = this.isDeveloperMode();
      const userId = authState.user?.id || null;

      if (!isAuthenticated && !isDeveloper) {
        this.log('User not authenticated and not in developer mode');
        return {
          isAuthenticated: false,
          isDeveloper: false,
          isNewUser: false,
          hasCompletedOnboarding: false,
          hasProfileSetup: false,
          hasSeenSplashScreens: false,
          hasWelcomeMessage: false,
          hasConversations: false,
          hasInteractedWithChat: false,
          tier: 'free',
          userId: null
        };
      }

      // Get user data based on mode
      let userData: any = {};
      let tier = 'free';

      if (isDeveloper) {
        this.log('Getting developer mode data...');
        userData = {
          profile_data: await this.getDeveloperData('profile_data'),
          preferences: await this.getDeveloperData('preferences'),
          usage_data: await this.getDeveloperData('usage_data'),
          app_state: await this.getDeveloperData('app_state'),
          behavior_data: await this.getDeveloperData('behavior_data'),
          feedback_data: await this.getDeveloperData('feedback_data'),
          onboarding_data: await this.getDeveloperData('onboarding_data')
        };
        tier = 'vanguard_pro'; // Developer mode gets highest tier
      } else {
        this.log('Getting Supabase user data...');
        const cached = this.getCached<UserState>('user_state');
        if (cached) {
          this.log('Using cached user state');
          return cached;
        }

        userData = {
          profile_data: await this.getSupabaseData('profile_data'),
          preferences: await this.getSupabaseData('preferences'),
          usage_data: await this.getSupabaseData('usage_data'),
          app_state: await this.getSupabaseData('app_state'),
          behavior_data: await this.getSupabaseData('behavior_data'),
          feedback_data: await this.getSupabaseData('feedback_data'),
          onboarding_data: await this.getSupabaseData('onboarding_data')
        };

        // Get tier from user data
        const userRecord = await this.getSupabaseData('tier');
        tier = userRecord || 'free';
      }

      // Determine user state
      const appState = userData.app_state || {};
      const onboardingData = userData.onboarding_data || {};
      const behaviorData = userData.behavior_data || {};

      const userState: UserState = {
        isAuthenticated,
        isDeveloper,
        isNewUser: !appState.firstRunCompleted,
        hasCompletedOnboarding: appState.onboardingComplete || false,
        hasProfileSetup: appState.profileSetupCompleted || false,
        hasSeenSplashScreens: appState.hasSeenSplashScreens || false,
        hasWelcomeMessage: appState.welcomeMessageShown || false,
        hasConversations: appState.hasConversations || false,
        hasInteractedWithChat: appState.hasInteractedWithChat || false,
        tier,
        userId
      };

      // Cache the result
      this.setCache('user_state', userState);

      this.log('User state determined', userState);
      return userState;

    } catch (error) {
      this.error('Failed to get user state', error);
      return {
        isAuthenticated: false,
        isDeveloper: false,
        isNewUser: false,
        hasCompletedOnboarding: false,
        hasProfileSetup: false,
        hasSeenSplashScreens: false,
        hasWelcomeMessage: false,
        hasConversations: false,
        hasInteractedWithChat: false,
        tier: 'free',
        userId: null
      };
    }
  }

  determineView(userState: UserState): AppView {
    try {
      this.log('Determining app view...', userState);

      // If not authenticated and not in developer mode, show landing
      if (!userState.isAuthenticated && !userState.isDeveloper) {
        this.log('User not authenticated, showing landing page');
        return {
          view: 'landing',
          onboardingStatus: 'login'
        };
      }

      // If authenticated or in developer mode, show app
      this.log('User authenticated or in developer mode, showing app');
      return {
        view: 'app',
        onboardingStatus: this.determineOnboardingStatus(userState) as 'login' | 'initial' | 'features' | 'complete' | 'error'
      };

    } catch (error) {
      this.error('Failed to determine view', error);
      return {
        view: 'landing',
        onboardingStatus: 'error',
        error: 'Failed to determine app view'
      };
    }
  }

  determineOnboardingStatus(userState: UserState): string {
    try {
      this.log('Determining onboarding status...', userState);

      // If new user, start with initial
      if (userState.isNewUser) {
        this.log('New user detected, starting with initial onboarding');
        return 'initial';
      }

      // If onboarding not complete, show features
      if (!userState.hasCompletedOnboarding) {
        this.log('Onboarding not complete, showing features');
        return 'features';
      }

      // If profile not setup, show features
      if (!userState.hasProfileSetup) {
        this.log('Profile not setup, showing features');
        return 'features';
      }

      // If splash screens not seen, show features
      if (!userState.hasSeenSplashScreens) {
        this.log('Splash screens not seen, showing features');
        return 'features';
      }

      // All onboarding complete
      this.log('Onboarding complete, showing main app');
      return 'complete';

    } catch (error) {
      this.error('Failed to determine onboarding status', error);
      return 'error';
    }
  }

  async updateOnboardingStatus(status: string): Promise<void> {
    try {
      this.log(`Updating onboarding status to: ${status}`);
      
      if (this.isDeveloperMode()) {
        const appState = await this.getDeveloperData('app_state') || {};
        appState.onboardingComplete = status === 'complete';
        appState.currentStep = status;
        await this.setDeveloperData('app_state', appState);
      } else {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            app_state: supabase.raw(`app_state || '{"onboardingComplete": ${status === 'complete'}, "currentStep": "${status}"}'::jsonb`),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);

        if (error) {
          this.error('Failed to update onboarding status', error);
          throw error;
        }
      }

      // Clear cache
      this.clearCache();
      this.log('Onboarding status updated successfully');

    } catch (error) {
      this.error('Failed to update onboarding status', error);
      throw error;
    }
  }

  async markOnboardingComplete(): Promise<void> {
    try {
      this.log('Marking onboarding as complete...');
      
      if (this.isDeveloperMode()) {
        const appState = await this.getDeveloperData('app_state') || {};
        appState.onboardingComplete = true;
        appState.currentStep = 'complete';
        await this.setDeveloperData('app_state', appState);
      } else {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            app_state: supabase.raw(`app_state || '{"onboardingComplete": true, "currentStep": "complete"}'::jsonb`),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);

        if (error) {
          this.error('Failed to mark onboarding complete', error);
          throw error;
        }
      }

      // Clear cache
      this.clearCache();
      this.log('Onboarding marked as complete');

    } catch (error) {
      this.error('Failed to mark onboarding complete', error);
      throw error;
    }
  }

  async markProfileSetupComplete(): Promise<void> {
    try {
      this.log('Marking profile setup as complete...');
      
      if (this.isDeveloperMode()) {
        const appState = await this.getDeveloperData('app_state') || {};
        appState.profileSetupCompleted = true;
        await this.setDeveloperData('app_state', appState);
      } else {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            app_state: supabase.raw(`app_state || '{"profileSetupCompleted": true}'::jsonb`),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);

        if (error) {
          this.error('Failed to mark profile setup complete', error);
          throw error;
        }
      }

      // Clear cache
      this.clearCache();
      this.log('Profile setup marked as complete');

    } catch (error) {
      this.error('Failed to mark profile setup complete', error);
      throw error;
    }
  }

  async markSplashScreensSeen(): Promise<void> {
    try {
      this.log('Marking splash screens as seen...');
      
      if (this.isDeveloperMode()) {
        const appState = await this.getDeveloperData('app_state') || {};
        appState.hasSeenSplashScreens = true;
        await this.setDeveloperData('app_state', appState);
      } else {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            app_state: supabase.raw(`app_state || '{"hasSeenSplashScreens": true}'::jsonb`),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);

        if (error) {
          this.error('Failed to mark splash screens as seen', error);
          throw error;
        }
      }

      // Clear cache
      this.clearCache();
      this.log('Splash screens marked as seen');

    } catch (error) {
      this.error('Failed to mark splash screens as seen', error);
      throw error;
    }
  }

  async markWelcomeMessageShown(): Promise<void> {
    try {
      this.log('Marking welcome message as shown...');
      
      if (this.isDeveloperMode()) {
        const appState = await this.getDeveloperData('app_state') || {};
        appState.welcomeMessageShown = true;
        appState.lastWelcomeTime = new Date().toISOString();
        await this.setDeveloperData('app_state', appState);
      } else {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            app_state: supabase.raw(`app_state || '{"welcomeMessageShown": true, "lastWelcomeTime": "${new Date().toISOString()}"}'::jsonb`),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);

        if (error) {
          this.error('Failed to mark welcome message as shown', error);
          throw error;
        }
      }

      // Clear cache
      this.clearCache();
      this.log('Welcome message marked as shown');

    } catch (error) {
      this.error('Failed to mark welcome message as shown', error);
      throw error;
    }
  }

  async markFirstRunComplete(): Promise<void> {
    try {
      this.log('Marking first run as complete...');
      
      if (this.isDeveloperMode()) {
        const appState = await this.getDeveloperData('app_state') || {};
        appState.firstRunCompleted = true;
        await this.setDeveloperData('app_state', appState);
      } else {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            app_state: supabase.raw(`app_state || '{"firstRunCompleted": true}'::jsonb`),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);

        if (error) {
          this.error('Failed to mark first run as complete', error);
          throw error;
        }
      }

      // Clear cache
      this.clearCache();
      this.log('First run marked as complete');

    } catch (error) {
      this.error('Failed to mark first run as complete', error);
      throw error;
    }
  }

  async resetOnboarding(): Promise<void> {
    try {
      this.log('Resetting onboarding...');
      
      if (this.isDeveloperMode()) {
        const appState = await this.getDeveloperData('app_state') || {};
        appState.onboardingComplete = false;
        appState.profileSetupCompleted = false;
        appState.hasSeenSplashScreens = false;
        appState.welcomeMessageShown = false;
        appState.firstRunCompleted = false;
        appState.currentStep = 'initial';
        await this.setDeveloperData('app_state', appState);
      } else {
        const userId = authService.getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
          .from('users')
          .update({ 
            app_state: supabase.raw(`app_state || '{"onboardingComplete": false, "profileSetupCompleted": false, "hasSeenSplashScreens": false, "welcomeMessageShown": false, "firstRunCompleted": false, "currentStep": "initial"}'::jsonb`),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);

        if (error) {
          this.error('Failed to reset onboarding', error);
          throw error;
        }
      }

      // Clear cache
      this.clearCache();
      this.log('Onboarding reset successfully');

    } catch (error) {
      this.error('Failed to reset onboarding', error);
      throw error;
    }
  }
}

// Export singleton instance
export const fixedAppStateService = FixedAppStateService.getInstance();

// Export types
// Export conflicts resolved - types exported from main service files