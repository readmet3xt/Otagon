/**
 * Service for handling errors gracefully and providing user-friendly error messages
 */
class ErrorRecoveryService {
  private errorMessages = {
    aiServiceError: "Otagon is having trouble thinking right now. Please try again.",
    networkError: "I'm having trouble connecting to the AI service. Check your internet connection and try again.",
    rateLimitError: "I'm getting too many requests right now. Please wait a moment before trying again.",
    cacheError: "There was a problem accessing cached data, but I'll try to get fresh information.",
    conversationError: "There was a problem saving your conversation. Your progress might not be saved.",
    unknownError: "Something unexpected happened. Please try again or refresh the page."
  };

  /**
   * Display a user-friendly error message
   */
  public displayError(errorType: keyof typeof this.errorMessages, customMessage?: string): void {
    const message = customMessage || this.errorMessages[errorType];
    
    // In a real app, you might show a toast notification or modal
    console.error(`[ErrorRecovery] ${message}`);
    
    // For now, we'll just log to console
    // In a real implementation, you'd integrate with your UI notification system
    this.showNotification(message, 'error');
  }

  /**
   * Handle AI service errors with specific recovery strategies
   */
  public handleAIServiceError(error: any): void {
    if (error.message?.includes('rate limit')) {
      this.displayError('rateLimitError');
    } else if (error.message?.includes('network')) {
      this.displayError('networkError');
    } else if (error.message?.includes('API key')) {
      this.displayError('aiServiceError', 'There seems to be a configuration issue. Please contact support.');
    } else {
      this.displayError('aiServiceError');
    }
  }

  /**
   * Handle conversation service errors
   */
  public handleConversationError(error: any): void {
    console.error('[ErrorRecovery] Conversation error:', error);
    this.displayError('conversationError');
  }

  /**
   * Handle cache service errors
   */
  public handleCacheError(error: any): void {
    console.warn('[ErrorRecovery] Cache error (non-critical):', error);
    this.displayError('cacheError');
  }

  /**
   * Show a notification to the user
   * This is a placeholder - in a real app, you'd integrate with your notification system
   */
  private showNotification(message: string, type: 'error' | 'warning' | 'info'): void {
    // Placeholder for notification system
    // In a real app, you might use a toast library or custom notification component
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[ErrorRecovery] Retry attempt ${attempt + 1} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

export const errorRecoveryService = new ErrorRecoveryService();
