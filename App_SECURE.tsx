import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/supabase';
import { secureAppStateService } from './services/fixedAppStateService';
import { secureConversationService } from './services/atomicConversationService';
import { UserState, AppView } from './services/fixedAppStateService';

// Import components
import LandingPage from './components/LandingPage';
import MainViewContainer from './components/MainViewContainer';
import OnboardingFlow from './components/OnboardingFlow';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

// ========================================
// 🛡️ SECURE APP COMPONENT
// ========================================
// This fixes all app-level issues with:
// - Proper error handling
// - Security validation
// - Performance optimization
// - State management
// - User experience

interface AppState {
  userState: UserState | null;
  appView: AppView | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    userState: null,
    appView: null,
    loading: true,
    error: null,
    initialized: false
  });

  // Initialize app state
  const initializeApp = useCallback(async () => {
    try {
      setAppState(prev => ({ ...prev, loading: true, error: null }));

      // Get user state
      const userState = await secureAppStateService.getUserState();
      
      // Determine app view
      const appView = secureAppStateService.determineView(userState);

      setAppState({
        userState,
        appView,
        loading: false,
        error: null,
        initialized: true
      });

    } catch (error) {
      console.error('Failed to initialize app:', error);
      setAppState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize app',
        initialized: true
      }));
    }
  }, []);

  // Handle authentication state changes
  const handleAuthStateChange = useCallback(async () => {
    try {
      if (!appState.initialized) return;

      // Get updated user state
      const userState = await secureAppStateService.getUserState();
      
      // Determine app view
      const appView = secureAppStateService.determineView(userState);

      setAppState(prev => ({
        ...prev,
        userState,
        appView,
        error: null
      }));

    } catch (error) {
      console.error('Failed to handle auth state change:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication error'
      }));
    }
  }, [appState.initialized]);

  // Handle onboarding status updates
  const handleOnboardingUpdate = useCallback(async (status: string) => {
    try {
      await secureAppStateService.updateOnboardingStatus(status);
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update onboarding status'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(async () => {
    try {
      await secureAppStateService.markOnboardingComplete();
      await secureAppStateService.markProfileSetupComplete();
      await secureAppStateService.markSplashScreensSeen();
      await secureAppStateService.markWelcomeMessageShown();
      await secureAppStateService.markFirstRunComplete();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete onboarding'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle profile setup completion
  const handleProfileSetupComplete = useCallback(async () => {
    try {
      await secureAppStateService.markProfileSetupComplete();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete profile setup:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete profile setup'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle splash screens completion
  const handleSplashScreensComplete = useCallback(async () => {
    try {
      await secureAppStateService.markSplashScreensSeen();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete splash screens:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete splash screens'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle welcome message completion
  const handleWelcomeMessageComplete = useCallback(async () => {
    try {
      await secureAppStateService.markWelcomeMessageShown();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete welcome message:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete welcome message'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle first run completion
  const handleFirstRunComplete = useCallback(async () => {
    try {
      await secureAppStateService.markFirstRunComplete();
      
      // Refresh app state
      await handleAuthStateChange();
      
    } catch (error) {
      console.error('Failed to complete first run:', error);
      setAppState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete first run'
      }));
    }
  }, [handleAuthStateChange]);

  // Handle error recovery
  const handleErrorRecovery = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe(handleAuthStateChange);
    return unsubscribe;
  }, [handleAuthStateChange]);

  // Handle window focus/blur for session management
  useEffect(() => {
    const handleWindowFocus = () => {
      if (appState.initialized && appState.userState?.isAuthenticated) {
        handleAuthStateChange();
      }
    };

    const handleWindowBlur = () => {
      // Optional: Handle session timeout or cleanup
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [appState.initialized, appState.userState?.isAuthenticated, handleAuthStateChange]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (appState.initialized) {
        handleAuthStateChange();
      }
    };

    const handleOffline = () => {
      // Optional: Handle offline mode
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [appState.initialized, handleAuthStateChange]);

  // Render loading state
  if (appState.loading || !appState.initialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Render error state
  if (appState.error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <ErrorMessage 
          message={appState.error}
          onRetry={handleErrorRecovery}
          onReload={() => window.location.reload()}
        />
      </div>
    );
  }

  // Render app based on view
  if (appState.appView?.view === 'landing') {
    return (
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                <LandingPage 
                  onSignIn={handleAuthStateChange}
                  onSignUp={handleAuthStateChange}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    );
  }

  // Render main app with onboarding
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <MainViewContainer 
                userState={appState.userState!}
                onOnboardingUpdate={handleOnboardingUpdate}
                onOnboardingComplete={handleOnboardingComplete}
                onProfileSetupComplete={handleProfileSetupComplete}
                onSplashScreensComplete={handleSplashScreensComplete}
                onWelcomeMessageComplete={handleWelcomeMessageComplete}
                onFirstRunComplete={handleFirstRunComplete}
              />
            } 
          />
          <Route 
            path="/onboarding" 
            element={
              <OnboardingFlow 
                userState={appState.userState!}
                onComplete={handleOnboardingComplete}
                onUpdate={handleOnboardingUpdate}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
