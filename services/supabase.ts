import { createClient } from '@supabase/supabase-js';
import { User, Session, AuthError } from '@supabase/supabase-js';
// Avoid eager import to prevent circular dependency with tierService
import { LocalStorageReplacer } from './silentMigrationService';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;

// For now, use placeholder values to prevent crashes
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables, using fallback values');
}

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseKey || fallbackKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Initialize silent migration service
export const localStorageReplacer = new LocalStorageReplacer(supabase);

// Auth types
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

// Auth service
export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    session: null,
    loading: false,
    error: null,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.clearInvalidSessions();
    this.initializeAuth();
  }

  private async clearInvalidSessions() {
    try {
      // Clear any existing invalid sessions
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) {
            console.log('🔐 Clearing invalid session on startup');
            await supabase.auth.signOut();
          }
        } catch (validationError) {
          console.log('🔐 Clearing invalid session on startup due to validation error');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      // Ignore errors during session clearing
    }
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('🔐 Initial session error:', error);
        this.updateAuthState({ error, loading: false });
        return;
      }

      // Validate session by trying to get user data
      if (session?.user) {
        console.log('🔐 Validating existing session...');
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.log('🔐 Session validation failed, clearing invalid session:', userError);
            // Session is invalid, clear it completely
            await supabase.auth.signOut();
            this.updateAuthState({ user: null, session: null, loading: false });
            return;
          }
          console.log('🔐 Session validated successfully');
        } catch (validationError) {
          console.log('🔐 Session validation error, clearing invalid session:', validationError);
          // Session is invalid, clear it completely
          await supabase.auth.signOut();
          this.updateAuthState({ user: null, session: null, loading: false });
          return;
        }
      }

      this.updateAuthState({ 
        user: session?.user ?? null, 
        session, 
        loading: false 
      });

      // If user already has a session, start migration
      if (session?.user) {
        console.log('Existing session found, checking if migration is needed...');
        // The migration service will automatically check and migrate if needed
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        // Only log significant auth events to reduce console noise
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log('🔐 Supabase auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
        }
        
        // Validate session for SIGNED_IN events
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
              console.log('🔐 New session validation failed:', userError);
              // Session is invalid, don't update state
              return;
            }
          } catch (validationError) {
            console.log('🔐 New session validation error:', validationError);
            // Session is invalid, don't update state
            return;
          }
        }
        
        this.updateAuthState({ 
          user: session?.user ?? null, 
          session, 
          loading: false 
        });

        // Automatically assign free tier to new users
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 User signed in, assigning free tier...');
          try {
            const { tierService } = await import('./tierService');
            await tierService.assignFreeTier(session.user.id);
            
            // Start silent migration of localStorage data to Supabase
            console.log('Starting silent migration of localStorage data...');
          } catch (error) {
            console.error('Error assigning free tier:', error);
          }
        }
      });
    } catch (error) {
      this.updateAuthState({ 
        error: error as AuthError, 
        loading: false 
      });
    }
  }

  private updateAuthState(updates: Partial<AuthState>) {
    // Only log significant state changes to reduce console noise
    const hasUserChanged = !!this.authState.user !== !!updates.user;
    const loadingChanged = this.authState.loading !== updates.loading;
    
    if (hasUserChanged || loadingChanged) {
      console.log('🔄 AuthService state update:', { 
        previous: { hasUser: !!this.authState.user, loading: this.authState.loading },
        updates: { hasUser: !!updates.user, loading: updates.loading },
        newState: { hasUser: !!updates.user || !!this.authState.user, loading: updates.loading ?? this.authState.loading }
      });
    }
    
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    // Reduce listener notification logging
    this.listeners.forEach(listener => listener(this.authState));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getCurrentUserId(): string | null {
    return this.authState.user?.id || null;
  }

  async signIn(email: string, password: string) {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signInWithGoogle() {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      // For OAuth, we don't need to wait for the redirect
      // The user will be redirected back to the current page
      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signInWithDiscord() {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signUp(email: string, password: string) {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signOut() {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      this.updateAuthState({ user: null, session: null, loading: false });
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async resetPassword(email: string) {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      this.updateAuthState({ loading: false });
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async clearInvalidSession() {
    try {
      console.log('🔐 Clearing invalid session...');
      await supabase.auth.signOut();
      this.updateAuthState({ user: null, session: null, loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error clearing invalid session:', error);
      return { success: false, error };
    }
  }

  // Handle OAuth callback manually if needed
  async handleOAuthCallback() {
    try {
      console.log('🔄 Checking for OAuth callback...');
      
      // Check if we're in a callback URL with tokens in hash
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('✅ OAuth tokens found in URL, setting session...');
        
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('❌ Error setting OAuth session:', error);
          this.updateAuthState({ loading: false, error });
          return false;
        }

        if (data.session) {
          console.log('✅ OAuth session set successfully');
          this.updateAuthState({ 
            user: data.user, 
            session: data.session, 
            loading: false, 
            error: null 
          });
          
          // Set auth method for the app to detect fresh authentication
          localStorage.setItem('otakonAuthMethod', 'google'); // Default to google, could be enhanced to detect provider
          
          // Clear the URL hash
          window.history.replaceState({}, document.title, window.location.pathname);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ OAuth callback handling failed:', error);
      this.updateAuthState({ loading: false, error: error as AuthError });
      return false;
    }
  }
}

export const authService = AuthService.getInstance();

// Default export for direct usage
export default supabase;
