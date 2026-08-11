import React, { useState, useEffect } from 'react';
import type { UserProfile, UserStatus } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  UserPlus, 
  Key, 
  UserX, 
  UserCheck, 
  Lock, 
  Mail, 
  Search, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { isPrincipal, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const list = await db.getUsers();
    setUsers(list);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!fullName.trim() || !email.trim()) {
      setCreateError('Name and Email are required.');
      return;
    }

    try {
      const newStaff = await db.createStaffUser(fullName, email, password || 'password123');
      setCreateSuccess(`Staff account created for ${newStaff.full_name} (${newStaff.email}). Status: Active.`);
      setFullName('');
      setEmail('');
      setPassword('');
      await loadUsers();
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create staff account.');
    }
  };

  const handleToggleStatus = async (userToToggle: UserProfile) => {
    if (userToToggle.role === 'principal') {
      alert('Principal Super Admin account status cannot be set to inactive.');
      return;
    }

    const nextStatus: UserStatus = userToToggle.status === 'active' ? 'inactive' : 'active';
    const actionText = nextStatus === 'inactive' ? 'deactivate and BLOCK login for' : 'activate';

    if (window.confirm(`Are you sure you want to ${actionText} ${userToToggle.full_name}?`)) {
      try {
        await db.updateUserStatus(userToToggle.id, nextStatus);
        await loadUsers();
      } catch (err: any) {
        alert(err.message || 'Failed to update user status.');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUserId || !newPassword) return;

    try {
      await db.resetUserPassword(resetModalUserId);
      setResetSuccess('Password reset updated successfully.');
      setTimeout(() => {
        setResetModalUserId(null);
        setNewPassword('');
        setResetSuccess(null);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isPrincipal) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <Lock className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Restricted Admin Access</h3>
        <p className="text-xs text-slate-500 mt-2">
          Only the Principal (Super Admin) logging in via official Gmail has authority to manage staff accounts and security credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Staff Management & Authorization</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 inline mr-1" /> Principal Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create staff accounts, issue password updates, and toggle active/inactive status. Inactive staff are immediately blocked from system login.
          </p>
        </div>

        <button
          onClick={() => { setCreateError(null); setCreateSuccess(null); setIsCreateModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" /> Create New Staff Account
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
            />
          </div>
          <div className="text-xs text-slate-400">
            Total System Users: <strong className="text-slate-800 dark:text-white">{users.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">System Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map(usr => {
                const isPrincipalUser = usr.role === 'principal';
                const isActive = usr.status === 'active';

                return (
                  <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {usr.full_name}
                        {usr.id === currentUser?.id && (
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                            (YOU)
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" /> {usr.email}
                      </div>
                    </td>

                    <td className="p-4">
                      {isPrincipalUser ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> Principal / Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Staff Cashier
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {isActive ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                          <UserCheck className="w-3 h-3 mr-1" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300">
                          <UserX className="w-3 h-3 mr-1" /> INACTIVE (BLOCKED)
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500">
                      {new Date(usr.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      {!isPrincipalUser ? (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleToggleStatus(usr)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                              isActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            {isActive ? 'Deactivate & Block' : 'Activate Account'}
                          </button>

                          <button
                            onClick={() => { setResetSuccess(null); setNewPassword(''); setResetModalUserId(usr.id); }}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Reset Staff Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Master Account</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Create Authorized Staff Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {createError}
              </div>
            )}

            {createSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff.tariq@stlawrence.edu.pk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="Leave empty for auto-generated temporary password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                Newly created staff accounts are set to <strong>Active</strong> status by default and can immediately log into the POS terminal.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetModalUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" /> Reset Staff Password
              </h3>
              <button onClick={() => setResetModalUserId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-semibold">
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUserId(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
