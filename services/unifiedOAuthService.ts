// ========================================
// 🔐 UNIFIED OAUTH CALLBACK SERVICE
// ========================================
// Centralized OAuth callback handling to prevent race conditions
// and ensure consistent behavior across all authentication flows

import { supabase } from './supabase';
import { authService } from './supabase';

export interface OAuthCallbackResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

export interface OAuthCallbackOptions {
  onSuccess?: (user: any, session: any) => void;
  onError?: (error: string) => void;
  redirectToSplash?: boolean;
}

class UnifiedOAuthService {
  private static instance: UnifiedOAuthService;
  private isProcessingCallback = false;
  private callbackQueue: Array<() => Promise<void>> = [];

  private constructor() {}

  static getInstance(): UnifiedOAuthService {
    if (!UnifiedOAuthService.instance) {
      UnifiedOAuthService.instance = new UnifiedOAuthService();
    }
    return UnifiedOAuthService.instance;
  }

  /**
   * Main OAuth callback handler - called only once per app load
   * Prevents race conditions by queuing multiple calls
   */
  async handleOAuthCallback(options: OAuthCallbackOptions = {}): Promise<OAuthCallbackResult> {
    // If already processing, queue this call
    if (this.isProcessingCallback) {
      return new Promise((resolve) => {
        this.callbackQueue.push(async () => {
          const result = await this.processOAuthCallback(options);
          resolve(result);
        });
      });
    }

    return this.processOAuthCallback(options);
  }

  private async processOAuthCallback(options: OAuthCallbackOptions): Promise<OAuthCallbackResult> {
    this.isProcessingCallback = true;
    
    try {
      console.log('🔐 [UnifiedOAuth] Processing OAuth callback...');
      
      // Check if we're in an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || 
                           hashParams.has('access_token') || hashParams.has('error') ||
                           hashParams.has('token_type') || hashParams.has('expires_in');
      
      if (!hasOAuthParams) {
        console.log('🔐 [UnifiedOAuth] No OAuth parameters found');
        return { success: false, error: 'No OAuth parameters found' };
      }

      console.log('🔐 [UnifiedOAuth] OAuth parameters detected, processing...');
      
      // Log the actual OAuth parameters for debugging
      console.log('🔐 [UnifiedOAuth] URL params:', Object.fromEntries(urlParams.entries()));
      console.log('🔐 [UnifiedOAuth] Hash params:', Object.fromEntries(hashParams.entries()));
      
      // Log the full URL for debugging
      console.log('🔐 [UnifiedOAuth] Current URL:', window.location.href);
      
      // Check for specific OAuth parameters
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error') || hashParams.get('error');
      
      // Check for implicit flow parameters (access_token in hash)
      const accessToken = hashParams.get('access_token');
      const tokenType = hashParams.get('token_type');
      const expiresIn = hashParams.get('expires_in');
      const refreshToken = hashParams.get('refresh_token');
      
      if (error) {
        console.error('🔐 [UnifiedOAuth] OAuth error detected:', error);
        this.cleanupOAuthParams();
        const errorMessage = `OAuth error: ${error}`;
        if (options.onError) {
          options.onError(errorMessage);
        }
        return { success: false, error: errorMessage };
      }
      
      // Handle implicit flow (access_token in hash) - Google, Discord, Email
      if (accessToken) {
        console.log('🔐 [UnifiedOAuth] Implicit flow detected (access_token in hash)');
        console.log('🔐 [UnifiedOAuth] Token type:', tokenType);
        console.log('🔐 [UnifiedOAuth] Expires in:', expiresIn);
        
        try {
          // Parse JWT token to extract user info
          const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
          console.log('🔐 [UnifiedOAuth] Token payload:', {
            sub: tokenPayload.sub,
            email: tokenPayload.email,
            provider: tokenPayload.app_metadata?.provider
          });
          
          // Create session object from token data
          const session = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: parseInt(expiresIn || '3600'),
            token_type: tokenType || 'bearer',
            user: {
              id: tokenPayload.sub,
              email: tokenPayload.email,
              user_metadata: tokenPayload.user_metadata || {},
              app_metadata: tokenPayload.app_metadata || {},
              aud: tokenPayload.aud,
              created_at: tokenPayload.created_at,
              updated_at: tokenPayload.updated_at
            }
          };
          
          console.log('🔐 [UnifiedOAuth] Implicit flow successful', { userId: session.user.id });
          
          // Set the session in Supabase to establish proper authentication state
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (setSessionError) {
            console.error('🔐 [UnifiedOAuth] Failed to set Supabase session:', setSessionError);
            this.cleanupOAuthParams();
            const errorMessage = 'Failed to establish authentication session. Please try signing in again.';
            if (options.onError) {
              options.onError(errorMessage);
            }
            return { success: false, error: errorMessage };
          }
          
          console.log('🔐 [UnifiedOAuth] Supabase session established successfully');
          
          // Clean up URL parameters
          this.cleanupOAuthParams();
          
          // Call success callback
          if (options.onSuccess) {
            options.onSuccess(session.user, session);
          }
          
          return { 
            success: true, 
            user: session.user, 
            session 
          };
          
        } catch (tokenError) {
          console.error('🔐 [UnifiedOAuth] Failed to parse access token:', tokenError);
          this.cleanupOAuthParams();
          const errorMessage = 'Failed to process authentication token. Please try signing in again.';
          if (options.onError) {
            options.onError(errorMessage);
          }
          return { success: false, error: errorMessage };
        }
      }
      
      // Handle authorization code flow (code in URL params)
      if (code) {
        console.log('🔐 [UnifiedOAuth] Authorization code flow detected');
        console.log('🔐 [UnifiedOAuth] OAuth code found:', code.substring(0, 20) + '...');
      } else {
        console.error('🔐 [UnifiedOAuth] No OAuth code or access_token found');
        this.cleanupOAuthParams();
        const errorMessage = 'No OAuth authorization code or access token found. Please try signing in again.';
        if (options.onError) {
          options.onError(errorMessage);
        }
        return { success: false, error: errorMessage };
      }
      
      // Wait for Supabase to process the OAuth response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try multiple approaches to get the session
      let session = null;
      let sessionError = null;
      
      // Approach 1: Try getSession()
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionData?.session) {
        session = sessionData.session;
        console.log('🔐 [UnifiedOAuth] Session found via getSession()');
      } else {
        sessionError = sessionErr;
        console.log('🔐 [UnifiedOAuth] getSession() failed:', sessionErr);
      }
      
