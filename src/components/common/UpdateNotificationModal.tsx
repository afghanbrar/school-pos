import React, { useState, useEffect } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  ArrowUpCircle,
  Clock
} from 'lucide-react';

interface UpdateNotificationModalProps {
  currentVersion?: string;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({ currentVersion = '1.0.7' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [updateObj, setUpdateObj] = useState<Update | null>(null);
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'completed' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [progress, setProgress] = useState({
    downloadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
  });

  const [restartCountdown, setRestartCountdown] = useState<number | null>(null);

  // Auto-check for updates on application mount
  useEffect(() => {
    checkForUpdateOnStartup();
  }, []);

  // Handle auto-restart countdown when update completes
  useEffect(() => {
    if (updateStatus === 'completed') {
      setRestartCountdown(4);
      const interval = setInterval(() => {
        setRestartCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            handleRestart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [updateStatus]);

  const isTauriEnv = () => {
    return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
  };

  const checkForUpdateOnStartup = async () => {
    // Only check in real Tauri desktop environment
    if (!isTauriEnv()) {
      return;
    }

    try {
      setUpdateStatus('checking');
      const update = await check();
      if (update && update.available) {
        setUpdateObj(update);
        setUpdateStatus('available');
        setIsOpen(true);
      } else {
        setUpdateStatus('idle');
      }
    } catch (err: any) {
      console.warn('Silent startup update check notice:', err?.message || err);
      setUpdateStatus('idle');
    }
  };

  const handleStartUpdate = async () => {
    if (!updateObj) return;

    setUpdateStatus('downloading');
    setErrorMessage(null);
    setProgress({ downloadedBytes: 0, totalBytes: 0, percentage: 0 });

    try {
      let totalLength = 0;
      let downloaded = 0;

      await updateObj.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            totalLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const pct = totalLength > 0 ? Math.min(100, Math.round((downloaded / totalLength) * 100)) : 0;
            setProgress({
              downloadedBytes: downloaded,
              totalBytes: totalLength,
              percentage: pct,
            });
            break;
          case 'Finished':
            setProgress(prev => ({ ...prev, percentage: 100 }));
            break;
        }
      });

      // Update successfully applied! Show Green Signal popup
      setUpdateStatus('completed');
    } catch (err: any) {
      console.error('Update download or install error:', err);
      setErrorMessage(err?.message || 'Failed to complete automatic software update.');
      setUpdateStatus('error');
    }
  };

  const handleRestart = async () => {
    try {
      await relaunch();
    } catch (err: any) {
      console.error('Restart failed:', err);
    }
  };

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  if (!isOpen) {
    // If update is available but user dismissed modal, show a subtle top-right indicator
    if (updateStatus === 'available' || (updateObj && updateObj.available)) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-600/30 border border-emerald-400 transition-all transform hover:scale-105 animate-pulse"
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>Update v{updateObj?.version} Available</span>
        </button>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 border rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          updateStatus === 'completed' 
            ? 'border-emerald-500 shadow-emerald-500/20' 
            : 'border-slate-200 dark:border-slate-800 shadow-slate-950/40'
        }`}
      >
        {/* Subtle decorative top accent line */}
        <div 
          className={`h-1.5 w-full ${
            updateStatus === 'completed'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500'
          }`} 
        />

        {/* Modal Close button (only available if not currently downloading or restarting) */}
        {updateStatus !== 'downloading' && updateStatus !== 'completed' && (
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ================= STAGE 1: UPDATE AVAILABLE ================= */}
        {updateStatus === 'available' && (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <ArrowUpCircle className="w-3 h-3" />
                  Live Update Available
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Software Update v{updateObj?.version}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Haider Memorial School POS & Inventory System
                </p>
              </div>
            </div>

            {/* Version Comparison Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Version</span>
                <span className="text-slate-700 dark:text-slate-300">v{currentVersion}</span>
              </div>
              <div className="text-emerald-500 font-bold">➔</div>
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">New Version</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">v{updateObj?.version}</span>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                What's New in this Release:
              </span>
              <div className="max-h-28 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                {updateObj?.body || 'Instant UI reactivity optimization, performance improvements, and official software updates.'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleStartUpdate}
                className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Download & Install Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STAGE 2: DOWNLOADING & INSTALLING ================= */}
        {updateStatus === 'downloading' && (
          <div className="p-6 space-y-6 text-center">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" 
              />
              <Download className="w-7 h-7 text-emerald-500 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Downloading & Applying Update...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please wait while the update package is verified and installed.
              </p>
            </div>

            {/* Percentage & Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                  {progress.percentage}%
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              {progress.totalBytes > 0 && (
                <div className="text-[11px] font-medium text-slate-400 text-right">
                  {formatMB(progress.downloadedBytes)} MB / {formatMB(progress.totalBytes)} MB
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              ⚡ Do not close the POS app while the update is being extracted and installed.
            </div>
          </div>
        )}

        {/* ================= STAGE 3: GREEN SIGNAL - UPDATE SUCCESSFULLY COMPLETED ================= */}
        {updateStatus === 'completed' && (
          <div className="p-6 space-y-6 text-center animate-fadeIn">
            {/* Glowing Emerald Green Badge */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="w-18 h-18 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40">
                <CheckCircle2 className="w-10 h-10 animate-scale" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                GREEN SIGNAL: Update Completed
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Update Successfully Completed!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                Version <span className="font-bold text-emerald-600 dark:text-emerald-400">v{updateObj?.version}</span> is now fully installed with all instant UI optimizations and features.
              </p>
            </div>

            {/* Auto-restart countdown indicator */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <span>
                Restarting application automatically in{' '}
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                  {restartCountdown ?? 3}s
                </span>
                ...
              </span>
            </div>

            {/* Immediate Restart Button */}
            <button
              onClick={handleRestart}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-[1.02]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restart Application Now</span>
            </button>
          </div>
        )}

        {/* ================= STAGE 4: ERROR STATE ================= */}
        {updateStatus === 'error' && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Update Failed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {errorMessage || 'Unable to complete the update. Please check internet connection.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={handleStartUpdate}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
