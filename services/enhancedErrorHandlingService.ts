// ========================================
// 🚀 ENHANCED ERROR HANDLING SERVICE
// ========================================
// Builds on existing fixedErrorHandlingService.ts to add:
// - Chat-specific error handling
// - TTS error handling and reporting
// - Enhanced user-friendly messages
// - Error recovery actions

import { fixedErrorHandlingService, ErrorContext, ErrorInfo, RetryOptions } from './fixedErrorHandlingService';

export interface ChatErrorContext extends ErrorContext {
  conversationId?: string;
  messageId?: string;
  isHandsFreeMode?: boolean;
}

export interface TTSErrorContext extends ErrorContext {
  text?: string;
  voiceURI?: string;
  speechRate?: number;
}

export interface ErrorRecoveryAction {
  action: 'retry' | 'refresh' | 'login' | 'contact_support' | 'check_settings' | 'none';
  buttonText: string;
  description: string;
  onClick?: () => void;
}

export interface EnhancedErrorInfo {
  type: 'auth' | 'network' | 'database' | 'validation' | 'unknown' | 'ai' | 'tts' | 'quota';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  retryable: boolean;
  context: ErrorContext;
  timestamp: number;
  stack?: string;
  recoveryAction?: ErrorRecoveryAction;
  ttsSafe?: boolean; // Whether this error is safe to speak via TTS
}

class EnhancedErrorHandlingService {
  private static instance: EnhancedErrorHandlingService;
  private baseService = fixedErrorHandlingService;

  private constructor() {
    // Use the singleton instance from fixedErrorHandlingService
  }

  static getInstance(): EnhancedErrorHandlingService {
    if (!this.instance) {
      this.instance = new EnhancedErrorHandlingService();
    }
    return this.instance;
  }

  /**
   * Enhanced error categorization for chat and TTS contexts
   */
  categorizeError(error: any, context: ChatErrorContext | TTSErrorContext): {
    type: 'network' | 'auth' | 'quota' | 'validation' | 'ai' | 'tts' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userAction: 'retry' | 'refresh' | 'login' | 'contact_support' | 'check_settings' | 'none';
    ttsSafe: boolean;
  } {
    const errorMessage = error?.message || error?.toString() || '';
    const errorStatus = error?.status || error?.httpError?.status;

    // TTS-specific errors
    if (context.operation?.includes('tts') || context.operation?.includes('speech')) {
      return this.categorizeTTSError(error, context as TTSErrorContext);
    }

    // AI/API errors
    if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_EXCEEDED')) {
      return {
        type: 'quota',
        severity: 'high',
        userAction: 'contact_support',
        ttsSafe: true
      };
    }

    if (errorStatus === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
      return {
        type: 'ai',
        severity: 'medium',
        userAction: 'retry',
        ttsSafe: true
      };
    }

    if (errorStatus === 0 || errorMessage.includes('status code: 0')) {
      return {
        type: 'network',
        severity: 'medium',
        userAction: 'retry',
        ttsSafe: true
      };
    }

    if (errorStatus === 401 || errorStatus === 403) {
      return {
        type: 'auth',
        severity: 'high',
        userAction: 'login',
        ttsSafe: false
      };
    }

