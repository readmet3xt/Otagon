/**
 * Centralized logging utility to prevent console flooding
 * Provides consistent logging behavior across the application
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  // Specialized logging methods for common patterns
  websocket(message: string, ...args: any[]): void {
    if (this.isDevelopment && this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[WEBSOCKET] ${message}`, ...args);
    }
  }

  security(message: string, ...args: any[]): void {
    if (this.isDevelopment && this.shouldLog(LogLevel.WARN)) {
      console.warn(`[SECURITY] ${message}`, ...args);
    }
  }

  performance(message: string, ...args: any[]): void {
    if (this.isDevelopment && this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[PERFORMANCE] ${message}`, ...args);
    }
  }

  // Method to temporarily enable verbose logging for debugging
  enableVerboseLogging(): void {
    this.logLevel = LogLevel.DEBUG;
    console.log('[LOGGER] Verbose logging enabled');
  }

  // Method to disable most logging for production
  enableProductionLogging(): void {
    this.logLevel = LogLevel.ERROR;
    console.log('[LOGGER] Production logging enabled (errors only)');
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience methods
export const log = {
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  websocket: (message: string, ...args: any[]) => logger.websocket(message, ...args),
  security: (message: string, ...args: any[]) => logger.security(message, ...args),
  performance: (message: string, ...args: any[]) => logger.performance(message, ...args),
  enableVerbose: () => logger.enableVerboseLogging(),
  enableProduction: () => logger.enableProductionLogging()
};

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
  (window as any).log = log;
}
