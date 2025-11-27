import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Simple toast store using React state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];
let nextId = 0;

export const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
  const id = `${nextId++}`;
  const toast: Toast = { id, message, type };
  
  toasts = [toast, ...toasts];
  notifyListeners();
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  return id;
};

export const removeToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
};

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]));
};

export const useToasts = () => {
  const [toastList, setToastList] = React.useState<Toast[]>([]);
  
  useEffect(() => {
    const handler = (updatedToasts: Toast[]) => {
      setToastList(updatedToasts);
    };
    
    toastListeners.push(handler);
    setToastList([...toasts]);
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== handler);
    };
  }, []);
  
  return toastList;
};

// Toast component
export const ToastContainer: React.FC = () => {
  const toastList = useToasts();
  
  if (toastList.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-600" />,
        };
    }
  };
  
  const styles = getStyles();
  
  return (
    <div className={`${styles.bg} border rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md w-full animate-in slide-in-from-top-2 fade-in`}>
      <div className="mt-0.5">{styles.icon}</div>
      <div className={`flex-1 ${styles.text}`}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className={`mt-0.5 ${styles.text} hover:opacity-70 transition-opacity`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Convenience functions
export const toast = {
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error', 5000),
  info: (message: string) => showToast(message, 'info'),
  warning: (message: string) => showToast(message, 'warning', 5000),
};
