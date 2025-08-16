import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import Logo from './Logo';

interface AuthCallbackHandlerProps {
  onAuthSuccess: () => void;
  onAuthError: (error: string) => void;
  onRedirectToSplash?: () => void;
}

const AuthCallbackHandler: React.FC<AuthCallbackHandlerProps> = ({ onAuthSuccess, onAuthError, onRedirectToSplash }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setStatus('error');
          onAuthError(error.message);
          return;
        }

        if (session) {
          console.log('Auth successful, session:', session);
          setStatus('success');
          
          // Wait a moment to show success, then redirect to splash screen
          setTimeout(() => {
            if (onRedirectToSplash) {
              onRedirectToSplash();
            } else {
              onAuthSuccess();
            }
          }, 1500);
        } else {
          // Check if we're in the middle of an OAuth flow
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('User error:', userError);
            setError('Authentication failed. Please try again.');
            setStatus('error');
            onAuthError('Authentication failed. Please try again.');
          } else if (user) {
            console.log('User authenticated:', user);
            setStatus('success');
            setTimeout(() => {
              if (onRedirectToSplash) {
                onRedirectToSplash();
              } else {
                onAuthSuccess();
              }
            }, 1500);
          } else {
            setError('No authentication session found. Please try signing in again.');
            setStatus('error');
            onAuthError('No authentication session found. Please try signing in again.');
          }
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        const errorMessage = 'An unexpected error occurred during authentication.';
        setError(errorMessage);
        setStatus('error');
        onAuthError(errorMessage);
      }
    };

    handleAuthCallback();
  }, [onAuthSuccess, onAuthError]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <Logo className="h-16 w-16 mx-auto mb-6" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E53A3A] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Completing Sign In</h1>
          <p className="text-[#A3A3A3]">Please wait while we authenticate you...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <Logo className="h-16 w-16 mx-auto mb-6" />
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-green-400">Sign In Successful!</h1>
          <p className="text-[#A3A3A3]">Redirecting you to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center">
      <div className="text-center">
        <Logo className="h-16 w-16 mx-auto mb-6" />
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-red-400">Sign In Failed</h1>
        <p className="text-[#A3A3A3] mb-4">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default AuthCallbackHandler;
