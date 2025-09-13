import React, { useState, useEffect, useCallback } from 'react';
import { authService } from './services/supabase';
import { fixedAppStateService } from './services/fixedAppStateService';
import { fixedErrorHandlingService } from './services/fixedErrorHandlingService';
import { UserState, AppView } from './services/fixedAppStateService';

// Import your existing components
import LandingPage from './components/LazyComponents';
import LoginSplashScreen from './components/LoginSplashScreen';
import InitialSplashScreen from './components/InitialSplashScreen';
import HowToUseSplashScreen from './components/HowToUseSplashScreen';
import SplashScreen from './components/SplashScreen';
import ChatInterface from './components/ChatInterface'; // Your main chat component

// ========================================
// 🚀 FIXED APP COMPONENT
// ========================================
// This fixes all app state management issues with:
// - Simplified state management
// - Robust error handling
// - Clear user state transitions
// - Proper authentication flow

const App: React.FC = () => {
  // State management
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [onboardingStatus, setOnboardingStatus] = useState<string>('login');
  const [userState, setUserState] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Subscribe to auth state changes
      const unsubscribe = authService.subscribe(async (authState) => {
        try {
          if (authState.loading) {
            return; // Wait for auth to finish loading
          }

          // Get user state
          const currentUserState = await fixedAppStateService.getUserState();
          setUserState(currentUserState);

          // Determine app view
          const appView = fixedAppStateService.determineView(currentUserState);
          setView(appView.view);
          setOnboardingStatus(appView.onboardingStatus);

          if (appView.error) {
            setError(appView.error);
          }

          setLoading(false);
        } catch (error) {
          await fixedErrorHandlingService.handleError(error, {
            operation: 'auth_state_change',
            component: 'App'
          });
          setError('Failed to initialize app state');
          setLoading(false);
        }
      });

      // Handle OAuth callback if needed
      const isOAuthCallback = await authService.handleOAuthCallback();
      if (isOAuthCallback) {
        // OAuth callback handled, auth state will update automatically
        return;
      }

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'app_initialization',
        component: 'App'
      });
      setError('Failed to initialize app');
      setLoading(false);
    }
  }, []);

  // Handle onboarding status changes
  const handleOnboardingStatusChange = useCallback(async (newStatus: string) => {
    try {
      await fixedAppStateService.updateOnboardingStatus(newStatus);
      setOnboardingStatus(newStatus);
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'update_onboarding_status',
        component: 'App',
        additionalData: { newStatus }
      });
    }
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(async () => {
    try {
      await fixedAppStateService.markOnboardingComplete();
      setOnboardingStatus('complete');
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'mark_onboarding_complete',
        component: 'App'
      });
    }
  }, []);

  // Handle profile setup completion
  const handleProfileSetupComplete = useCallback(async () => {
    try {
      await fixedAppStateService.markProfileSetupComplete();
      // Update local state
      if (userState) {
        setUserState({ ...userState, hasProfileSetup: true });
      }
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'mark_profile_setup_complete',
        component: 'App'
      });
    }
  }, [userState]);

  // Handle splash screens completion
  const handleSplashScreensComplete = useCallback(async () => {
    try {
      await fixedAppStateService.markSplashScreensSeen();
      // Update local state
      if (userState) {
        setUserState({ ...userState, hasSeenSplashScreens: true });
      }
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'mark_splash_screens_seen',
        component: 'App'
      });
    }
  }, [userState]);

  // Handle welcome message shown
  const handleWelcomeMessageShown = useCallback(async () => {
    try {
      await fixedAppStateService.markWelcomeMessageShown();
      // Update local state
      if (userState) {
        setUserState({ ...userState, hasWelcomeMessage: true });
      }
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'mark_welcome_message_shown',
        component: 'App'
      });
    }
  }, [userState]);

  // Handle first run completion
  const handleFirstRunComplete = useCallback(async () => {
    try {
      await fixedAppStateService.markFirstRunComplete();
      // Update local state
      if (userState) {
        setUserState({ ...userState, isNewUser: false });
      }
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'mark_first_run_complete',
        component: 'App'
      });
    }
  }, [userState]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      const result = await authService.signOut();
      if (result.success) {
        setView('landing');
        setOnboardingStatus('login');
        setUserState(null);
        setError(null);
      } else {
        setError(result.error || 'Failed to sign out');
      }
    } catch (error) {
      await fixedErrorHandlingService.handleError(error, {
        operation: 'sign_out',
        component: 'App'
      });
      setError('Failed to sign out');
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Landing page
  if (view === 'landing') {
    return (
      <LoginSplashScreen
        onSignInSuccess={() => {
          // Auth state change will handle the transition
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  // App view - handle onboarding flow
  if (view === 'app') {
    switch (onboardingStatus) {
      case 'initial':
        return (
          <InitialSplashScreen
            onComplete={handleOnboardingComplete}
            onProfileSetupComplete={handleProfileSetupComplete}
            onSplashScreensComplete={handleSplashScreensComplete}
            onWelcomeMessageShown={handleWelcomeMessageShown}
            onFirstRunComplete={handleFirstRunComplete}
            userState={userState}
          />
        );

      case 'features':
        return (
          <HowToUseSplashScreen
            onComplete={handleOnboardingComplete}
            onProfileSetupComplete={handleProfileSetupComplete}
            onSplashScreensComplete={handleSplashScreensComplete}
            onWelcomeMessageShown={handleWelcomeMessageShown}
            onFirstRunComplete={handleFirstRunComplete}
            userState={userState}
          />
        );

      case 'complete':
        return (
          <ChatInterface
            userState={userState}
            onSignOut={handleSignOut}
            onWelcomeMessageShown={handleWelcomeMessageShown}
          />
        );

      default:
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-white mb-4">Unknown onboarding status</h1>
              <p className="text-gray-300 mb-6">Status: {onboardingStatus}</p>
              <button
                onClick={() => handleOnboardingStatusChange('initial')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Reset Onboarding
              </button>
            </div>
          </div>
        );
    }
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-500 text-6xl mb-4">❓</div>
        <h1 className="text-2xl font-bold text-white mb-4">Unknown state</h1>
        <p className="text-gray-300">View: {view}, Status: {onboardingStatus}</p>
      </div>
    </div>
  );
};

export default App;