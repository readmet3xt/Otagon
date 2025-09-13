import { supabaseDataService } from './supabaseDataService';
import { supabase } from './supabase';

const NAME_KEY = 'otakonUserName';

// Extract first name from full name
const extractFirstName = (fullName: string | null): string | null => {
    if (!fullName || !fullName.trim()) return null;
    return fullName.trim().split(' ')[0];
};

// Get display name from OAuth provider metadata
const getOAuthDisplayName = async (): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Check user_metadata for OAuth provider names
        const userMetadata = user.user_metadata;
        if (userMetadata) {
            // Google provides 'full_name' or 'name'
            if (userMetadata.full_name) return userMetadata.full_name;
            if (userMetadata.name) return userMetadata.name;
            
            // Discord provides 'full_name' or 'name'
            if (userMetadata.full_name) return userMetadata.full_name;
            if (userMetadata.name) return userMetadata.name;
            
            // Some providers use 'display_name'
            if (userMetadata.display_name) return userMetadata.display_name;
        }

        // Check app_metadata as fallback
        const appMetadata = user.app_metadata;
        if (appMetadata) {
            if (appMetadata.full_name) return appMetadata.full_name;
            if (appMetadata.name) return appMetadata.name;
        }

        return null;
    } catch (error) {
        console.warn('Failed to get OAuth display name:', error);
        return null;
    }
};

const getName = async (): Promise<string | null> => {
    try {
        // Try to get name from Supabase first
        const preferences = await supabaseDataService.getUserPreferences();
        if (preferences.profileName) {
            return preferences.profileName;
        }
        
        // Try to get OAuth display name
        const oauthName = await getOAuthDisplayName();
        if (oauthName) {
            // Auto-save OAuth name to preferences
            await setName(oauthName);
            return oauthName;
        }
        
        // Fallback to localStorage
        return localStorage.getItem(NAME_KEY);
    } catch (error) {
        console.warn('Failed to get profile name from Supabase, using localStorage fallback:', error);
        return localStorage.getItem(NAME_KEY);
    }
};

// Get first name for addressing users
const getFirstName = async (): Promise<string | null> => {
    const fullName = await getName();
    return extractFirstName(fullName);
};

const setName = async (name: string): Promise<void> => {
    if (name.trim()) {
        try {
            // Update in Supabase
            await supabaseDataService.updateUserPreferences('profileName', name.trim());
            
            // Also update localStorage as backup
            localStorage.setItem(NAME_KEY, name.trim());
            
            console.log('✅ Profile name updated in Supabase');
        } catch (error) {
            console.warn('Failed to update profile name in Supabase, using localStorage only:', error);
            // Fallback to localStorage only
            localStorage.setItem(NAME_KEY, name.trim());
        }
    } else {
        try {
            // Clear from Supabase
            await supabaseDataService.updateUserPreferences('profileName', null);
            
            // Also clear localStorage
            localStorage.removeItem(NAME_KEY);
            
            console.log('✅ Profile name cleared from Supabase');
        } catch (error) {
            console.warn('Failed to clear profile name from Supabase, using localStorage only:', error);
            // Fallback to localStorage only
            localStorage.removeItem(NAME_KEY);
        }
    }
};

const reset = async (): Promise<void> => {
    try {
        // Clear from Supabase
        await supabaseDataService.updateUserPreferences('profileName', null);
        
        // Also clear localStorage
        localStorage.removeItem(NAME_KEY);
        
        console.log('✅ Profile reset in Supabase');
    } catch (error) {
        console.warn('Failed to reset profile in Supabase, using localStorage only:', error);
        // Fallback to localStorage only
        localStorage.removeItem(NAME_KEY);
    }
};

export const profileService = {
    getName,
    getFirstName,
    setName,
    reset,
};
