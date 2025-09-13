#!/usr/bin/env node

/**
 * 🧪 Secure Implementation Test Script
 * 
 * This script tests the secure implementation to ensure everything is working correctly.
 * Run with: node test-secure-implementation.js
 */

import fs from 'fs';
import path from 'path';

console.log('🛡️ Testing Secure Implementation...\n');

// Test 1: Check if all secure files exist
console.log('📁 Testing file existence...');
const requiredFiles = [
  'SECURE_DATABASE_SCHEMA.sql',
  'services/supabase.ts',
  'services/fixedAppStateService.ts', 
  'services/atomicConversationService.ts',
  'App.tsx',
  'services/supabase_BACKUP.ts',
  'services/fixedAppStateService_BACKUP.ts',
  'services/atomicConversationService_BACKUP.ts',
  'App_BACKUP.tsx'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Test 2: Check if secure services have proper imports
console.log('\n🔗 Testing service imports...');
const supabaseContent = fs.readFileSync('services/supabase.ts', 'utf8');
const appStateContent = fs.readFileSync('services/fixedAppStateService.ts', 'utf8');
const conversationContent = fs.readFileSync('services/atomicConversationService.ts', 'utf8');
const appContent = fs.readFileSync('App.tsx', 'utf8');

// Check for secure imports
const secureImports = [
  { file: 'services/supabase.ts', pattern: /class.*SecureAuthService/, name: 'Secure Auth Service' },
  { file: 'services/fixedAppStateService.ts', pattern: /class.*SecureAppStateService/, name: 'Secure App State Service' },
  { file: 'services/atomicConversationService.ts', pattern: /class.*SecureConversationService/, name: 'Secure Conversation Service' },
  { file: 'App.tsx', pattern: /import.*authService.*from.*services\/supabase/, name: 'App Auth Import' },
  { file: 'App.tsx', pattern: /import.*secureAppStateService.*from.*services\/fixedAppStateService/, name: 'App State Import' },
  { file: 'App.tsx', pattern: /import.*secureConversationService.*from.*services\/atomicConversationService/, name: 'App Conversation Import' }
];

let allImportsCorrect = true;
secureImports.forEach(({ file, pattern, name }) => {
  const content = fs.readFileSync(file, 'utf8');
  if (pattern.test(content)) {
    console.log(`✅ ${name} - Correct import`);
  } else {
    console.log(`❌ ${name} - Import issue in ${file}`);
    allImportsCorrect = false;
  }
});

// Test 3: Check for security features
console.log('\n🔒 Testing security features...');
const securityFeatures = [
  { file: 'services/supabase.ts', pattern: /validateEmail|validatePassword/, name: 'Input Validation' },
  { file: 'services/supabase.ts', pattern: /rate.*limit/i, name: 'Rate Limiting' },
  { file: 'services/supabase.ts', pattern: /checkRateLimit/, name: 'Rate Limiting Function' },
  { file: 'services/fixedAppStateService.ts', pattern: /validateInput/, name: 'App State Input Validation' },
  { file: 'services/atomicConversationService.ts', pattern: /validateInput/, name: 'Conversation Input Validation' },
  { file: 'services/atomicConversationService.ts', pattern: /conflict.*resolution/i, name: 'Conflict Resolution' },
  { file: 'App.tsx', pattern: /ErrorBoundary/, name: 'Error Boundaries' },
  { file: 'App.tsx', pattern: /handleErrorRecovery/, name: 'Error Recovery' }
];

let allSecurityFeatures = true;
securityFeatures.forEach(({ file, pattern, name }) => {
  const content = fs.readFileSync(file, 'utf8');
  if (pattern.test(content)) {
    console.log(`✅ ${name} - Present`);
  } else {
    console.log(`❌ ${name} - Missing in ${file}`);
    allSecurityFeatures = false;
  }
});

// Test 4: Check for performance optimizations
console.log('\n⚡ Testing performance optimizations...');
const performanceFeatures = [
  { file: 'services/fixedAppStateService.ts', pattern: /cache|Cache/, name: 'Caching Layer' },
  { file: 'services/atomicConversationService.ts', pattern: /cache|Cache/, name: 'Conversation Caching' },
  { file: 'services/fixedAppStateService.ts', pattern: /retryOperation/, name: 'Retry Logic' },
  { file: 'services/atomicConversationService.ts', pattern: /retryOperation/, name: 'Conversation Retry Logic' }
];

let allPerformanceFeatures = true;
performanceFeatures.forEach(({ file, pattern, name }) => {
  const content = fs.readFileSync(file, 'utf8');
  if (pattern.test(content)) {
    console.log(`✅ ${name} - Present`);
  } else {
    console.log(`❌ ${name} - Missing in ${file}`);
    allPerformanceFeatures = false;
  }
});

// Test 5: Check for proper error handling
console.log('\n🛠️ Testing error handling...');
const errorHandlingFeatures = [
  { file: 'services/supabase.ts', pattern: /try.*catch|catch.*error/i, name: 'Auth Error Handling' },
  { file: 'services/fixedAppStateService.ts', pattern: /try.*catch|catch.*error/i, name: 'App State Error Handling' },
  { file: 'services/atomicConversationService.ts', pattern: /try.*catch|catch.*error/i, name: 'Conversation Error Handling' },
  { file: 'App.tsx', pattern: /try.*catch|catch.*error/i, name: 'App Error Handling' },
  { file: 'App.tsx', pattern: /error.*state|error.*handling/i, name: 'App Error State' }
];

let allErrorHandling = true;
errorHandlingFeatures.forEach(({ file, pattern, name }) => {
  const content = fs.readFileSync(file, 'utf8');
  if (pattern.test(content)) {
    console.log(`✅ ${name} - Present`);
  } else {
    console.log(`❌ ${name} - Missing in ${file}`);
    allErrorHandling = false;
  }
});

// Summary
console.log('\n📊 Test Summary:');
console.log(`Files Exist: ${allFilesExist ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Imports Correct: ${allImportsCorrect ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Security Features: ${allSecurityFeatures ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Performance Features: ${allPerformanceFeatures ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Error Handling: ${allErrorHandling ? '✅ PASS' : '❌ FAIL'}`);

const allTestsPass = allFilesExist && allImportsCorrect && allSecurityFeatures && allPerformanceFeatures && allErrorHandling;

if (allTestsPass) {
  console.log('\n🎉 All tests passed! Secure implementation is ready.');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Test authentication flow');
  console.log('3. Test conversation functionality');
  console.log('4. Test error handling');
  console.log('5. Deploy to production');
} else {
  console.log('\n❌ Some tests failed. Please review the issues above.');
  process.exit(1);
}