    if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      return {
        type: 'ai',
        severity: 'medium',
        userAction: 'retry',
        ttsSafe: true
      };
    }

    // Default categorization
    return {
      type: 'unknown',
      severity: 'medium',
      userAction: 'retry',
      ttsSafe: false
    };
  }

  /**
   * Categorize TTS-specific errors
   */
  private categorizeTTSError(error: any, context: TTSErrorContext): {
    type: 'tts';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userAction: 'retry' | 'refresh' | 'login' | 'contact_support' | 'check_settings' | 'none';
    ttsSafe: boolean;
  } {
    const errorMessage = error?.message || error?.toString() || '';

    if (errorMessage.includes('not available') || errorMessage.includes('not supported')) {
      return {
        type: 'tts',
        severity: 'medium',
        userAction: 'check_settings',
        ttsSafe: false
      };
    }

    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      return {
        type: 'tts',
        severity: 'medium',
        userAction: 'check_settings',
        ttsSafe: false
      };
    }

    if (errorMessage.includes('voice') || errorMessage.includes('utterance')) {
      return {
        type: 'tts',
        severity: 'low',
        userAction: 'retry',
        ttsSafe: false
      };
    }

    if (errorMessage.includes('Pro feature')) {
      return {
        type: 'tts',
        severity: 'low',
        userAction: 'none',
        ttsSafe: true
      };
    }

    return {
      type: 'tts',
      severity: 'low',
      userAction: 'retry',
      ttsSafe: false
    };
  }

  /**
   * Get user-friendly error message for chat context
   */
  getUserFriendlyMessage(error: any, context: ChatErrorContext | TTSErrorContext): string {
    const { type, severity, ttsSafe } = this.categorizeError(error, context);

    switch (type) {
      case 'network':
        return this.getNetworkErrorMessage(error);
      case 'auth':
        return this.getAuthErrorMessage(error);
      case 'quota':
        return this.getQuotaErrorMessage(error);
      case 'ai':
        return this.getAIErrorMessage(error);
      case 'tts':
        return this.getTTSErrorMessage(error);
      default:
        return this.getGenericErrorMessage(severity);
    }
  }

  /**
   * Get error recovery action
   */
  getErrorRecoveryAction(error: any, context: ChatErrorContext | TTSErrorContext): ErrorRecoveryAction | null {
    const { type, userAction } = this.categorizeError(error, context);

    switch (userAction) {
      case 'retry':
        return {
          action: 'retry',
          buttonText: 'Try Again',
          description: 'Retry the operation',
          onClick: () => this.retryLastOperation()
        };
      case 'refresh':
        return {
          action: 'refresh',
          buttonText: 'Refresh Page',
          description: 'Reload the page to resolve the issue',
          onClick: () => window.location.reload()
        };
      case 'login':
        return {
          action: 'login',
          buttonText: 'Sign In',
          description: 'Sign in to continue',
          onClick: () => this.redirectToLogin()
        };
      case 'check_settings':
        return {
          action: 'check_settings',
          buttonText: 'Check Settings',
          description: 'Review your browser settings',
          onClick: () => this.showSettingsHelp()
        };
      case 'contact_support':
        return {
          action: 'contact_support',
          buttonText: 'Contact Support',
          description: 'Get help from our support team',
          onClick: () => this.openSupport()
        };
      default:
        return null;
    }
  }

  /**
   * Enhanced error message methods
   */
  private getNetworkErrorMessage(error: any): string {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (error?.httpError?.status === 0 || errorMessage.includes('status code: 0')) {
      return "I couldn't reach the network. This can happen if your screen is locked and the device is saving power. Waking the screen and trying again usually helps.";
    }
    
    if (errorMessage.includes('timeout')) {
      return "The request timed out. Please check your internet connection and try again.";
    }
    
    if (errorMessage.includes('offline')) {
      return "You appear to be offline. Please check your internet connection.";
    }
    
    return "There was a network error. Please check your internet connection and try again.";
  }

  private getAuthErrorMessage(error: any): string {
    const status = error?.status || error?.httpError?.status;
    
    if (status === 401) {
      return "Please sign in to continue using Otakon.";
    }
    
    if (status === 403) {
      return "You don't have permission to perform this action. Please check your account status.";
    }
    
    return "There was an authentication error. Please try signing in again.";
  }

  private getQuotaErrorMessage(error: any): string {
    return "You've reached your usage limit for this feature. Please try again later or consider upgrading to Pro for higher limits.";
  }

  private getAIErrorMessage(error: any): string {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (error?.httpError?.status === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
      return "The AI is currently experiencing high traffic and is temporarily unavailable. Please wait a moment and try again. This usually resolves within a few minutes.";
    }
    
    if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      return "The AI response was malformed. Please try asking your question again.";
    }
    
    return "The AI encountered an error processing your request. Please try again.";
  }

  private getTTSErrorMessage(error: any): string {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('not available') || errorMessage.includes('not supported')) {
      return "🔊 Text-to-Speech is not available on this browser. Please use a modern browser like Chrome, Firefox, or Safari for voice features.";
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      return "🔊 Audio permission is required for voice features. Please allow audio in your browser settings and try again.";
    }
    
    if (errorMessage.includes('voice') || errorMessage.includes('utterance')) {
      return "🔊 Voice playback failed. This might be due to audio permissions or voice availability. Try refreshing the page or checking your browser's audio settings.";
    }
    
    if (errorMessage.includes('Pro feature')) {
      return "🔊 Hands-Free mode is a Pro feature. Upgrade to Pro to use voice responses.";
    }
    
    return "🔊 An unexpected error occurred with voice playback. Please try again or refresh the page.";
  }

  private getGenericErrorMessage(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (severity) {
      case 'critical':
        return "A critical error occurred. Please refresh the page and try again.";
      case 'high':
        return "An important error occurred. Please try again or contact support if the issue persists.";
      case 'medium':
        return "An error occurred. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  /**
   * Recovery action implementations
   */
  private retryLastOperation(): void {
    // This would be implemented based on the specific operation context
    console.log('Retrying last operation...');
  }

  private redirectToLogin(): void {
    // Redirect to login page
    window.location.href = '/login';
  }

  private showSettingsHelp(): void {
    // Show help modal or redirect to settings
    console.log('Showing settings help...');
  }

  private openSupport(): void {
    // Open support contact form or redirect
    window.open('mailto:support@otakon.ai', '_blank');
  }

  /**
   * Handle chat-specific errors
   */
  async handleChatError(error: any, context: ChatErrorContext): Promise<EnhancedErrorInfo> {
    const { type, severity, userAction, ttsSafe } = this.categorizeError(error, context);
    const userMessage = this.getUserFriendlyMessage(error, context);
    const recoveryAction = this.getErrorRecoveryAction(error, context);

    const errorInfo: EnhancedErrorInfo = {
      type,
      severity,
      message: error?.message || error?.toString() || 'Unknown error',
      userMessage,
      retryable: userAction === 'retry',
      context,
      timestamp: Date.now(),
      stack: error?.stack,
      recoveryAction: recoveryAction || undefined,
      ttsSafe
    };

    // Log error for debugging
    console.error('Chat Error:', errorInfo);

    return errorInfo;
  }

  /**
   * Handle TTS-specific errors
   */
  async handleTTSError(error: any, context: TTSErrorContext): Promise<EnhancedErrorInfo> {
    const { type, severity, userAction, ttsSafe } = this.categorizeError(error, context);
    const userMessage = this.getUserFriendlyMessage(error, context);
    const recoveryAction = this.getErrorRecoveryAction(error, context);

    const errorInfo: EnhancedErrorInfo = {
      type,
      severity,
      message: error?.message || error?.toString() || 'Unknown TTS error',
      userMessage,
      retryable: userAction === 'retry',
      context,
      timestamp: Date.now(),
      stack: error?.stack,
      recoveryAction: recoveryAction || undefined,
      ttsSafe
    };

    // Log TTS error for debugging
    console.warn('TTS Error:', errorInfo);

    return errorInfo;
  }

  /**
   * Delegate to base service for standard operations
   */
  async handleError(error: any, context: ErrorContext): Promise<void> {
    return this.baseService.handleError(error, context);
  }

  async retryOperation<T>(operation: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> {
    return this.baseService.retryOperation(operation, options);
  }
}

export const enhancedErrorHandlingService = EnhancedErrorHandlingService.getInstance();
