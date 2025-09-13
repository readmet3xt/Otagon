import { useCallback } from 'react';

interface UseErrorHandlingProps {
  setDatabaseSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;
  setLastDatabaseSync: (timestamp: number) => void;
}

export const useErrorHandling = ({
  setDatabaseSyncStatus,
  setLastDatabaseSync,
}: UseErrorHandlingProps) => {
  
  const handleError = useCallback((error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    // You can add more sophisticated error handling here:
    // - Send to error reporting service
    // - Show user-friendly error messages
    // - Retry logic for transient errors
    // - Fallback mechanisms
  }, []);

  const handleDatabaseError = useCallback((error: Error, operation: string) => {
    console.error(`Database error during ${operation}:`, error);
    setDatabaseSyncStatus('error');
    
    // You can add retry logic or fallback mechanisms here
  }, [setDatabaseSyncStatus]);

  const handleNetworkError = useCallback((error: Error, operation: string) => {
    console.error(`Network error during ${operation}:`, error);
    
    // You can add retry logic or offline handling here
  }, []);

  const handleAuthError = useCallback((error: Error, operation: string) => {
    console.error(`Authentication error during ${operation}:`, error);
    
    // You can add auth error handling here:
    // - Redirect to login
    // - Clear invalid tokens
    // - Show auth error messages
  }, []);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError!;
  }, []);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error as Error, context);
        return null;
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleDatabaseError,
    handleNetworkError,
    handleAuthError,
    retryOperation,
    withErrorHandling,
  };
};
