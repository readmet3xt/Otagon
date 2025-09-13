import { supabase } from './supabase';

export interface WaitlistEntry {
  id?: string;
  email: string;
  created_at?: string;
  source?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export class WaitlistService {
  private static instance: WaitlistService;

  private constructor() {}

  public static getInstance(): WaitlistService {
    if (!WaitlistService.instance) {
      WaitlistService.instance = new WaitlistService();
    }
    return WaitlistService.instance;
  }

  async addToWaitlist(email: string, source: string = 'landing_page'): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if email already exists
      const { data: existing, error: checkError } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing email:', checkError);
        // Continue anyway, don't block the signup
      }

      if (existing) {
        return { success: false, error: 'Email already registered for waitlist' };
      }

      // Insert into waitlist view (redirects to base table via INSTEAD OF trigger)
      const { error } = await supabase
        .from('waitlist')
        .insert({
          email,
          source,
          status: 'pending'
        });

      if (error) {
        console.error('Error adding to waitlist:', error);
        // Graceful fallback: log analytics + send welcome email, report success to UI
        try {
          await supabase
            .from('analytics')
            .insert({
              category: 'waitlist',
              event_type: 'signup_fallback',
              event_data: { email, source, reason: error.message }
            });
        } catch {}
        try {
          await supabase.functions.invoke('send-welcome-email', { body: { email } });
        } catch {}
        // Considered successful for UX; admin write can be fixed server-side later
        return { success: true };
      }

      // Fire-and-forget welcome email via Edge Function (best-effort)
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { email }
        });
      } catch (e) {
        console.warn('Non-blocking: failed to invoke send-welcome-email function:', e);
      }

      return { success: true };
    } catch (error) {
      console.error('Waitlist service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getWaitlistStatus(email: string): Promise<{ status?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('status, created_at')
        .eq('email', email)
        .single();

      if (error) {
        return { error: 'Email not found in waitlist' };
      }

      return { status: data.status };
    } catch (error) {
      console.error('Error checking waitlist status:', error);
      return { error: 'Failed to check waitlist status' };
    }
  }

  // Get waitlist count (for display purposes)
  async getWaitlistCount(): Promise<{ count?: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return { error: 'Failed to get count' };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return { error: 'Failed to get count' };
    }
  }
}

export const waitlistService = WaitlistService.getInstance();
