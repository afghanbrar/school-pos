import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, Trash2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none drop-shadow-2xl">
      {toasts.map(toast => {
        let bgStyle = 'bg-slate-900 border-slate-800 text-white';
        let IconComponent = CheckCircle2;

        if (toast.type === 'success') {
          bgStyle = 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/30';
          IconComponent = CheckCircle2;
        } else if (toast.type === 'delete') {
          bgStyle = 'bg-slate-800 border-slate-700 text-slate-100 shadow-slate-950/40';
          IconComponent = Trash2;
        } else if (toast.type === 'warning') {
          bgStyle = 'bg-amber-600 border-amber-500 text-white shadow-amber-900/30';
          IconComponent = AlertTriangle;
        } else if (toast.type === 'error') {
          bgStyle = 'bg-rose-600 border-rose-500 text-white shadow-rose-900/30';
          IconComponent = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 animate-fadeIn transition-all transform ${bgStyle}`}
          >
            <IconComponent className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs space-y-0.5">
              <div className="font-bold">{toast.title}</div>
              {toast.message && <div className="text-[11px] opacity-90">{toast.message}</div>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
