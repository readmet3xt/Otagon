import { useState, useEffect } from 'react';
import { AuthState } from './types';
import { authService } from './services/authService';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setAuthState({
          user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isLoading: false,
          error: error as Error,
        });
      }
    };

    initializeAuth();
  }, []);

  if (authState.isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D4D] mx-auto mb-4"></div>
          <p className="text-text-muted">Loading Otagon...</p>
        </div>
      </div>
    );
  }

  if (authState.user) {
    return (
      <MainApp
        onLogout={() => {
          authService.logout();
          setAuthState({ user: null, isLoading: false, error: null });
        }}
        onOpenSettings={() => {}}
      />
    );
  }

  return <LandingPage />;
}

export default App;