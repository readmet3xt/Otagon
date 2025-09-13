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
        .from('waitlist_entries')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing email:', checkError);
        // Continue anyway, don't block the signup
      }

      if (existing) {
        return { success: false, error: 'Email already registered for waitlist_entries' };
      }

      // Insert into waitlist_entries table
      const { error } = await supabase
        .from('waitlist_entries')
        .insert({
          email,
          source,
          status: 'pending'
        });

      if (error) {
        console.error('Error adding to waitlist_entries:', error);
        // Return actual error instead of fake success
        return { success: false, error: `Failed to add to waitlist_entries: ${error.message}` };
      }

      // Log successful signup (only if user is authenticated)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('analytics')
            .insert({
              event_type: 'waitlist_entries_signup_success',
              event_data: { email, source }
            });
        }
      } catch (analyticsError) {
        console.warn('Failed to log analytics:', analyticsError);
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
        .from('waitlist_entries')
        .select('status, created_at')
        .eq('email', email)
        .single();

      if (error) {
        return { error: 'Email not found in waitlist_entries' };
      }

      return { status: data.status };
    } catch (error) {
      console.error('Error checking waitlist_entries status:', error);
      return { error: 'Failed to check waitlist_entries status' };
    }
  }

  // Get waitlist_entries count (for display purposes)
  async getWaitlistCount(): Promise<{ count?: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('waitlist_entries')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return { error: 'Failed to get count' };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error getting waitlist_entries count:', error);
      return { error: 'Failed to get count' };
    }
  }
}

export const waitlist_entriesService = WaitlistService.getInstance();
