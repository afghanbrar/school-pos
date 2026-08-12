import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  AlertCircle, 
  Building2, 
  Eye,
  EyeOff,
  LogIn,
  Key
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginWithEmail } = useAuth();
  const [loginType, setLoginType] = useState<'ceo' | 'staff'>('ceo');
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both Email Address and Password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setCeoCredentials = () => {
    setEmail('ceo@haidermemorial.edu.pk');
    setPassword('CeoMaster@2026');
    setError(null);
  };

  const setStaffCredentials = () => {
    setEmail('staff.ahmed@haidermemorial.edu.pk');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl"></div>
          
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-2.5 shadow-inner border border-white/20">
            <Building2 className="w-7 h-7 text-emerald-200" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">School POS & Enterprise Portal</h2>
          <p className="text-emerald-200 text-xs font-medium mt-0.5">Secure Multi-User Financial System</p>
        </div>

        {/* Role Selection Tabs (CEO vs Staff) with High Contrast Hover States */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl mb-5 text-xs">
            <button
              type="button"
              onClick={() => { 
                setLoginType('ceo'); 
                setError(null); 
                setEmail(''); 
                setPassword(''); 
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
                loginType === 'ceo'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${loginType === 'ceo' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
              CEO (Super Admin)
            </button>

            <button
              type="button"
              onClick={() => { 
                setLoginType('staff'); 
                setError(null); 
                setEmail(''); 
                setPassword(''); 
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold transition-all ${
                loginType === 'staff'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-md ring-1 ring-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${loginType === 'staff' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
              Staff Cashier
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* 1. CEO SUPER ADMIN LOGIN */}
          {loginType === 'ceo' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-300">
                  <div className="font-bold">Chief Executive Officer Access</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Full authority: Financial Ledgers, Cash Handover Approvals, Stock Procurement & Live Activity Stream.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  CEO Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ceo@haidermemorial.edu.pk"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg hover:shadow-emerald-900/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Authenticating CEO...' : 'Sign In as CEO (Super Admin)'}
              </button>

              {/* Quick Fill Helper for Demo / Testing */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                <span>Default CEO Login:</span>
                <button
                  type="button"
                  onClick={setCeoCredentials}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3 h-3" /> Auto-Fill CEO Credentials
                </button>
              </div>
            </form>
          )}

          {/* 2. STAFF CASHIER LOGIN */}
          {loginType === 'staff' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 dark:text-indigo-300">
                  <div className="font-bold">Staff Cashier Terminal Login</div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                    Log in to issue POS student invoices, log daily school expenses, and submit cash handovers.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="staff.ahmed@haidermemorial.edu.pk"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Staff Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg hover:shadow-indigo-900/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Verifying Staff Credentials...' : 'Sign In as Staff Cashier'}
              </button>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                <span>Default Staff Login:</span>
                <button
                  type="button"
                  onClick={setStaffCredentials}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3 h-3" /> Auto-Fill Staff Credentials
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 text-center text-[10px] font-semibold text-slate-400">
            Authorized Personnel Only • School POS Multi-Tenant Enterprise System
          </div>
        </div>

      </div>
    </div>
  );
};
