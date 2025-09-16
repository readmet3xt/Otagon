/**
 * Barrel exports for utilities
 * 
 * This file provides centralized exports for all utility functions,
 * making imports cleaner and more maintainable.
 */

// Constants
export * from './constants';

// Helper Functions
export * from './helpers';

// Utility Functions
export { cn } from './cn';

// Developer Mode Detection
export const isDeveloperMode = (): boolean => {
  // Only return true if developer mode is active AND user is not authenticated via OAuth
  const devModeActive = localStorage.getItem('otakon_developer_mode') === 'true';
  
  if (!devModeActive) {
    return false;
  }
  
  // Check if user is authenticated via OAuth (not developer mode)
  // This prevents authenticated users from being treated as developers
  try {
    const authMethod = localStorage.getItem('otakonAuthMethod');
    const isOAuthUser = authMethod === 'google' || authMethod === 'discord' || authMethod === 'email';
    
    if (isOAuthUser) {
      console.log('🔧 [isDeveloperMode] OAuth user detected, not treating as developer mode');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('🔧 [isDeveloperMode] Error checking auth method:', error);
    return devModeActive;
  }
};
