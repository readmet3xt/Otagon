// ========================================
// OAUTH DEBUG TEST - BROWSER CONSOLE VERSION
// ========================================
// Copy and paste these functions directly into your browser console

// Test function to debug OAuth issues
async function testOAuthConfiguration() {
  console.log('🧪 Testing OAuth configuration...');
  
  try {
    // Test 1: Check Supabase client configuration
    console.log('Test 1: Supabase client configuration');
    
    // Get Supabase client from window object (if available)
    const supabase = window.supabase || window.__supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found on window object');
      console.log('Available window properties:', Object.keys(window).filter(k => k.includes('supabase')));
      return;
    }
    
    console.log('✅ Supabase client found');
    
    // Test 2: Check current URL and OAuth parameters
    console.log('Test 2: Current URL analysis');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    // Test 3: Check if we're in an OAuth callback
    console.log('Test 3: OAuth callback detection');
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || 
                         hashParams.has('access_token') || hashParams.has('error');
    
    console.log('Has OAuth params:', hasOAuthParams);
    console.log('URL params:', Object.fromEntries(urlParams.entries()));
    console.log('Hash params:', Object.fromEntries(hashParams.entries()));
    
    // Test 4: Test Google OAuth initiation
    console.log('Test 4: Google OAuth initiation test');
    console.log('This will open Google OAuth in a new window...');
    
    // Don't actually call this in the test, just show what would happen
    console.log('Would call: supabase.auth.signInWithOAuth({...})');
    console.log('Redirect URL would be:', `${window.location.origin}/auth/callback`);
    
    console.log('✅ OAuth configuration test completed');
    
  } catch (error) {
    console.error('❌ OAuth test failed:', error);
  }
}

// Test function to check OAuth callback handling
async function testOAuthCallbackHandling() {
  console.log('🧪 Testing OAuth callback handling...');
  
  try {
    // Get Supabase client from window object
    const supabase = window.supabase || window.__supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found on window object');
      return;
    }
    
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
    
    // Test session retrieval
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
    
  } catch (error) {
    console.error('❌ OAuth callback test failed:', error);
  }
}

// Simple OAuth test without Supabase dependency
function testOAuthURL() {
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
}

// Usage instructions:
console.log('🔧 OAuth Debug Functions Loaded!');
console.log('Available functions:');
console.log('- testOAuthConfiguration()');
console.log('- testOAuthCallbackHandling()');
console.log('- testOAuthURL()');
console.log('');
console.log('Run any of these functions to test OAuth functionality.');
