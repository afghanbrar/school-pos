import React, { useState } from 'react';
import type { SchoolSettings } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings, 
  School, 
  Save, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Loader2
} from 'lucide-react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

interface SettingsModalProps {
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose }) => {
  const { isCeo } = useAuth();

  const [name, setName] = useState(settings.name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live Auto-Updater States
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'ready' | 'error'>('idle');
  const [updateObj, setUpdateObj] = useState<Update | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ downloaded: number; total: number; percentage: number }>({
    downloaded: 0,
    total: 0,
    percentage: 0,
  });

  // Secure CEO Factory Reset States
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showPasswordPromptModal, setShowPasswordPromptModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Handle Logo Image Upload to Base64 Data URL
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo image size should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SchoolSettings = {
      name: name.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      logo_url: logoUrl.trim(),
      currency_symbol: currencySymbol.trim() || 'PKR',
    };
    await db.updateSettings(updated);
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  // Check for Live GitHub Updates
  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateError(null);
    setUpdateStatus('checking');
    try {
      const update = await check();
      if (update && update.available) {
        setUpdateObj(update);
        setUpdateStatus('available');
      } else {
        setUpdateObj(null);
        setUpdateStatus('up-to-date');
      }
    } catch (err: any) {
      console.error('Update check failed:', err);
      setUpdateError(err?.message || 'Could not connect to update release server or app is running in browser mode.');
      setUpdateStatus('error');
    } finally {
      setCheckingUpdate(false);
    }
  };

  // Download & Install Update Live
  const handleDownloadAndInstall = async () => {
    if (!updateObj) return;
    setUpdateStatus('downloading');
    setUpdateError(null);
    setDownloadProgress({ downloaded: 0, total: 0, percentage: 0 });

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
            const pct = totalLength > 0 ? Math.round((downloaded / totalLength) * 100) : 0;
            setDownloadProgress({
              downloaded,
              total: totalLength,
              percentage: pct,
            });
            break;
          case 'Finished':
            setUpdateStatus('ready');
            break;
        }
      });

      // Restart app seamlessly after installation
      await relaunch();
    } catch (err: any) {
      console.error('Download/install failed:', err);
      setUpdateError(err?.message || 'Failed to download or apply the live update package.');
      setUpdateStatus('error');
    }
  };

  // Execute CEO Factory Reset after password verification
  const handleExecuteFactoryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!resetPassword) {
      setResetError('Password is required to confirm reset.');
      return;
    }

    setResetting(true);
    try {
      const res = await db.factoryResetSystem(resetPassword);
      if (res.success) {
        setShowPasswordPromptModal(false);
        alert('System Factory Reset successful! All database records wiped clean. Refreshing application...');
        window.location.reload();
      }
    } catch (err: any) {
      setResetError(err.message || 'Incorrect CEO password. Factory reset cancelled.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" /> System Settings & School Branding
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {savedSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4" /> Settings & Logo updated successfully! PDF invoices & header will now show this logo.
            </div>
          )}

          <div className="overflow-y-auto flex-1 pr-1 space-y-6">
            <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
              {/* LOGO UPLOAD FIELD SECTION */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" /> Official School Logo Upload
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {logoUrl ? (
                      <img src={logoUrl} alt="School Logo Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <School className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    {/* File Input */}
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                      <Upload className="w-4 h-4" /> Upload Logo Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">Supported formats: PNG, JPG, WebP. Recommended max size: 2MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School Name (Applies to headers & PDF receipts) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Haider Memorial School POS and Inventory System"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motto / Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Excellence in Education & Character"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile & Telephone Numbers *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567 / (042) 35890123"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="principal@haidermemorial.edu.pk"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Address Line
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Campus Address"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={e => setCurrencySymbol(e.target.value)}
                    placeholder="PKR"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Logo & School Details
                </button>
              </div>
            </form>

            {/* LIVE APP AUTO-UPDATER SECTION */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h4 className="font-bold text-sm text-white">Application Updates & Live Release</h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={checkingUpdate || updateStatus === 'downloading'}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                    {checkingUpdate ? 'Checking for Updates...' : 'Check for Updates'}
                  </button>
                </div>

                {/* Status Message Containers */}
                {updateStatus === 'up-to-date' && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>You are running the latest live version of School POS! No updates available.</span>
                  </div>
                )}

                {updateStatus === 'error' && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Update Check Alert</p>
                      <p className="text-[11px] text-rose-300/80">{updateError}</p>
                    </div>
                  </div>
                )}

                {/* Update Available Box */}
                {(updateStatus === 'available' || updateStatus === 'downloading' || updateStatus === 'ready') && updateObj && (
                  <div className="p-4 bg-slate-800/90 rounded-xl border border-emerald-500/40 space-y-3 animate-fadeIn">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <ArrowUpCircle className="w-3 h-3" /> New Release Version {updateObj.version}
                        </span>
                        {updateObj.body && (
                          <div className="mt-2 text-xs text-slate-300 space-y-1">
                            <p className="font-semibold text-slate-200">Release Notes:</p>
                            <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 whitespace-pre-wrap max-h-24 overflow-y-auto">
                              {updateObj.body}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar when downloading */}
                    {updateStatus === 'downloading' && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                          <span>Downloading Update File...</span>
                          <span>{downloadProgress.percentage}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${downloadProgress.percentage}%` }}
                          />
                        </div>
                        {downloadProgress.total > 0 && (
                          <p className="text-[10px] text-slate-400 text-right">
                            {(downloadProgress.downloaded / (1024 * 1024)).toFixed(2)} MB / {(downloadProgress.total / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {updateStatus === 'available' && (
                      <button
                        type="button"
                        onClick={handleDownloadAndInstall}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <ArrowUpCircle className="w-4 h-4" /> Download & Update Live Now
                      </button>
                    )}

                    {updateStatus === 'ready' && (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded-xl text-xs text-center font-bold">
                        Update downloaded & installed! Restarting School POS...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECURE CEO SYSTEM RESET OPTION */}
            {isCeo && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">System Reset (CEO Access Only)</h4>
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5">
                        Perform a complete factory wipe of products, categories, students, bulk buyers, sales, expenses, and staff accounts.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResetConfirmModal(true)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> System Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Confirm System Factory Reset</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This operation will permanently erase all products, categories, students, bulk buyers, transactions, expenses, handovers, notifications, and staff user accounts.
              </p>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-2">
                Only your main CEO login account will be retained. This action cannot be undone!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowResetConfirmModal(false);
                  setResetPassword('');
                  setResetError(null);
                  setShowPasswordPromptModal(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD VERIFICATION POPUP MODAL */}
      {showPasswordPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Verify CEO Password
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordPromptModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Please enter your CEO account password to authorize the complete system wipe:
            </p>

            {resetError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteFactoryReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CEO Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordPromptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Wiping Database...
                    </>
                  ) : (
                    'Wipe Entire System Clean'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
