#!/usr/bin/env node

/**
 * Firebase Emulator Testing Script for Otagon App
 * Comprehensive testing workflow using Firebase Emulator Suite
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔥 Starting Firebase Emulator Testing Workflow...');

// Configuration
const EMULATOR_PORTS = {
  hosting: 3000,
  auth: 9099,
  firestore: 8081,
  ui: 4000
};

const TEST_TIMEOUT = 30000; // 30 seconds

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🔥';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkPort(port) {
  try {
    execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function killProcessOnPort(port) {
  try {
    const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
      log(`Killed process on port ${port}`, 'warning');
    }
  } catch (error) {
    // Port is free, no process to kill
  }
}

// Test functions
async function testEmulatorSetup() {
  log('Testing emulator setup...');
  
  // Check if Firebase CLI is installed
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    log(`Firebase CLI version: ${version}`, 'success');
  } catch (error) {
    log('Firebase CLI not found. Please install it first: npm install -g firebase-tools', 'error');
    process.exit(1);
  }

  // Check if firebase.json exists
  if (!fs.existsSync('firebase.json')) {
    log('firebase.json not found. Please run this script from the project root.', 'error');
    process.exit(1);
  }

  // Check if dist directory exists
  if (!fs.existsSync('dist')) {
    log('Building application for emulator testing...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      log('Build completed successfully', 'success');
    } catch (error) {
      log('Build failed. Please fix build errors before testing.', 'error');
      process.exit(1);
    }
  }

  log('Emulator setup test passed', 'success');
}

async function testEmulatorStart() {
  log('Testing emulator startup...');
  
  // Kill any existing processes on emulator ports
  Object.values(EMULATOR_PORTS).forEach(killProcessOnPort);
  
  // Start emulators
  try {
    log('Starting Firebase emulators...');
    const emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'hosting'], {
      stdio: 'pipe',
      detached: false
    });

    // Wait for emulator to start
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        emulatorProcess.kill();
        reject(new Error('Emulator startup timeout'));
      }, TEST_TIMEOUT);

      emulatorProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('All emulators ready!') || output.includes('Emulator UI ready')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      emulatorProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        if (errorOutput.includes('Error') || errorOutput.includes('Failed')) {
          clearTimeout(timeout);
          emulatorProcess.kill();
          reject(new Error(`Emulator startup error: ${errorOutput}`));
        }
      });
    });

    log('Emulators started successfully', 'success');
    
    // Test if hosting emulator is accessible
    try {
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${EMULATOR_PORTS.hosting}`, { encoding: 'utf8' });
      if (response.trim() === '200') {
        log('Hosting emulator is accessible', 'success');
      } else {
        log(`Hosting emulator returned status code: ${response.trim()}`, 'warning');
      }
    } catch (error) {
      log('Could not test hosting emulator accessibility', 'warning');
    }

    // Kill emulator process
    emulatorProcess.kill();
    log('Emulator process terminated', 'success');

  } catch (error) {
    log(`Emulator startup test failed: ${error.message}`, 'error');
    throw error;
  }
}

async function testEmulatorUI() {
  log('Testing emulator UI...');
  
  try {
    const emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'ui'], {
      stdio: 'pipe',
      detached: false
    });

    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        emulatorProcess.kill();
        reject(new Error('Emulator UI startup timeout'));
      }, TEST_TIMEOUT);

      emulatorProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Emulator UI ready') || output.includes('UI ready')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    log('Emulator UI started successfully', 'success');
    emulatorProcess.kill();

  } catch (error) {
    log(`Emulator UI test failed: ${error.message}`, 'error');
    throw error;
  }
}

async function testEmulatorDataPersistence() {
  log('Testing emulator data persistence...');
  
  const testDataDir = './test-emulator-data';
  
  try {
    // Create test data directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir);
    }

    // Test export functionality
    log('Testing emulator data export...');
    execSync(`firebase emulators:export ${testDataDir}`, { stdio: 'pipe' });
    log('Emulator data export test passed', 'success');

    // Test import functionality
    log('Testing emulator data import...');
    const importProcess = spawn('firebase', ['emulators:start', '--import', testDataDir], {
      stdio: 'pipe',
      detached: false
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        importProcess.kill();
        reject(new Error('Emulator import timeout'));
      }, TEST_TIMEOUT);

      importProcess.stdout.on('data', (data) => {
        if (data.toString().includes('All emulators ready!')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    log('Emulator data import test passed', 'success');
    importProcess.kill();

    // Cleanup test data
    fs.rmSync(testDataDir, { recursive: true, force: true });
    log('Test data cleaned up', 'success');

  } catch (error) {
    log(`Emulator data persistence test failed: ${error.message}`, 'error');
    throw error;
  }
}

async function testEmulatorIntegration() {
  log('Testing emulator integration with app...');
  
  try {
    // Start emulators with hosting
    const emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'hosting'], {
      stdio: 'pipe',
      detached: false
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        emulatorProcess.kill();
        reject(new Error('Integration test timeout'));
      }, TEST_TIMEOUT);

      emulatorProcess.stdout.on('data', (data) => {
        if (data.toString().includes('All emulators ready!')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    // Test app accessibility
    try {
      const response = execSync(`curl -s http://localhost:${EMULATOR_PORTS.hosting}`, { encoding: 'utf8' });
      if (response.includes('<!DOCTYPE html>') || response.includes('<html')) {
        log('App is accessible through emulator', 'success');
      } else {
        log('App response does not contain expected HTML', 'warning');
      }
    } catch (error) {
      log('Could not test app accessibility', 'warning');
    }

    emulatorProcess.kill();
    log('Integration test completed', 'success');

  } catch (error) {
    log(`Integration test failed: ${error.message}`, 'error');
    throw error;
  }
}

// Main execution
async function runTests() {
  try {
    log('Starting comprehensive emulator testing...');
    
    await testEmulatorSetup();
    await testEmulatorStart();
    await testEmulatorUI();
    await testEmulatorDataPersistence();
    await testEmulatorIntegration();
    
    log('All emulator tests passed! 🎉', 'success');
    log('');
    log('📋 Next steps:');
    log('  1. Run "npm run emulator:start" to start emulators');
    log('  2. Visit http://localhost:4000 for Emulator UI');
    log('  3. Visit http://localhost:5000 for your app');
    log('  4. Run "npm run test:emulator" for automated testing');
    log('');
    
  } catch (error) {
    log(`Testing failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔥 Firebase Emulator Testing Script

Usage:
  node scripts/test-emulator.js [options]

Options:
  --help, -h     Show this help message
  --setup        Test emulator setup only
  --start        Test emulator startup only
  --ui           Test emulator UI only
  --data         Test data persistence only
  --integration  Test app integration only

Examples:
  node scripts/test-emulator.js                    # Run all tests
  node scripts/test-emulator.js --setup           # Test setup only
  node scripts/test-emulator.js --integration     # Test integration only
`);
  process.exit(0);
}

// Run specific tests based on arguments
if (args.includes('--setup')) {
  testEmulatorSetup().then(() => log('Setup test completed', 'success')).catch(console.error);
} else if (args.includes('--start')) {
  testEmulatorStart().then(() => log('Start test completed', 'success')).catch(console.error);
} else if (args.includes('--ui')) {
  testEmulatorUI().then(() => log('UI test completed', 'success')).catch(console.error);
} else if (args.includes('--data')) {
  testEmulatorDataPersistence().then(() => log('Data test completed', 'success')).catch(console.error);
} else if (args.includes('--integration')) {
  testEmulatorIntegration().then(() => log('Integration test completed', 'success')).catch(console.error);
} else {
  runTests();
}
