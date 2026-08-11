import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, ShieldCheck, UserCheck, School } from 'lucide-react';
import type { SchoolSettings } from '../../types';

interface HeaderProps {
  activeTab: string;
  settings: SchoolSettings;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, settings, onOpenSettings, onOpenProfile }) => {
  const { user, isPrincipal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getTitle = () => {
    switch (activeTab) {
      case 'pos':
        return 'Point of Sale Terminal';
      case 'inventory':
        return 'Inventory & Category Manager';
      case 'analytics':
        return 'Principal Analytics & Financial Dashboard';
      case 'users':
        return 'Staff Account & Security Portal';
      case 'transactions':
        return 'Sales Receipts & Payment Records';
      case 'customers':
        return 'Customer & Student Profiles';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="h-16 shrink-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors">
      {/* Left: App Title & School Branding with Logo Image */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="School Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <School className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div>
          {/* Main Top Headline: School Name */}
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
            {settings.name}
          </h1>
          {/* Subtitle below: Current Page / Module Title */}
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {getTitle()}
          </p>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, User Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium flex items-center gap-1.5"
          title="System Settings & Database Setup"
        >
          <span className="hidden sm:inline">Settings</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-right hidden sm:block hover:opacity-80 transition-opacity text-left cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
              title="Click to edit profile & change password"
            >
              <div className="text-xs font-semibold text-slate-800 dark:text-white leading-none mb-1 flex items-center justify-end gap-1">
                <span>{user.full_name}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✎</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                {isPrincipal ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 mr-0.5" /> SUPER ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    <UserCheck className="w-3 h-3 mr-0.5" /> STAFF CASHIER
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
