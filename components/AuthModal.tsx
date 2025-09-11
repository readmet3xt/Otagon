import React, { useState, useEffect } from 'react';
import { authService, AuthState } from '../services/supabase';
// Dynamic import to avoid circular dependency
// import { performanceService } from '../services/performanceService';
import DiscordIcon from './DiscordIcon';

// Social login icons
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = authService.subscribe(setAuthState);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (authState?.user && !authState.loading) {
      onAuthSuccess();
      onClose();
    }
  }, [authState?.user, authState?.loading, onAuthSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup' && password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      let result;
      
      if (mode === 'login') {
        const { performanceService } = await import('../services/performanceService');
        result = await performanceService.measureAsync('auth_login', () => 
          authService.signIn(email, password)
        );
      } else if (mode === 'signup') {
        const { performanceService } = await import('../services/performanceService');
        result = await performanceService.measureAsync('auth_signup', () => 
          authService.signUp(email, password)
        );
      } else if (mode === 'forgot-password') {
        const { performanceService } = await import('../services/performanceService');
        result = await performanceService.measureAsync('auth_reset_password', () => 
          authService.resetPassword(email)
        );
      }

      if (result?.success) {
        if (mode === 'forgot-password') {
          setSuccess('Password reset email sent. Please check your inbox.');
        } else if (mode === 'signup') {
          setSuccess('Account created successfully! Please check your email to verify your account.');
        }
        // Login will be handled by the auth state change
      } else {
        setError(result?.error?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div 
        className="bg-[#1C1C1C] border border-[#424242] rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot-password' && 'Reset Password'}
          </h2>
          <p className="text-[#A3A3A3]">
            {mode === 'login' && 'Sign in to continue your gaming journey'}
            {mode === 'signup' && 'Join Otakon and get started'}
            {mode === 'forgot-password' && 'Enter your email to reset your password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#CFCFCF] mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
              className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] disabled:opacity-50 transition-colors"
            />
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#CFCFCF] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] disabled:opacity-50 transition-colors"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-[#CFCFCF] mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40] disabled:opacity-50 transition-colors"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-md p-3">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-transparent border-t-white border-r-white border-b-white mr-2"></div>
                {mode === 'login' && 'Signing In...'}
                {mode === 'signup' && 'Creating Account...'}
                {mode === 'forgot-password' && 'Sending Email...'}
              </div>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot-password' && 'Send Reset Email'}
              </>
            )}
          </button>
        </form>

        {/* Social Login Buttons */}
        {mode !== 'forgot-password' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#424242]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1C1C1C] text-[#A3A3A3]">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await authService.signInWithGoogle();
                  } catch (error) {
                    console.error('Google sign-in error:', error);
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                ) : (
                  <GoogleIcon className="w-5 h-5" />
                )}
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await authService.signInWithDiscord();
                  } catch (error) {
                    console.error('Discord sign-in error:', error);
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <div className="flex-shrink-0">
                    <DiscordIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="font-medium">{loading ? 'Signing in...' : 'Continue with Discord'}</span>
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center">
          {mode === 'login' && (
            <div className="space-y-2">
              <button
                onClick={() => switchMode('forgot-password')}
                className="text-sm text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
              >
                Forgot your password?
              </button>
              <div className="text-sm text-[#A3A3A3]">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="text-sm text-[#A3A3A3]">
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

          {mode === 'forgot-password' && (
            <div className="text-sm text-[#A3A3A3]">
              Remember your password?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-[#FFAB40] hover:text-[#FFAB40]/80 transition-colors"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
