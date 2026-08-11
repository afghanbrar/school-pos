import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  AlertCircle, 
  Building2, 
  UserPlus, 
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  LogIn
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginWithEmail, registerUser } = useAuth();
  const [loginType, setLoginType] = useState<'principal' | 'staff' | 'register'>('principal');
  
  // Principal & Staff Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'principal' | 'staff'>('principal');
  const [showRegPassword, setShowRegPassword] = useState(false);

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

  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser(regFullName.trim(), regEmail.trim(), regRole, regPassword);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try a different email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl"></div>
          
          <div className="w-13 h-13 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-inner border border-white/20">
            <Building2 className="w-7 h-7 text-emerald-200" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">School POS & Inventory Portal</h2>
          <p className="text-emerald-100 text-xs mt-0.5">Secure Cloud Database Access</p>
        </div>

        {/* Role Selection & Registration Tabs */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-5 text-[11px]">
            <button
              type="button"
              onClick={() => { setLoginType('principal'); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-semibold transition-all ${
                loginType === 'principal'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Principal
            </button>

            <button
              type="button"
              onClick={() => { setLoginType('staff'); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-semibold transition-all ${
                loginType === 'staff'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Staff Login
            </button>

            <button
              type="button"
              onClick={() => { setLoginType('register'); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-semibold transition-all ${
                loginType === 'register'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* 1. PRINCIPAL SUPER ADMIN LOGIN FORM */}
          {loginType === 'principal' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  Enter Principal Super Admin credentials to access all system modules.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Principal Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="principal@school.edu.pk"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Authenticating Principal...' : 'Sign In as Super Admin'}
              </button>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                <span>First time setup?</span>
                <button
                  type="button"
                  onClick={() => { setLoginType('register'); setRegRole('principal'); setError(null); }}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Create Master Admin Account →
                </button>
              </div>
            </form>
          )}

          {/* 2. STAFF CASHIER LOGIN FORM */}
          {loginType === 'staff' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium">
                  Log in with your staff account credentials issued by the Principal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="staff.ahmed@school.edu.pk"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Verifying Staff Credentials...' : 'Sign In as Staff'}
              </button>
            </form>
          )}

          {/* 3. FIRST-TIME REGISTER ACCOUNT FORM */}
          {loginType === 'register' && (
            <form onSubmit={handleRegisterAccount} className="space-y-3">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-100 dark:border-teal-900/50">
                <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mb-0.5">
                  <UserPlus className="w-3.5 h-3.5" /> First-Time Account Registration
                </div>
                <p className="text-[10px] text-teal-700 dark:text-teal-400">
                  Register your master Super Admin account. You can update your email & password anytime later from profile settings.
                </p>
              </div>

              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Type / Role *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRegRole('principal')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      regRole === 'principal' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Principal (Super Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('staff')}
                    className={`py-1.5 rounded-lg font-bold transition-all ${
                      regRole === 'staff' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Staff Cashier
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Pendelton"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="admin@school.edu.pk"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 chars"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Creating Account & Initializing...' : 'Create Account & Enter Dashboard'}
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setLoginType('principal'); setError(null); }}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Log In here
                </button>
              </div>
            </form>
          )}

          <div className="pt-3 text-center text-[10px] font-semibold text-slate-400">
            School POS System • developed by AI Mobiles & Tech
          </div>
        </div>

      </div>
    </div>
  );
};
