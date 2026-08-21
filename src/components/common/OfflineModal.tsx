import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudOff, Radio } from 'lucide-react';

export const OfflineModal: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justRestored, setJustRestored] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setChecking(false);
      setJustRestored(true);
      setTimeout(() => {
        setIsOffline(false);
        setJustRestored(false);
      }, 1200);
    };

    const handleOffline = () => {
      setJustRestored(false);
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat check
    const interval = setInterval(() => {
      if (!navigator.onLine && !isOffline) {
        setIsOffline(true);
      } else if (navigator.onLine && isOffline && !justRestored) {
        handleOnline();
      }
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline, justRestored]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      // Test fetch with short timeout to check real connectivity
      await fetch('https://httpbin.org/status/200', { method: 'HEAD', cache: 'no-store', mode: 'no-cors' });
      setJustRestored(true);
      setTimeout(() => {
        setIsOffline(false);
        setJustRestored(false);
        setChecking(false);
      }, 1000);
    } catch {
      if (navigator.onLine) {
        setJustRestored(true);
        setTimeout(() => {
          setIsOffline(false);
          setJustRestored(false);
          setChecking(false);
        }, 1000);
      } else {
        setChecking(false);
      }
    }
  };

  if (!isOffline && !justRestored) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5 transform transition-all">
        
        {justRestored ? (
          /* Connection Restored State */
          <div className="py-4 space-y-3 animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-900/20">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Internet Connection Restored!
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Restoring full School POS functionality...
              </p>
            </div>
          </div>
        ) : (
          /* Offline Alert State */
          <>
            {/* Pulsing WifiOff Icon */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-300 dark:border-rose-800 shadow-xl shadow-rose-950/30">
                <WifiOff className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                <CloudOff className="w-3 h-3" /> NO INTERNET CONNECTION
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                You Are Currently Offline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                School POS requires an active network connection to process transactions and sync securely with the cloud server.
              </p>
            </div>

            {/* Auto-reconnection indicator */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Monitoring network...</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Auto-resumes when online
              </span>
            </div>

            {/* Manual Retry Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={checking}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking Connection...' : 'Check Connection Again'}
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              Please check your Wi-Fi, Ethernet, or mobile hotspot connection.
            </p>
          </>
        )}

      </div>
    </div>
  );
};
