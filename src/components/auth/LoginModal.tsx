import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Building2, 
  Eye, 
  EyeOff, 
  LogIn
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginWithEmail } = useAuth();
  
  // Unified Login States
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
          <p className="text-emerald-200 text-xs font-medium mt-0.5">Unified System Login</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Unified Standard Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email Address (Login ID)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. user@haidermemorial.edu.pk"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
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
              {submitting ? 'Authenticating & Loading Account...' : 'Sign In to School POS'}
            </button>
          </form>

          <div className="pt-4 text-center text-[10px] font-semibold text-slate-400">
            Authorized Personnel Only • School POS Enterprise System
          </div>
        </div>
      </div>
    </div>
  );
};
