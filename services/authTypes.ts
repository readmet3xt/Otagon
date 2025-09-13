import { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthService {
  getCurrentState(): AuthState
  getCurrentUserId(): string | null
  getAuthState(): AuthState
  subscribe(callback: (state: AuthState) => void): () => void
  signIn(email: string, password: string): Promise<{ success: boolean; error?: string }>
  signUp(email: string, password: string): Promise<{ success: boolean; error?: string }>
  signOut(): Promise<{ success: boolean; error?: string }>
  signInWithDeveloperMode(password: string): Promise<{ success: boolean; error?: string }>
  handleOAuthCallback(): Promise<boolean>
  resetPassword(email: string): Promise<{ success: boolean; error?: string }>
  signInWithGoogle(): Promise<{ success: boolean; error?: string }>
  signInWithDiscord(): Promise<{ success: boolean; error?: string }>
}
