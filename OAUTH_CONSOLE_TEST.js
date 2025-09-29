// ========================================
// OAUTH CONSOLE TEST - COPY & PASTE VERSION
// ========================================
// Copy and paste this entire block into your browser console

(function() {
  console.log('🔧 OAuth Debug Functions Loading...');
  
  // Test function to debug OAuth issues
  window.testOAuthConfiguration = async function() {
    console.log('🧪 Testing OAuth configuration...');
    
    try {
      // Test 1: Check current URL and OAuth parameters
      console.log('Test 1: Current URL analysis');
      console.log('Current URL:', window.location.href);
      console.log('Pathname:', window.location.pathname);
      console.log('Search params:', window.location.search);
      console.log('Hash:', window.location.hash);
      
      // Test 2: Check if we're in an OAuth callback
      console.log('Test 2: OAuth callback detection');
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || 
                           hashParams.has('access_token') || hashParams.has('error');
      
      console.log('Has OAuth params:', hasOAuthParams);
      console.log('URL params:', Object.fromEntries(urlParams.entries()));
      console.log('Hash params:', Object.fromEntries(hashParams.entries()));
      
      // Test 3: Check for OAuth errors
      console.log('Test 3: OAuth error detection');
      const error = urlParams.get('error') || hashParams.get('error');
      if (error) {
        console.error('❌ OAuth error found:', error);
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        if (errorDescription) {
          console.error('Error description:', errorDescription);
        }
      } else {
        console.log('✅ No OAuth errors found');
      }
      
      // Test 4: Check redirect URL
      console.log('Test 4: Redirect URL analysis');
      console.log('Expected redirect URL:', `${window.location.origin}/auth/callback`);
      console.log('Current path matches expected:', window.location.pathname === '/auth/callback');
      
      console.log('✅ OAuth configuration test completed');
      
    } catch (error) {
      console.error('❌ OAuth test failed:', error);
    }
  };
  
  // Test function to check OAuth callback handling
  window.testOAuthCallbackHandling = async function() {
    console.log('🧪 Testing OAuth callback handling...');
    
    try {
      // Check if we're in a callback
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || 
                           hashParams.has('access_token') || hashParams.has('error');
      
      if (!hasOAuthParams) {
        console.log('ℹ️ Not in OAuth callback - navigate to /auth/callback to test');
        return;
      }
      
      console.log('🔐 OAuth callback detected, testing handling...');
      
      // Try to find Supabase client
      const supabase = window.supabase || window.__supabase || window.supabaseClient;
      
      if (!supabase) {
        console.error('❌ Supabase client not found on window object');
        console.log('Available window properties containing "supabase":', 
          Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
        return;
      }
      
      console.log('✅ Supabase client found');
      
      // Test session retrieval
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          return;
        }
        
        if (session) {
          console.log('✅ Session found:', session);
          console.log('User:', session.user);
        } else {
          console.log('ℹ️ No session found, checking user...');
          
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('❌ User error:', userError);
            return;
          }
          
          if (user) {
            console.log('✅ User found:', user);
          } else {
            console.log('❌ No user found');
          }
        }
      } catch (supabaseError) {
        console.error('❌ Supabase call failed:', supabaseError);
      }
      
    } catch (error) {
      console.error('❌ OAuth callback test failed:', error);
    }
  };
  
  // Simple OAuth test without Supabase dependency
  window.testOAuthURL = function() {
    console.log('🧪 Testing OAuth URL structure...');
    
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    console.log('URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Hash params:', Object.fromEntries(hashParams.entries()));
    
    const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || 
                         hashParams.has('access_token') || hashParams.has('error');
    
    console.log('Has OAuth params:', hasOAuthParams);
    
    if (hasOAuthParams) {
      console.log('✅ OAuth callback detected');
    } else {
      console.log('ℹ️ Not an OAuth callback');
    }
  };
  
  // Test Google OAuth initiation
  window.testGoogleOAuth = function() {
    console.log('🧪 Testing Google OAuth initiation...');
    
    // Check if we can find the auth service
    const authService = window.authService || window.__authService;
    
    if (!authService) {
      console.error('❌ Auth service not found on window object');
      console.log('Available window properties containing "auth":', 
        Object.keys(window).filter(k => k.toLowerCase().includes('auth')));
      return;
    }
    
    console.log('✅ Auth service found');
    console.log('Available methods:', Object.getOwnPropertyNames(authService));
    
    if (typeof authService.signInWithGoogle === 'function') {
      console.log('✅ signInWithGoogle method found');
      console.log('To test: authService.signInWithGoogle()');
    } else {
      console.log('❌ signInWithGoogle method not found');
    }
  };
  
  // Usage instructions
  console.log('🔧 OAuth Debug Functions Loaded!');
  console.log('Available functions:');
  console.log('- testOAuthConfiguration()');
  console.log('- testOAuthCallbackHandling()');
  console.log('- testOAuthURL()');
  console.log('- testGoogleOAuth()');
  console.log('');
  console.log('Run any of these functions to test OAuth functionality.');
  console.log('Example: testOAuthConfiguration()');
  
})();
