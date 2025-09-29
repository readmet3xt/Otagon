// ========================================
// OAUTH APP TEST - FOR TESTING IN YOUR APP
// ========================================
// Add this to your app's console or create a test button

// Test function to check OAuth configuration in your app
function testAppOAuthConfig() {
  console.log('🧪 Testing OAuth configuration in your app...');
  
  try {
    // Check if we're in the right environment
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Check if React app is loaded
    const reactRoot = document.getElementById('root');
    if (reactRoot) {
      console.log('✅ React app root found');
    } else {
      console.log('❌ React app root not found');
    }
    
    // Check for any global variables that might contain Supabase
    const globalVars = Object.keys(window).filter(key => 
      key.toLowerCase().includes('supabase') || 
      key.toLowerCase().includes('auth') ||
      key.toLowerCase().includes('oauth')
    );
    
    console.log('Global variables related to auth:', globalVars);
    
    // Check if we can find any auth-related elements
    const authButtons = document.querySelectorAll('[class*="auth"], [class*="login"], [class*="google"], [class*="oauth"]');
    console.log('Auth-related elements found:', authButtons.length);
    
    // Check for any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
    if (errorElements.length > 0) {
      console.log('Error elements found:', errorElements);
    }
    
    console.log('✅ App OAuth configuration test completed');
    
  } catch (error) {
    console.error('❌ App OAuth test failed:', error);
  }
}

// Test function to simulate OAuth flow
function testOAuthFlow() {
  console.log('🧪 Testing OAuth flow simulation...');
  
  try {
    // Check current state
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Simulate what should happen during OAuth
    console.log('Expected OAuth flow:');
    console.log('1. User clicks "Sign in with Google"');
    console.log('2. Redirects to Google OAuth');
    console.log('3. User authenticates with Google');
    console.log('4. Google redirects to Supabase callback');
    console.log('5. Supabase processes OAuth');
    console.log('6. Supabase redirects to: ' + window.location.origin + '/auth/callback');
    console.log('7. App handles callback and redirects to main app');
    
    // Check if the callback route exists
    console.log('Testing callback route...');
    const callbackUrl = window.location.origin + '/auth/callback';
    console.log('Callback URL:', callbackUrl);
    
    // Try to navigate to callback route (this will test if the route exists)
    console.log('Attempting to navigate to callback route...');
    window.location.href = callbackUrl;
    
  } catch (error) {
    console.error('❌ OAuth flow test failed:', error);
  }
}

// Test function to check for OAuth errors
function checkOAuthErrors() {
  console.log('🧪 Checking for OAuth errors...');
  
  try {
    // Check URL for OAuth errors
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const error = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    
    if (error) {
      console.error('❌ OAuth error found in URL:', error);
      if (errorDescription) {
        console.error('Error description:', errorDescription);
      }
    } else {
      console.log('✅ No OAuth errors found in URL');
    }
    
    // Check console for any auth-related errors
    console.log('Check the console above for any auth-related error messages');
    
  } catch (error) {
    console.error('❌ OAuth error check failed:', error);
  }
}

// Usage instructions
console.log('🔧 OAuth App Test Functions Loaded!');
console.log('Available functions:');
console.log('- testAppOAuthConfig()');
console.log('- testOAuthFlow()');
console.log('- checkOAuthErrors()');
console.log('');
console.log('Run these functions to test OAuth in your app context.');
