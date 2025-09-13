import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onReload?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  onReload 
}) => {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-full">
          <svg 
            className="w-6 h-6 text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          Something went wrong
        </h3>
        
        <p className="text-gray-300 mb-4">
          {message}
        </p>
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
          
          {onReload && (
            <button
              onClick={onReload}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Reload Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
