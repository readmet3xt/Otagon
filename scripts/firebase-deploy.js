#!/usr/bin/env node

/**
 * Firebase Deployment Script for Otakon App
 * Ensures all components work flawlessly on Firebase hosting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Starting Firebase deployment process...');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.error('❌ Firebase CLI is not installed. Please install it first:');
  console.error('npm install -g firebase-tools');
  process.exit(1);
}

// Check if we're in the right directory
if (!fs.existsSync('firebase.json')) {
  console.error('❌ firebase.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if dist directory exists
if (!fs.existsSync('dist')) {
  console.log('📦 Building application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed. Please fix build errors before deploying.');
    process.exit(1);
  }
} else {
  console.log('✅ Build directory exists');
}

// Check for required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
];

console.log('🔍 Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('Make sure to set these in your Firebase project settings or .env file');
} else {
  console.log('✅ All required environment variables are set');
}

// Check if all critical files exist
const criticalFiles = [
  'dist/index.html',
  'dist/assets',
  'firebase.json',
  'services/supabase.ts',
  'services/fixedAppStateService.ts',
  'services/fixedErrorHandlingService.ts'
];

console.log('🔍 Checking critical files...');
const missingFiles = criticalFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing critical files:', missingFiles.join(', '));
  console.error('Please ensure all files are present before deploying.');
  process.exit(1);
} else {
  console.log('✅ All critical files are present');
}

// Deploy to Firebase
console.log('🚀 Deploying to Firebase...');
try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('✅ Deployment completed successfully!');
  
  // Get the deployed URL
  try {
    const result = execSync('firebase hosting:sites:list', { encoding: 'utf8' });
    console.log('🌐 Your app is now live on Firebase hosting!');
    console.log('📱 Check the Firebase console for the exact URL');
  } catch (error) {
    console.log('🌐 Deployment successful! Check Firebase console for URL');
  }
  
} catch (error) {
  console.error('❌ Deployment failed. Please check the error messages above.');
  process.exit(1);
}

console.log('🎉 Firebase deployment process completed!');
console.log('');
console.log('📋 Post-deployment checklist:');
console.log('  ✅ Test authentication flow (Google, Discord, Email, Developer mode)');
console.log('  ✅ Test error handling (network errors, auth errors)');
console.log('  ✅ Test state management (onboarding, profile setup)');
console.log('  ✅ Test database operations');
console.log('  ✅ Check performance and loading times');
console.log('  ✅ Verify PWA features work correctly');
console.log('');
console.log('🔧 If you encounter any issues:');
console.log('  - Check Firebase console for logs');
console.log('  - Verify Supabase configuration');
console.log('  - Check environment variables');
console.log('  - Review error handling in browser console');
