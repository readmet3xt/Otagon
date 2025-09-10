// Developer account configuration
// Only users with these email addresses can access developer features
// 
// To add a developer account:
// 1. Add the email address to the DEVELOPER_EMAILS array below
// 2. OR use an email that ends with @otakon.app
// 3. OR use an email that contains 'dev' or 'developer' (case insensitive)
// 
// NOTE: Development environment no longer grants automatic access to developer features

export const DEVELOPER_EMAILS = [
  // Add developer email addresses here
  'support@otakon.app',
  'your.email@example.com', // Replace with actual developer emails
  // Add more developer emails as needed
];

export const isDeveloperAccount = (email?: string): boolean => {
  if (!email) return false;
  
  // Check if email is in developer list
  if (DEVELOPER_EMAILS.includes(email.toLowerCase())) {
    return true;
  }
  
  // Check if email matches developer pattern (e.g., ends with @otakon.app)
  if (email.toLowerCase().endsWith('@otakon.app')) {
    return true;
  }
  
  // Check if email contains 'dev' or 'developer' (case insensitive)
  if (email.toLowerCase().includes('dev') || email.toLowerCase().includes('developer')) {
    return true;
  }
  
  return false;
};

export const isDevelopmentEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'development' || import.meta.env.DEV;
};

export const canAccessDeveloperFeatures = (email?: string): boolean => {
  // Check if developer mode was activated via password authentication
  const isDeveloperModeActive = localStorage.getItem('otakon_developer_mode') === 'true';
  
  if (isDeveloperModeActive) {
    console.log('🔧 Developer mode active - allowing developer features');
    return true;
  }
  
  // Fallback: Check if email is in developer list (for production)
  return isDeveloperAccount(email);
};
