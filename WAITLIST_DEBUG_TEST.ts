// ========================================
// WAITLIST DEBUG TEST
// ========================================
// Add this to your browser console to test waitlist functionality

import { supabase } from './services/supabase';

// Test function to debug waitlist issues
export async function testWaitlistAccess() {
  console.log('🧪 Testing waitlist access...');
  
  try {
    // Test 1: Check if we can access the table at all
    console.log('Test 1: Basic table access');
    const { data: testData, error: testError } = await supabase
      .from('waitlist')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Basic table access failed:', testError);
      return;
    }
    console.log('✅ Basic table access works');
    
    // Test 2: Try to insert a test record
    console.log('Test 2: Insert test record');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: testEmail,
        source: 'debug_test',
        status: 'pending'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    console.log('✅ Insert works:', insertData);
    
    // Test 3: Try to check for existing email
    console.log('Test 3: Check existing email');
    const { data: checkData, error: checkError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', testEmail)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Check existing email failed:', checkError);
      return;
    }
    console.log('✅ Check existing email works:', checkData);
    
    // Test 4: Clean up test record
    console.log('Test 4: Cleanup test record');
    const { error: deleteError } = await supabase
      .from('waitlist')
      .delete()
      .eq('email', testEmail);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
      return;
    }
    console.log('✅ Cleanup works');
    
    console.log('🎉 All waitlist tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test function to check Supabase client configuration
export function testSupabaseConfig() {
  console.log('🔧 Testing Supabase configuration...');
  
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;
  
  console.log('URL exists:', !!url);
  console.log('Key exists:', !!key);
  console.log('URL prefix:', url?.substring(0, 30) + '...');
  console.log('Key prefix:', key?.substring(0, 20) + '...');
  
  if (!url || !key) {
    console.error('❌ Missing environment variables!');
    console.log('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY in your .env.local file');
  } else {
    console.log('✅ Environment variables look good');
  }
}

// Usage:
// testSupabaseConfig();
// testWaitlistAccess();
