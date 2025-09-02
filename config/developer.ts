// Developer account configuration
// Only users with these email addresses can access developer features
// 
// To add a developer account:
// 1. Add the email address to the DEVELOPER_EMAILS array below
// 2. OR use an email that ends with @otakon.app
// 3. OR use an email that contains 'dev' or 'developer' (case insensitive)
// 4. OR run the app in development mode (NODE_ENV=development or import.meta.env.DEV)

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
  // Developer features are only available in development environment
  // OR for developer accounts in any environment
  return isDevelopmentEnvironment() || isDeveloperAccount(email);
};
