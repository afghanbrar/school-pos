import React, { useState, useEffect } from 'react';
import type { CustomerProfile, Transaction, SchoolSettings, PaymentMethod } from '../../types';
import { db } from '../../services/db';
import { useToast } from '../../context/ToastContext';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { 
  UserCheck, 
  Search, 
  Plus, 
  GraduationCap, 
  Building2, 
  Phone, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  X, 
  Edit3, 
  Trash2, 
  Banknote, 
  Smartphone
} from 'lucide-react';

interface CustomerManagementProps {
  settings: SchoolSettings;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ settings }) => {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'student' | 'external' | 'dues'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);

  // Form Fields
  const [profileType, setProfileType] = useState<'student' | 'external_school'>('student');
  const [fullName, setFullName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Profile Detail Drawer/Modal
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);

  // Payment Modal State
  const [payModalCustomer, setPayModalCustomer] = useState<CustomerProfile | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payError, setPayError] = useState<string | null>(null);

  // Deletion Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<CustomerProfile | null>(null);

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(category => {
      if (category === 'customers' || category === 'transactions' || category === 'all') {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const loadData = async () => {
    const custs = await db.getCustomers();
    const txs = await db.getTransactions();
    setCustomers(custs);
    setTransactions(txs);
  };

  const getCustomerTransactions = (cust: CustomerProfile): Transaction[] => {
    return transactions.filter(tx => {
      const matchesName = tx.buyer_name.toLowerCase().trim() === cust.full_name.toLowerCase().trim();
      const matchesRoll = Boolean(cust.roll_no && tx.student_roll_no && tx.student_roll_no.toLowerCase().trim() === cust.roll_no.toLowerCase().trim());
      const matchesSchool = Boolean(cust.school_name && tx.school_name && tx.school_name.toLowerCase().trim() === cust.school_name.toLowerCase().trim());
      return matchesName || matchesRoll || matchesSchool;
    });
  };

  const getCustomerDues = (cust: CustomerProfile): number => {
    const custTxs = getCustomerTransactions(cust);
    return custTxs.reduce((sum, tx) => sum + tx.pending_amount, 0);
  };

  const openAddEditModal = (custToEdit?: CustomerProfile) => {
    setFormError(null);
    if (custToEdit) {
      setEditingCustomer(custToEdit);
      setProfileType(custToEdit.type === 'student' ? 'student' : 'external_school');
      setFullName(custToEdit.full_name);
      setRollNo(custToEdit.roll_no || '');
      setClassGrade(custToEdit.class_grade || '');
      setSchoolName(custToEdit.school_name || '');
      setPhone(custToEdit.phone || '');
      setEmail(custToEdit.email || '');
      setAddress(custToEdit.address || '');
    } else {
      setEditingCustomer(null);
      setProfileType('student');
      setFullName('');
      setRollNo(`HMS-2026-${Math.floor(100 + Math.random() * 900)}`);
      setClassGrade('Grade 9-A');
      setSchoolName('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }

    try {
      const payload = {
        type: profileType === 'student' ? ('student' as const) : ('external_school' as const),
        full_name: fullName.trim(),
        roll_no: profileType === 'student' ? rollNo.trim() : undefined,
        class_grade: profileType === 'student' ? classGrade.trim() : undefined,
        school_name: profileType === 'external_school' ? schoolName.trim() : undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      };

      if (editingCustomer) {
        await db.updateCustomer(editingCustomer.id, payload);
        showToast('success', 'Profile Updated', `Updated profile for "${payload.full_name}".`);
      } else {
        await db.createCustomer(payload);
        showToast('success', 'Profile Created', `Created new profile for "${payload.full_name}".`);
      }

      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer profile.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await db.deleteCustomer(deleteTarget.id);
    showToast('delete', 'Profile Deleted', `Deleted record for "${deleteTarget.full_name}".`);
    setDeleteTarget(null);
    if (selectedProfile?.id === deleteTarget.id) {
      setSelectedProfile(null);
    }
    await loadData();
  };

  const openPayModal = (cust: CustomerProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dues = getCustomerDues(cust);
    if (dues <= 0) {
      showToast('warning', 'No Dues Pending', `${cust.full_name} has zero pending dues.`);
      return;
    }
    setPayModalCustomer(cust);
    setPayAmount(dues);
    setPayMethod('cash');
    setPayError(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalCustomer || payAmount === '' || payAmount <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }

    try {
      const settled = await db.payCustomerDues(payModalCustomer.id, Number(payAmount), payMethod);
      showToast('success', 'Payment Received', `Received ${currency} ${settled.toLocaleString()} from ${payModalCustomer.full_name}. Reports updated!`);
      setPayModalCustomer(null);
      await loadData();
      if (selectedProfile?.id === payModalCustomer.id) {
        const updatedCusts = await db.getCustomers();
        const refreshed = updatedCusts.find(c => c.id === payModalCustomer.id);
        if (refreshed) setSelectedProfile(refreshed);
      }
    } catch (err: any) {
      setPayError(err.message || 'Failed to process dues payment.');
    }
  };

  const filteredCustomers = customers.filter(cust => {
    const dues = getCustomerDues(cust);
    const matchesSearch = 
      cust.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust.roll_no && cust.roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cust.phone && cust.phone.includes(searchQuery)) ||
      (cust.school_name && cust.school_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = 
      typeFilter === 'all' ||
      (typeFilter === 'student' && cust.type === 'student') ||
      (typeFilter === 'external' && cust.type === 'external_school') ||
      (typeFilter === 'dues' && dues > 0);

    return matchesSearch && matchesType;
  });

  const totalDuesAcrossAll = customers.reduce((acc, c) => acc + getCustomerDues(c), 0);
  const clearedProfilesCount = customers.filter(c => getCustomerDues(c) <= 0).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" /> Customer & Student Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage profiles, review complete transaction histories, and collect pending dues with real-time report syncing.
          </p>
        </div>

        <button
          onClick={() => openAddEditModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Profile
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Registered Profiles</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{customers.length} Profiles</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Pending Dues</div>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {currency} {totalDuesAcrossAll.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">All Clear Profiles</div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{clearedProfilesCount} Profiles</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll #, school, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Profiles ({customers.length})
          </button>
          <button
            onClick={() => setTypeFilter('student')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              typeFilter === 'student'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setTypeFilter('external')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              typeFilter === 'external'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            External Customers
          </button>
          <button
            onClick={() => setTypeFilter('dues')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              typeFilter === 'dues'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Has Pending Dues
          </button>
        </div>
      </div>

      {/* Profiles Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <UserCheck className="w-8 h-8 mb-2 stroke-1 text-slate-400" />
            <p>No customer or student profiles match the filter criteria.</p>
          </div>
        ) : (
          filteredCustomers.map(cust => {
            const dues = getCustomerDues(cust);
            const isCleared = dues <= 0;
            const custTxs = getCustomerTransactions(cust);

            return (
              <div
                key={cust.id}
                onClick={() => setSelectedProfile(cust)}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  {/* Top Badge & Clearance Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      cust.type === 'student'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {cust.type === 'student' ? <GraduationCap className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      {cust.type === 'student' ? 'Student Profile' : 'External School'}
                    </span>

                    {/* Requirement: CLEARANCE INDICATOR - GREEN TICK (ALL CLEAR) BADGE */}
                    {isCleared ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold rounded-full animate-fadeIn">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> All Clear
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10px] font-bold rounded-full animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Due: {currency} {dues.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 transition-colors">
                    {cust.full_name}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {cust.type === 'student' ? (
                      <>
                        <div>Roll #: <span className="font-semibold text-slate-700 dark:text-slate-300">{cust.roll_no || 'N/A'}</span></div>
                        <div>Class / Grade: <span className="font-semibold text-slate-700 dark:text-slate-300">{cust.class_grade || 'N/A'}</span></div>
                      </>
                    ) : (
                      <div>School / Org: <span className="font-semibold text-slate-700 dark:text-slate-300">{cust.school_name || 'External'}</span></div>
                    )}
                    {cust.phone && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" /> {cust.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{custTxs.length}</span> Orders History
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {/* In-Profile Pay Button */}
                    {!isCleared && (
                      <button
                        onClick={(e) => openPayModal(cust, e)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Pay
                      </button>
                    )}

                    <button
                      onClick={() => openAddEditModal(cust)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cust)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PROFILE DETAIL & TRANSACTION HISTORY DRAWER / MODAL */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
                  {selectedProfile.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedProfile.full_name}
                    {getCustomerDues(selectedProfile) <= 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> All Clear
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                        Pending: {currency} {getCustomerDues(selectedProfile).toLocaleString()}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedProfile.type === 'student' ? `Roll #: ${selectedProfile.roll_no || 'N/A'} | Class: ${selectedProfile.class_grade || 'N/A'}` : `School: ${selectedProfile.school_name || 'External'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getCustomerDues(selectedProfile) > 0 && (
                  <button
                    onClick={() => openPayModal(selectedProfile)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    <Banknote className="w-4 h-4" /> Pay Dues Now
                  </button>
                )}
                <button onClick={() => setSelectedProfile(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Content Body */}
            <div className="overflow-y-auto flex-1 p-2 space-y-6">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone Contact</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProfile.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProfile.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Campus Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProfile.address || 'N/A'}</span>
                </div>
              </div>

              {/* Complete Transaction Shopping History */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Complete Transaction & Shopping History
                </h4>

                {getCustomerTransactions(selectedProfile).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                    No shopping transaction history recorded for this profile yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getCustomerTransactions(selectedProfile).map(tx => (
                      <div key={tx.id} className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white mr-2">{tx.invoice_number}</span>
                            <span className="text-[11px] text-slate-400">{new Date(tx.created_at).toLocaleString()}</span>
                          </div>
                          {tx.pending_amount > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                              Pending: {currency} {tx.pending_amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                              Paid in Full
                            </span>
                          )}
                        </div>

                        {/* Items Breakdown */}
                        <div className="space-y-1">
                          {tx.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                              <span>• {item.product_name} ({item.quantity} x {currency} {item.unit_price.toLocaleString()})</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{currency} {item.total_price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                          <span>Total Amount: {currency} {(tx.total_amount - tx.discount).toLocaleString()}</span>
                          <span className="text-emerald-600">Paid: {currency} {tx.paid_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-PROFILE PAYMENT MODAL */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" /> Collect Dues Payment
              </h3>
              <button onClick={() => setPayModalCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{payError}</div>
            )}

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{payModalCustomer.full_name}</div>
                <div className="text-rose-600 dark:text-rose-400 font-extrabold">
                  Current Total Pending Dues: {currency} {getCustomerDues(payModalCustomer).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount to Collect ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={getCustomerDues(payModalCustomer)}
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-emerald-600 text-base"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      payMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('bank_transfer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      payMethod === 'bank_transfer' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('easypaisa')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      payMethod === 'easypaisa' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> EasyPaisa
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700"
                >
                  Confirm & Sync Reports
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT PROFILE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                {editingCustomer ? 'Edit Profile Details' : 'Create Customer or Student Profile'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{formError}</div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setProfileType('student')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    profileType === 'student' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Student Profile
                </button>
                <button
                  type="button"
                  onClick={() => setProfileType('external_school')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    profileType === 'external_school' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  External Customer / School
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Ali Khan"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold"
                />
              </div>

              {profileType === 'student' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Roll Number</label>
                    <input
                      type="text"
                      placeholder="e.g. HMS-2026-042"
                      value={rollNo}
                      onChange={e => setRollNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Grade</label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 9-A"
                      value={classGrade}
                      onChange={e => setClassGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">External School / Org Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard Grammar School"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Address Line</label>
                <input
                  type="text"
                  placeholder="Campus / Residential Address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700"
                >
                  {editingCustomer ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION MODAL */}
      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.full_name}
          itemType="Product"
          title="Delete Customer Profile"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
