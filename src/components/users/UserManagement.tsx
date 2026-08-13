import React, { useState, useEffect } from 'react';
import type { UserProfile, UserStatus } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
  X,
  Edit3,
  Trash2,
  Save
} from 'lucide-react';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

export const UserManagement: React.FC = () => {
  const { isPrincipal, user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Staff Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFullName, setCreateFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editError, setEditError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Staff Modal State
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  // Password Reset Modal State
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

    if (!createFullName.trim() || !createEmail.trim()) {
      setCreateError('Name and Email are required.');
      return;
    }

    try {
      const newStaff = await db.createStaffUser(createFullName, createEmail, createPassword || 'password123');
      showToast('success', 'Staff Account Created', `Created account for ${newStaff.full_name} (${newStaff.email}).`);
      setCreateFullName('');
      setCreateEmail('');
      setCreatePassword('');
      setIsCreateModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create staff account.');
    }
  };

  const openEditModal = (staff: UserProfile) => {
    setEditingStaff(staff);
    setEditFullName(staff.full_name);
    setEditEmail(staff.email);
    setEditPassword(staff.password || '');
    setEditStatus(staff.status);
    setEditError(null);
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError(null);

    if (!editFullName.trim() || !editEmail.trim()) {
      setEditError('Full Name and Email Address are required.');
      return;
    }

    setSubmittingEdit(true);
    try {
      await db.updateStaffUser(editingStaff.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim() || undefined,
        status: editStatus,
      });

      showToast('success', 'Staff Updated', `Updated profile and credentials for ${editFullName.trim()}.`);
      setEditingStaff(null);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update staff account.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await db.deleteStaffUser(deleteTarget.id);
      showToast('delete', 'Staff Deleted', `Staff account ${deleteTarget.full_name} has been removed.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff account.');
    }
  };

  const handleToggleStatus = async (userToToggle: UserProfile) => {
    if (userToToggle.role === 'principal') {
      alert('CEO Super Admin account status cannot be set to inactive.');
      return;
    }

    const nextStatus: UserStatus = userToToggle.status === 'active' ? 'inactive' : 'active';
    const actionText = nextStatus === 'inactive' ? 'deactivate and block' : 'activate';

    if (window.confirm(`Are you sure you want to ${actionText} ${userToToggle.full_name}?`)) {
      try {
        await db.updateUserStatus(userToToggle.id, nextStatus);
        showToast('warning', 'Status Changed', `${userToToggle.full_name} is now ${nextStatus.toUpperCase()}.`);
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
      await db.resetUserPassword(resetModalUserId, newPassword);
      setResetSuccess('Password reset updated successfully.');
      setTimeout(() => {
        setResetModalUserId(null);
        setNewPassword('');
        setResetSuccess(null);
      }, 1200);
      await loadUsers();
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
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Restricted CEO Admin Access</h3>
        <p className="text-xs text-slate-500 mt-2">
          Only the CEO (Super Admin) has authority to manage staff accounts, edit user emails, passwords and security permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Staff Management & Account Control</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 inline mr-1" /> CEO Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create new staff cashiers, edit staff emails & passwords, toggle active/blocked status, or remove accounts.
          </p>
        </div>

        <button
          onClick={() => { setCreateError(null); setIsCreateModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Create New Staff Account
        </button>
      </div>

      {/* Users List Table */}
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
            Total System Accounts: <strong className="text-slate-800 dark:text-white">{users.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Staff User Details</th>
                <th className="p-4">System Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Management Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredUsers.map(usr => {
                const isPrincipalUser = usr.role === 'principal';
                const isActive = usr.status === 'active';

                return (
                  <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {usr.full_name}
                        {usr.id === currentUser?.id && (
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
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
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> CEO Super Admin
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

                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(usr.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      {usr.id !== currentUser?.id ? (
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Staff Account */}
                          <button
                            onClick={() => openEditModal(usr)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Edit User Name, Email & Password"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active / Inactive Status */}
                          <button
                            onClick={() => handleToggleStatus(usr)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            }`}
                            title={isActive ? 'Block User from Login' : 'Unblock User'}
                          >
                            {isActive ? 'Block' : 'Unblock'}
                          </button>

                          {/* Quick Password Reset */}
                          <button
                            onClick={() => { setResetSuccess(null); setNewPassword(''); setResetModalUserId(usr.id); }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => setDeleteTarget(usr)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-colors cursor-pointer"
                            title="Delete Account Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold italic">Active CEO Session</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF ACCOUNT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
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

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Hassan"
                  value={createFullName}
                  onChange={e => setCreateFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Email Address (Login ID) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff.ahmed@haidermemorial.edu.pk"
                  value={createEmail}
                  onChange={e => setCreateEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="Enter initial password (default: password123)"
                  value={createPassword}
                  onChange={e => setCreatePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF ACCOUNT MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Staff Account & Credentials
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Staff Email Address (Login ID) *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password (Leave or Update)
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Set or change password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as UserStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                >
                  <option value="active">Active (Can Log in & Issue Invoices)</option>
                  <option value="inactive">Inactive (Blocked from System)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {submittingEdit ? 'Saving...' : 'Save Staff Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESET PASSWORD MODAL */}
      {resetModalUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" /> Quick Reset Password
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold"
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

      {/* DELETE STAFF CONFIRMATION DIALOG MODAL */}
      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.full_name}
          itemType="Staff User Account"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
