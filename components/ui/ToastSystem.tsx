import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

// ===== TYPES =====

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

// ===== CONTEXT =====

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ===== TOAST PROVIDER =====

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// ===== TOAST CONTAINER =====

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// ===== TOAST ITEM =====

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
    }
  };

  return (
    <div
      className={cn(
        'bg-[#1C1C1C] border border-[#424242]/40 rounded-lg shadow-lg backdrop-blur-sm',
        'border-l-4',
        getBorderColor(),
        'transform transition-all duration-300 ease-out',
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isLeaving && 'translate-x-full opacity-0 scale-95'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#F5F5F5]">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="mt-1 text-sm text-[#A3A3A3]">
                {toast.message}
              </p>
            )}
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium text-[#FFAB40] hover:text-[#E53A3A] transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          <button
            onClick={handleRemove}
            className="flex-shrink-0 p-1 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors rounded-md hover:bg-white/10"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== TOAST HOOKS =====

export const useToastNotifications = () => {
  const { addToast } = useToast();

  const showSuccess = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'success',
      title,
      ...(message && { message }),
      ...(options?.duration && { duration: options.duration }),
      ...(options?.action && { action: options.action }),
      ...(options?.onClose && { onClose: options.onClose })
    });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'error',
      title,
      ...(message && { message }),
      duration: 7000, // Longer duration for errors
      ...(options?.action && { action: options.action }),
      ...(options?.onClose && { onClose: options.onClose })
    });
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'warning',
      title,
      ...(message && { message }),
      ...(options?.duration && { duration: options.duration }),
      ...(options?.action && { action: options.action }),
      ...(options?.onClose && { onClose: options.onClose })
    });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({
      type: 'info',
      title,
      ...(message && { message }),
      ...(options?.duration && { duration: options.duration }),
      ...(options?.action && { action: options.action }),
      ...(options?.onClose && { onClose: options.onClose })
    });
  }, [addToast]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// ===== TOAST COMPONENT (for manual use) =====

interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
}

export const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onClose }) => {
  return (
    <ToastItem toast={toast} onRemove={onClose} />
  );
};
