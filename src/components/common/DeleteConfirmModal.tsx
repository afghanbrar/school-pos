import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  title?: string;
  itemName: string;
  itemType: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title = 'Confirm Deletion',
  itemName,
  itemType,
  message,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-popIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="space-y-2 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            {message || (
              <>Are you sure you want to delete the following <span className="font-semibold">{itemType.toLowerCase()}</span> from inventory?</>
            )}
          </p>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900 text-rose-900 dark:text-rose-200 font-bold flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">{itemName}</span>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            This action cannot be undone. Any associated records will be updated accordingly.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all hover:shadow-lg cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
