import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ToastMessage, ToastType } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const lastToastRef = useRef<{ key: string; time: number } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string, customDuration?: number) => {
    // Prevent duplicate toast triggers within 400ms
    const toastKey = `${type}-${title}-${message || ''}`;
    const now = Date.now();
    if (lastToastRef.current && lastToastRef.current.key === toastKey && now - lastToastRef.current.time < 400) {
      return;
    }
    lastToastRef.current = { key: toastKey, time: now };

    const id = `toast-${now}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, type, title, message };

    setToasts(prev => [...prev, newToast]);

    // Duration mapping:
    let duration = customDuration ?? 3000;
    if (customDuration === undefined) {
      if (type === 'success') {
        duration = 2000;
      } else if (type === 'delete') {
        duration = 3000;
      } else if (type === 'warning' || type === 'error') {
        duration = 4000;
      }
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
