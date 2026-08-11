import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastMessage, ToastType } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, type, title, message };

    setToasts(prev => [...prev, newToast]);

    // Duration mapping according to user requirement:
    // Success (Add/Update): Green toast, 2s
    // Delete: Standard toast, 3s
    // Warning/Error: Red toast, 4s
    let duration = 3000;
    if (type === 'success') {
      duration = 2000;
    } else if (type === 'delete') {
      duration = 3000;
    } else if (type === 'warning' || type === 'error') {
      duration = 4000;
    }

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
