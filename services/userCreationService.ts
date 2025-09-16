// ========================================
// 🔐 USER CREATION SERVICE
// ========================================
// Handles manual user creation when database triggers fail
// This ensures authenticated users always have a record in the users table

import { supabase } from './supabase';

export interface UserCreationResult {
  success: boolean;
  error?: string;
  userId?: string;
}

class UserCreationService {
  private static instance: UserCreationService;

  static getInstance(): UserCreationService {
    if (!UserCreationService.instance) {
      UserCreationService.instance = new UserCreationService();
    }
    return UserCreationService.instance;
  }

  /**
   * Creates a user record in the users table for an authenticated user
   * This is called when the database trigger fails or user record is missing
   */
  async createUserRecord(authUserId: string, email: string): Promise<UserCreationResult> {
    try {
      console.log('🔐 [UserCreation] Creating user record for:', { authUserId, email });

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (existingUser) {
        console.log('🔐 [UserCreation] User record already exists:', existingUser.id);
        return { success: true, userId: existingUser.id };
      }

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('🔐 [UserCreation] Error checking existing user:', checkError);
        return { success: false, error: checkError.message };
      }

      // Create new user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUserId,
          email: email,
          tier: 'free',
          profile_data: {},
          preferences: {},
          usage_data: {
            textCount: 0,
            imageCount: 0,
            textLimit: 55,
            imageLimit: 25,
            totalRequests: 0,
            lastReset: 0
          },
          app_state: {
            onboardingComplete: false,
            profileSetupCompleted: false,
            hasSeenSplashScreens: false,
            welcomeMessageShown: false,
            firstWelcomeShown: false,
            hasConversations: false,
            hasInteractedWithChat: false,
            lastSessionDate: '',
            lastWelcomeTime: '',
            appClosedTime: '',
            firstRunCompleted: false,
            hasConnectedBefore: false,
            installDismissed: false,
            showSplashAfterLogin: false,
            lastSuggestedPromptsShown: ''
          },
          behavior_data: {
            sessionCount: 0,
            totalTimeSpent: 0,
            lastActivity: 0,
            featureUsage: {}
          },
          feedback_data: {
            ratings: [],
            suggestions: [],
            bugReports: []
          },
          onboarding_data: {
            stepsCompleted: [],
            currentStep: 'initial',
            completedAt: null
          }
        })
        .select('id')
        .single();

      if (createError) {
        console.error('🔐 [UserCreation] Failed to create user record:', createError);
        return { success: false, error: createError.message };
      }

      console.log('🔐 [UserCreation] User record created successfully:', newUser.id);
      return { success: true, userId: newUser.id };

    } catch (error) {
      console.error('🔐 [UserCreation] Unexpected error creating user record:', error);
      return { success: false, error: 'An unexpected error occurred while creating user record' };
    }
  }

  /**
   * Ensures user record exists, creates it if missing
   */
  async ensureUserRecord(authUserId: string, email: string): Promise<UserCreationResult> {
    try {
      // First, try to get existing user
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (user) {
        return { success: true, userId: user.id };
      }

      if (error && error.code === 'PGRST116') {
        // User not found, create it
        console.log('🔐 [UserCreation] User record not found, creating...');
        return await this.createUserRecord(authUserId, email);
      }

      console.error('🔐 [UserCreation] Error checking user record:', error);
      return { success: false, error: error?.message || 'Failed to check user record' };

    } catch (error) {
      console.error('🔐 [UserCreation] Unexpected error ensuring user record:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

// Export singleton instance
export const userCreationService = UserCreationService.getInstance();