      // Approach 2: If getSession() failed, try getSession() with refresh
      if (!session) {
        console.log('🔐 [UnifiedOAuth] Trying session refresh...');
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshData?.session) {
          session = refreshData.session;
          console.log('🔐 [UnifiedOAuth] Session found via refreshSession()');
        } else {
          console.log('🔐 [UnifiedOAuth] refreshSession() failed:', refreshErr);
        }
      }
      
      // Approach 3: If still no session, try getUser() directly
      if (!session) {
        console.log('🔐 [UnifiedOAuth] Trying getUser() directly...');
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userData?.user) {
          console.log('🔐 [UnifiedOAuth] User found via getUser(), but no session');
          // We have a user but no session - this might be a timing issue
          // Wait a bit more and try getSession() again
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: retrySessionData, error: retryErr } = await supabase.auth.getSession();
          if (retrySessionData?.session) {
            session = retrySessionData.session;
            console.log('🔐 [UnifiedOAuth] Session found on retry');
          } else {
            console.log('🔐 [UnifiedOAuth] Retry getSession() failed:', retryErr);
          }
        } else {
          console.log('🔐 [UnifiedOAuth] getUser() failed:', userErr);
        }
      }
      
      if (session?.user) {
        console.log('🔐 [UnifiedOAuth] OAuth callback successful', { userId: session.user.id });
        
        // Clean up URL parameters
        this.cleanupOAuthParams();
        
        // Call success callback
        if (options.onSuccess) {
          options.onSuccess(session.user, session);
        }
        
        return { 
          success: true, 
          user: session.user, 
          session 
        };
      }
      
      // If we still don't have a session, log detailed error information
      console.error('🔐 [UnifiedOAuth] All session attempts failed');
      console.error('🔐 [UnifiedOAuth] Final session error:', sessionError);
      this.cleanupOAuthParams();
      
      const errorMessage = 'Unable to establish authentication session. Please check your Supabase configuration and try again.';
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
      
    } catch (error) {
      console.error('🔐 [UnifiedOAuth] Unexpected error during OAuth callback:', error);
      this.cleanupOAuthParams();
      
      const errorMessage = 'An unexpected error occurred during authentication.';
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      this.isProcessingCallback = false;
      
      // Process queued callbacks
      if (this.callbackQueue.length > 0) {
        const nextCallback = this.callbackQueue.shift();
        if (nextCallback) {
          nextCallback();
        }
      }
    }
  }

  private cleanupOAuthParams(): void {
    try {
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🔐 [UnifiedOAuth] OAuth parameters cleaned from URL');
    } catch (error) {
      console.warn('🔐 [UnifiedOAuth] Failed to clean URL parameters:', error);
    }
  }

  /**
   * Check if we're currently in an OAuth callback
   */
  isOAuthCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    return urlParams.has('code') || urlParams.has('error') || 
           hashParams.has('access_token') || hashParams.has('error') ||
           hashParams.has('token_type') || hashParams.has('expires_in');
  }

  /**
   * Reset the callback processing state (for testing)
   */
  reset(): void {
    this.isProcessingCallback = false;
    this.callbackQueue = [];
  }
}

// Export singleton instance
export const unifiedOAuthService = UnifiedOAuthService.getInstance();
