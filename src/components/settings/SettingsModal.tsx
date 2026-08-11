import React, { useState } from 'react';
import type { SchoolSettings } from '../../types';
import { db } from '../../services/db';
import { Settings, School, Save, Check, X, Upload, Image as ImageIcon } from 'lucide-react';

interface SettingsModalProps {
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: SchoolSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose }) => {
  const [name, setName] = useState(settings.name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

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

  return (
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

        <div className="overflow-y-auto flex-1 pr-1">
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
                placeholder="e.g. Haider Memorial School & College"
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

            {/* SUPABASE CLOUD DATA SYNC SECTION */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Supabase Cloud Database Integration
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Connected API URL: <code className="text-emerald-300 font-mono text-[10px]">https://ektqwpnsqqnrukubnmiw.supabase.co</code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await db.syncLocalToSupabase();
                    alert(res.message);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Sync All Local Data to Supabase Now
                </button>
              </div>

              <div className="p-2.5 bg-slate-800/80 rounded-xl text-[10px] text-slate-300 space-y-1 border border-slate-700">
                <div className="font-bold text-amber-300">If your Supabase project is fresh & empty:</div>
                <div>1. Open your <a href="https://supabase.com/dashboard/project/ektqwpnsqqnrukubnmiw/sql" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-bold">Supabase SQL Editor</a>.</div>
                <div>2. Run the DDL script in <code className="text-slate-200 font-mono">supabase_schema.sql</code> to create tables (`categories`, `products`, `transactions`, `profiles`).</div>
                <div>3. Click <strong>"Sync All Local Data to Supabase Now"</strong> above!</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg"
              >
                <Save className="w-4 h-4" /> Save Logo & School Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
