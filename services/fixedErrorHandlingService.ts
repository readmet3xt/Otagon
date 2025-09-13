// ========================================
// 🚀 FIXED ERROR HANDLING SERVICE
// ========================================
// This fixes all error handling issues with:
// - Comprehensive error categorization
// - Retry logic for transient errors
// - User-friendly error messages
// - Error reporting and analytics

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  additionalData?: any;
}

export interface ErrorInfo {
  type: 'auth' | 'network' | 'database' | 'validation' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  retryable: boolean;
  context: ErrorContext;
  timestamp: number;
  stack?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface ErrorHandlingService {
  handleError(error: any, context: ErrorContext): Promise<void>;
  handleAuthError(error: any, context: ErrorContext): Promise<void>;
  handleNetworkError(error: any, context: ErrorContext): Promise<void>;
  handleDatabaseError(error: any, context: ErrorContext): Promise<void>;
  handleValidationError(error: any, context: ErrorContext): Promise<void>;
  retryOperation<T>(operation: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
  getUserFriendlyMessage(error: any): string;
  reportError(errorInfo: ErrorInfo): Promise<void>;
  logError(errorInfo: ErrorInfo): void;
}

class FixedErrorHandlingService implements ErrorHandlingService {
  private static instance: FixedErrorHandlingService;
  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 100;
  private reportingEnabled = true;

  static getInstance(): FixedErrorHandlingService {
    if (!FixedErrorHandlingService.instance) {
      FixedErrorHandlingService.instance = new FixedErrorHandlingService();
    }
    return FixedErrorHandlingService.instance;
  }

  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`🚨 [${timestamp}] ${message}`, data || '');
  }

