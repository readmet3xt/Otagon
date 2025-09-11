#!/usr/bin/env node

/**
 * Console Log Analyzer and Cleaner
 * Helps identify and clean up excessive console logging
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Directories to scan
  scanDirs: ['services', 'components', 'hooks', 'utils'],
  // File extensions to check
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  // Exclude these files/directories
  exclude: ['node_modules', 'dist', 'coverage', 'test', '.git'],
  // Maximum console.log statements per file (warning threshold)
  maxLogsPerFile: 10,
  // Maximum total console statements in project (warning threshold)
  maxTotalLogs: 100
};

class ConsoleLogAnalyzer {
  constructor() {
    this.results = {
      files: [],
      totalLogs: 0,
      warnings: []
    };
  }

  analyze() {
    console.log('🔍 Analyzing console logging across the project...\n');
    
    const projectRoot = process.cwd();
    
    CONFIG.scanDirs.forEach(dir => {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        this.scanDirectory(dirPath);
      }
    });

    this.generateReport();
    this.generateRecommendations();
  }

  scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!CONFIG.exclude.includes(item)) {
          this.scanDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (CONFIG.extensions.includes(ext)) {
          this.analyzeFile(itemPath);
        }
      }
    });
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const consoleLogs = [];
      const consoleWarns = [];
      const consoleErrors = [];
      const consoleInfos = [];
      const consoleDebugs = [];
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes('console.log')) {
          consoleLogs.push({ line: index + 1, content: trimmedLine });
        } else if (trimmedLine.includes('console.warn')) {
          consoleWarns.push({ line: index + 1, content: trimmedLine });
        } else if (trimmedLine.includes('console.error')) {
          consoleErrors.push({ line: index + 1, content: trimmedLine });
        } else if (trimmedLine.includes('console.info')) {
          consoleInfos.push({ line: index + 1, content: trimmedLine });
        } else if (trimmedLine.includes('console.debug')) {
          consoleDebugs.push({ line: index + 1, content: trimmedLine });
        }
      });
      
      const totalConsoleStatements = consoleLogs.length + consoleWarns.length + 
                                   consoleErrors.length + consoleInfos.length + 
                                   consoleDebugs.length;
      
      if (totalConsoleStatements > 0) {
        const relativePath = path.relative(process.cwd(), filePath);
        
        this.results.files.push({
          path: relativePath,
          logs: consoleLogs,
          warns: consoleWarns,
          errors: consoleErrors,
          infos: consoleInfos,
          debugs: consoleDebugs,
          total: totalConsoleStatements
        });
        
        this.results.totalLogs += totalConsoleStatements;
        
        if (totalConsoleStatements > CONFIG.maxLogsPerFile) {
          this.results.warnings.push({
            type: 'excessive_logging',
            file: relativePath,
            count: totalConsoleStatements,
            message: `File has ${totalConsoleStatements} console statements (exceeds ${CONFIG.maxLogsPerFile})`
          });
        }
      }
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error.message);
    }
  }

  generateReport() {
    console.log('📊 CONSOLE LOG ANALYSIS REPORT');
    console.log('=' .repeat(50));
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total files analyzed: ${this.results.files.length}`);
    console.log(`   Total console statements: ${this.results.totalLogs}`);
    console.log(`   Average per file: ${(this.results.totalLogs / this.results.files.length).toFixed(1)}`);
    
    if (this.results.totalLogs > CONFIG.maxTotalLogs) {
      console.log(`   ⚠️  WARNING: Total console statements exceeds recommended limit of ${CONFIG.maxTotalLogs}`);
    }
    
    console.log(`\n📋 TOP FILES BY CONSOLE STATEMENTS:`);
    const sortedFiles = this.results.files
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    
    sortedFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.path} (${file.total} statements)`);
      console.log(`      - console.log: ${file.logs.length}`);
      console.log(`      - console.warn: ${file.warns.length}`);
      console.log(`      - console.error: ${file.errors.length}`);
      console.log(`      - console.info: ${file.infos.length}`);
      console.log(`      - console.debug: ${file.debugs.length}`);
    });
    
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      this.results.warnings.forEach(warning => {
        console.log(`   - ${warning.message}`);
      });
    }
  }

  generateRecommendations() {
    console.log(`\n💡 RECOMMENDATIONS:`);
    console.log('=' .repeat(50));
    
    console.log(`\n1. 🔧 IMPLEMENT CENTRALIZED LOGGING:`);
    console.log(`   - Use the new utils/logger.ts for consistent logging`);
    console.log(`   - Replace console.log with logger.debug() for development-only logs`);
    console.log(`   - Use logger.error() for errors that should always show`);
    
    console.log(`\n2. 🎯 CONDITIONAL LOGGING:`);
    console.log(`   - Wrap development logs with: if (process.env.NODE_ENV === 'development')`);
    console.log(`   - Use import.meta.env.DEV for Vite-based projects`);
    
    console.log(`\n3. 🚀 PRODUCTION OPTIMIZATION:`);
    console.log(`   - Consider using a bundler plugin to strip console statements in production`);
    console.log(`   - Implement log levels (ERROR, WARN, INFO, DEBUG)`);
    
    console.log(`\n4. 🔍 PRIORITY FILES TO CLEAN:`);
    const topFiles = this.results.files
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    topFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.path} (${file.total} statements)`);
    });
    
    console.log(`\n5. 🛠️  QUICK FIXES:`);
    console.log(`   - Run: npm run analyze-console-logs (if script exists)`);
    console.log(`   - Use find/replace to wrap console.log with conditional checks`);
    console.log(`   - Consider using a logging library like winston or pino`);
  }
}

// Run the analyzer
const analyzer = new ConsoleLogAnalyzer();
analyzer.analyze();

export default ConsoleLogAnalyzer;
