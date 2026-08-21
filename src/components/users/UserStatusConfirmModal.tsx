import React from 'react';
import type { UserProfile } from '../../types';
import { UserX, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatRoleLabel } from '../../utils/roleUtils';

interface UserStatusConfirmModalProps {
  user: UserProfile;
  targetStatus: 'active' | 'inactive';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const UserStatusConfirmModal: React.FC<UserStatusConfirmModalProps> = ({
  user,
  targetStatus,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const isBlocking = targetStatus === 'inactive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 transform transition-all">
        
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isBlocking
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {isBlocking ? (
              <UserX className="w-6 h-6 animate-pulse" />
            ) : (
              <UserCheck className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isBlocking ? 'Confirm User Deactivation & Block' : 'Confirm User Reactivation'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBlocking
                ? 'This action will immediately restrict system access.'
                : 'This action will restore active system privileges.'}
            </p>
          </div>
        </div>

        {/* User Card Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">User Name:</span>
            <span className="font-bold text-slate-900 dark:text-white">{user.full_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Email Address:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{user.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Assigned Role:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatRoleLabel(user.role)}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 font-medium">New Account Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isBlocking
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {isBlocking ? 'INACTIVE (BLOCKED)' : 'ACTIVE (AUTHORIZED)'}
            </span>
          </div>
        </div>

        {/* Informative Warning Message */}
        <div
          className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 leading-relaxed ${
            isBlocking
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {isBlocking ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            {isBlocking
              ? `Are you sure you want to block ${user.full_name}? The user will not be able to log in to the POS billing system until unblocked by the CEO.`
              : `Are you sure you want to unblock ${user.full_name}? They will immediately be permitted to sign in and record transactions with ${formatRoleLabel(user.role)} access.`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
              isBlocking
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
            }`}
          >
            {isBlocking ? (
              <>
                <UserX className="w-4 h-4" />
                {loading ? 'Blocking User...' : 'Confirm & Block User'}
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                {loading ? 'Unblocking User...' : 'Confirm & Unblock User'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