  private error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`🚨 [${timestamp}] ERROR: ${message}`, error || '');
  }

  private categorizeError(error: any): { type: ErrorInfo['type']; severity: ErrorInfo['severity'] } {
    // Auth errors
    if (error?.message?.includes('auth') || 
        error?.message?.includes('unauthorized') || 
        error?.message?.includes('forbidden') ||
        error?.code === 'PGRST301' ||
        error?.status === 401 ||
        error?.status === 403) {
      return { type: 'auth', severity: 'high' };
    }

    // Network errors
    if (error?.message?.includes('network') || 
        error?.message?.includes('fetch') || 
        error?.message?.includes('timeout') ||
        error?.code === 'NETWORK_ERROR' ||
        error?.name === 'NetworkError') {
      return { type: 'network', severity: 'medium' };
    }

    // Database errors
    if (error?.message?.includes('database') || 
        error?.message?.includes('sql') || 
        error?.message?.includes('constraint') ||
        error?.code?.startsWith('PGRST') ||
        error?.code?.startsWith('23505') ||
        error?.code?.startsWith('23503')) {
      return { type: 'database', severity: 'high' };
    }

    // Validation errors
    if (error?.message?.includes('validation') || 
        error?.message?.includes('invalid') || 
        error?.message?.includes('required') ||
        error?.name === 'ValidationError') {
      return { type: 'validation', severity: 'medium' };
    }

    // Default to unknown
    return { type: 'unknown', severity: 'medium' };
  }

  private isRetryableError(error: any): boolean {
    const { type, severity } = this.categorizeError(error);
    
    // Network errors are usually retryable
    if (type === 'network') return true;
    
    // Database connection errors are retryable
    if (type === 'database' && error?.message?.includes('connection')) return true;
    
    // High severity errors are usually not retryable
    if (severity === 'high' || severity === 'critical') return false;
    
    // Check for specific retryable error codes
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'ECONNRESET', 'ENOTFOUND'];
    return retryableCodes.some(code => error?.code === code || error?.message?.includes(code));
  }

  private getUserFriendlyMessageInternal(error: any): string {
    const { type, severity } = this.categorizeError(error);

    switch (type) {
      case 'auth':
        if (error?.status === 401) {
          return 'Please sign in to continue.';
        }
        if (error?.status === 403) {
          return 'You don\'t have permission to perform this action.';
        }
        return 'There was an authentication error. Please try signing in again.';

      case 'network':
        if (error?.message?.includes('timeout')) {
          return 'The request timed out. Please check your internet connection and try again.';
        }
        if (error?.message?.includes('offline')) {
          return 'You appear to be offline. Please check your internet connection.';
        }
        return 'There was a network error. Please check your internet connection and try again.';

      case 'database':
        if (error?.message?.includes('constraint')) {
          return 'The data you entered conflicts with existing information. Please check and try again.';
        }
        if (error?.message?.includes('not found')) {
          return 'The requested information could not be found.';
        }
        return 'There was a database error. Please try again in a moment.';

      case 'validation':
        if (error?.message?.includes('required')) {
          return 'Please fill in all required fields.';
        }
        if (error?.message?.includes('invalid email')) {
          return 'Please enter a valid email address.';
        }
        return 'Please check your input and try again.';

      default:
        if (severity === 'critical') {
          return 'A critical error occurred. Please refresh the page and try again.';
        }
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private createErrorInfo(error: any, context: ErrorContext): ErrorInfo {
    const { type, severity } = this.categorizeError(error);
    
    return {
      type,
      severity,
      message: error?.message || error?.toString() || 'Unknown error',
      userMessage: this.getUserFriendlyMessageInternal(error),
      retryable: this.isRetryableError(error),
      context,
      timestamp: Date.now(),
      stack: error?.stack
    };
  }

  async handleError(error: any, context: ErrorContext): Promise<void> {
    try {
      this.log('Handling error...', { error: error?.message, context });
      
      const errorInfo = this.createErrorInfo(error, context);
      
      // Log the error
      this.logError(errorInfo);
      
      // Report the error
      if (this.reportingEnabled) {
        await this.reportError(errorInfo);
      }
      
      // Handle specific error types
      switch (errorInfo.type) {
        case 'auth':
          await this.handleAuthError(error, context);
          break;
        case 'network':
          await this.handleNetworkError(error, context);
          break;
        case 'database':
          await this.handleDatabaseError(error, context);
          break;
        case 'validation':
          await this.handleValidationError(error, context);
          break;
        default:
          this.log('Unknown error type, using generic handling');
      }
      
    } catch (handlingError) {
      this.error('Failed to handle error', handlingError);
    }
  }

  async handleAuthError(error: any, context: ErrorContext): Promise<void> {
    try {
      this.log('Handling auth error...', { error: error?.message, context });
      
      // Clear invalid sessions
      if (error?.status === 401) {
        this.log('Clearing invalid session due to 401 error');
        // Clear auth state
        localStorage.removeItem('otakonAuthMethod');
        localStorage.removeItem('otakon_developer_mode');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Show user-friendly message
      const userMessage = this.getUserFriendlyMessage(error);
      this.showUserNotification(userMessage, 'error');
      
    } catch (handlingError) {
      this.error('Failed to handle auth error', handlingError);
    }
  }

  async handleNetworkError(error: any, context: ErrorContext): Promise<void> {
    try {
      this.log('Handling network error...', { error: error?.message, context });
      
      // Check if user is offline
      if (!navigator.onLine) {
        this.showUserNotification('You appear to be offline. Please check your internet connection.', 'warning');
        return;
      }
      
      // Show user-friendly message
      const userMessage = this.getUserFriendlyMessage(error);
      this.showUserNotification(userMessage, 'error');
      
    } catch (handlingError) {
      this.error('Failed to handle network error', handlingError);
    }
  }

  async handleDatabaseError(error: any, context: ErrorContext): Promise<void> {
    try {
      this.log('Handling database error...', { error: error?.message, context });
      
      // Show user-friendly message
      const userMessage = this.getUserFriendlyMessage(error);
      this.showUserNotification(userMessage, 'error');
      
      // For critical database errors, suggest refresh
      if (error?.severity === 'critical') {
        this.showUserNotification('A critical error occurred. Please refresh the page and try again.', 'error');
      }
      
    } catch (handlingError) {
      this.error('Failed to handle database error', handlingError);
    }
  }

  async handleValidationError(error: any, context: ErrorContext): Promise<void> {
    try {
      this.log('Handling validation error...', { error: error?.message, context });
      
      // Show user-friendly message
      const userMessage = this.getUserFriendlyMessage(error);
      this.showUserNotification(userMessage, 'warning');
      
    } catch (handlingError) {
      this.error('Failed to handle validation error', handlingError);
    }
  }

  async retryOperation<T>(
    operation: () => Promise<T>, 
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const defaultOptions: RetryOptions = {
      maxAttempts: 3,
      delay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    let lastError: any;
    
    for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
      try {
        this.log(`Retry attempt ${attempt}/${finalOptions.maxAttempts}`);
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's not a retryable error
        if (!this.isRetryableError(error)) {
          this.log('Error is not retryable, stopping retries');
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === finalOptions.maxAttempts) {
          this.log('Max retry attempts reached');
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalOptions.delay * Math.pow(finalOptions.backoffMultiplier, attempt - 1),
          finalOptions.maxDelay
        );
        
        this.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  getUserFriendlyMessage(error: any): string {
    return this.getUserFriendlyMessageInternal(error);
  }

  async reportError(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Add to queue
      this.errorQueue.push(errorInfo);
      
      // Limit queue size
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue.shift();
      }
      
      // Send to analytics/monitoring service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'error', {
          event_category: 'error_handling',
          event_label: errorInfo.type,
          value: 1,
          custom_map: {
            severity: errorInfo.severity,
            operation: errorInfo.context.operation,
            component: errorInfo.context.component
          }
        });
      }
      
      // Send to error reporting service (e.g., Sentry, Bugsnag)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(errorInfo.message), {
          tags: {
            type: errorInfo.type,
            severity: errorInfo.severity,
            operation: errorInfo.context.operation,
            component: errorInfo.context.component
          },
          extra: {
            context: errorInfo.context,
            timestamp: errorInfo.timestamp
          }
        });
      }
      
      this.log('Error reported successfully', { type: errorInfo.type, severity: errorInfo.severity });
      
    } catch (reportingError) {
      this.error('Failed to report error', reportingError);
    }
  }

  logError(errorInfo: ErrorInfo): void {
    const logLevel = errorInfo.severity === 'critical' ? 'error' : 
                    errorInfo.severity === 'high' ? 'error' : 'warn';
    
    const logMessage = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`;
    const logData = {
      severity: errorInfo.severity,
      retryable: errorInfo.retryable,
      context: errorInfo.context,
      timestamp: errorInfo.timestamp
    };
    
    if (logLevel === 'error') {
      console.error(logMessage, logData);
    } else {
      console.warn(logMessage, logData);
    }
  }

  private showUserNotification(message: string, type: 'info' | 'warning' | 'error' | 'success'): void {
    try {
      // Try to use a notification system if available
      if (typeof window !== 'undefined' && (window as any).showNotification) {
        (window as any).showNotification(message, type);
        return;
      }
      
      // Fallback to console
      const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
      console.log(`${emoji} ${message}`);
      
    } catch (error) {
      this.error('Failed to show user notification', error);
    }
  }

  // Public method to get error queue for debugging
  getErrorQueue(): ErrorInfo[] {
    return [...this.errorQueue];
  }

  // Public method to clear error queue
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  // Public method to enable/disable error reporting
  setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }
}

// Export singleton instance
export const fixedErrorHandlingService = FixedErrorHandlingService.getInstance();

// Export types
// Export conflicts resolved - types exported from main service files