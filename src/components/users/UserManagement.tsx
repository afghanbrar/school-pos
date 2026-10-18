import React, { useState, useEffect } from 'react';
import type { UserProfile, UserStatus, UserRole } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, 
  ShieldAlert,
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
  Save,
  Briefcase
} from 'lucide-react';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { UserStatusConfirmModal } from './UserStatusConfirmModal';
import { formatRoleLabel, getRoleBadgeStyle, AVAILABLE_ROLES } from '../../utils/roleUtils';

export const UserManagement: React.FC = () => {
  const { isPrincipal, isCeo, user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Staff Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFullName, setCreateFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('cashier');
  const [createGender, setCreateGender] = useState<'female' | 'male' | 'other'>('female');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('staff');
  const [editGender, setEditGender] = useState<'female' | 'male' | 'other'>('female');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editError, setEditError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Block / Unblock Modal State
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ user: UserProfile; targetStatus: UserStatus } | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Delete Staff Modal State
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [accessDeniedModalOpen, setAccessDeniedModalOpen] = useState(false);

  // Password Reset Modal State
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    const unsub = db.subscribe(category => {
      if (category === 'users' || category === 'all') {
        loadUsers();
      }
    });
    return () => unsub();
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

    const name = createFullName.trim();
    const email = createEmail.trim();
    const pwd = createPassword.trim() || 'password123';
    const role = createRole;
    const gender = createGender;

    setCreateFullName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('cashier');
    setCreateGender('female');
    setIsCreateModalOpen(false);

    try {
      const newStaff = await db.createStaffUser(name, email, pwd, role, gender);
      setUsers(prev => [newStaff, ...prev]);
      showToast('success', 'Account Created', `Created ${formatRoleLabel(newStaff.role)} account for ${newStaff.full_name} (${newStaff.email}).`);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create account.');
      await loadUsers();
    }
  };

  const openEditModal = (staff: UserProfile) => {
    setEditingStaff(staff);
    setEditFullName(staff.full_name);
    setEditEmail(staff.email);
    setEditPassword(staff.password || '');
    setEditRole(staff.role || 'staff');
    setEditGender((staff.gender as any) || 'female');
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

    const targetStaff = editingStaff;
    const editPayload = {
      full_name: editFullName.trim(),
      email: editEmail.trim(),
      password: editPassword.trim() || undefined,
      role: editRole,
      gender: editGender,
      status: editStatus,
    };

    setEditingStaff(null);
    setSubmittingEdit(true);
    try {
      const updated = await db.updateStaffUser(targetStaff.id, editPayload);
      setUsers(prev => prev.map(u => u.id === targetStaff.id ? updated : u));
      showToast('success', 'User Updated', `Updated profile and credentials for ${editPayload.full_name}.`);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update account.');
      await loadUsers();
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteClick = (usr: UserProfile) => {
    if (!isCeo) {
      setAccessDeniedModalOpen(true);
      return;
    }
    setDeleteTarget(usr);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setUsers(prev => prev.filter(u => u.id !== target.id));
    try {
      await db.deleteStaffUser(target.id);
      showToast('delete', 'User Deleted', `Account ${target.full_name} has been removed.`);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
      await loadUsers();
    }
  };

  const handleToggleStatusClick = (userToToggle: UserProfile) => {
    if (userToToggle.role === 'ceo' || (userToToggle.role === 'principal' && userToToggle.email === 'ceo@haidermemorial.edu.pk')) {
      alert('CEO Super Admin account status cannot be set to inactive.');
      return;
    }

    const nextStatus: UserStatus = userToToggle.status === 'active' ? 'inactive' : 'active';
    setStatusChangeTarget({ user: userToToggle, targetStatus: nextStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    setStatusChangeLoading(true);
    try {
      await db.updateUserStatus(statusChangeTarget.user.id, statusChangeTarget.targetStatus);
      showToast(
        statusChangeTarget.targetStatus === 'inactive' ? 'warning' : 'success',
        'Account Status Updated',
        `${statusChangeTarget.user.full_name} is now ${statusChangeTarget.targetStatus.toUpperCase()}.`
      );
      setStatusChangeTarget(null);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setStatusChangeLoading(false);
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
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isPrincipal) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <Lock className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Restricted CEO Admin Access</h3>
        <p className="text-xs text-slate-500 mt-2">
          Only the CEO (Super Admin) has authority to manage accounts, assign roles, edit emails, passwords and security permissions.
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
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Staff Management & Role Control</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 inline mr-1" /> CEO Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create user accounts with assigned roles (CEO, Cashier, Principal, Staff, Accountant, Manager), manage permissions and block/unblock status.
          </p>
        </div>

        <button
          onClick={() => { setCreateError(null); setCreateRole('cashier'); setIsCreateModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Create New Account
        </button>
      </div>

      {/* Users List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
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
                <th className="p-4">User Details</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Management Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredUsers.map(usr => {
                const isCeoUser = usr.role === 'ceo' || usr.email === 'ceo@haidermemorial.edu.pk';
                const isActive = usr.status === 'active';
                const badgeStyle = getRoleBadgeStyle(usr.role);

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
                        {usr.gender && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            {usr.gender}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" /> {usr.email}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        {isCeoUser && <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />}
                        {formatRoleLabel(usr.role)}
                      </span>
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
                          {/* Edit User Account */}
                          <button
                            onClick={() => openEditModal(usr)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Edit User Name, Email, Role & Password"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active / Inactive Status with Confirmation Prompt */}
                          <button
                            onClick={() => handleToggleStatusClick(usr)}
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
                            onClick={() => handleDeleteClick(usr)}
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

      {/* CREATE USER ACCOUNT MODAL WITH ROLE-SELECTION DROPDOWN */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Create Authorized Account
              </h3>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-6 pt-4 overflow-y-auto flex-1">
              {createError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" /> 
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
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
                    Email Address (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. user.name@haidermemorial.edu.pk"
                    value={createEmail}
                    onChange={e => setCreateEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Role Selection Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> User Role *
                    </label>
                    <select
                      value={createRole}
                      onChange={e => setCreateRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-semibold text-xs"
                    >
                      {AVAILABLE_ROLES.map(r => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gender *
                    </label>
                    <select
                      value={createGender}
                      onChange={e => setCreateGender(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-semibold text-xs"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
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

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER ACCOUNT MODAL WITH ROLE-SELECTION DROPDOWN */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Account & Role Details
              </h3>
              <button 
                type="button"
                onClick={() => setEditingStaff(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 pt-4 overflow-y-auto flex-1">
              {editError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" /> 
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditStaff} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
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
                    Email Address (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Role Selection Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Assigned Role *
                    </label>
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-semibold text-xs"
                    >
                      {AVAILABLE_ROLES.map(r => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gender *
                    </label>
                    <select
                      value={editGender}
                      onChange={e => setEditGender(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-semibold text-xs"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password (Leave blank to keep unchanged)
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

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 sticky bottom-0 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RESET PASSWORD MODAL */}
      {resetModalUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
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
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP PROMPT FOR BLOCKING / UNBLOCKING USERS */}
      {statusChangeTarget && (
        <UserStatusConfirmModal
          user={statusChangeTarget.user}
          targetStatus={statusChangeTarget.targetStatus}
          onConfirm={handleConfirmStatusChange}
          onCancel={() => setStatusChangeTarget(null)}
          loading={statusChangeLoading}
        />
      )}

      {/* ACCESS RESTRICTED POPUP MODAL (IF NON-CEO USER ATTEMPTS TO DELETE) */}
      {accessDeniedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/50 pb-3">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" /> Permission Restricted
              </h3>
              <button 
                onClick={() => setAccessDeniedModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-2">
              <p className="font-extrabold text-sm text-rose-700 dark:text-rose-300">
                CEO Super Admin Hi Delete Kar Sakta Hy
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                User account delete karny ka ikhtiyar sirf aur sirf CEO (Super Admin) k pass hy. Agar kisi user ka account delete karna hy to bara-e-meherbani CEO Super Admin se rabta karen.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAccessDeniedModalOpen(false)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Samajh Aa Gaya / Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STAFF CONFIRMATION DIALOG MODAL */}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete User Account"
          itemName={`${deleteTarget.full_name} (${formatRoleLabel(deleteTarget.role)})`}
          itemType="User Account"
          message={`Are you sure you want to permanently delete the account of ${deleteTarget.full_name} (${deleteTarget.email})? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

