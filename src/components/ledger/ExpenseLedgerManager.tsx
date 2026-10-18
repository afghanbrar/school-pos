import React, { useState, useEffect } from 'react';
import type { 
  SchoolExpense, 
  CashHandover, 
  Transaction, 
  UserProfile, 
  SchoolSettings,
  ExpenseCategory 
} from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { printCashHandoverVoucher } from '../../utils/print';
import { 
  DollarSign, 
  TrendingDown, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Receipt, 
  Trash2, 
  Printer, 
  ArrowRight,
  Send,
  X,
  Wallet
} from 'lucide-react';

interface ExpenseLedgerManagerProps {
  settings: SchoolSettings;
}

export const ExpenseLedgerManager: React.FC<ExpenseLedgerManagerProps> = ({ settings }) => {
  const { user, isPrincipal } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ledger' | 'expenses' | 'handovers'>('ledger');
  
  // Core Data States
  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [handovers, setHandovers] = useState<CashHandover[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  
  // Selected Staff Filter for CEO
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('utilities');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expChannel, setExpChannel] = useState('Cash');
  const [expReceipt, setExpReceipt] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expError, setExpError] = useState<string | null>(null);

  // Handover Submission Modal State (Staff)
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverStartDate, setHandoverStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [handoverEndDate, setHandoverEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // CEO Rejection / Approval Modal State
  const [selectedHandoverForAction, setSelectedHandoverForAction] = useState<CashHandover | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Voucher View Modal State
  const [viewVoucherHandover, setViewVoucherHandover] = useState<CashHandover | null>(null);

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadLedgerData();
    const unsub = db.subscribe(category => {
      if (category === 'expenses' || category === 'handovers' || category === 'transactions' || category === 'users' || category === 'all') {
        loadLedgerData();
      }
    });
    return () => unsub();
  }, []);

  const loadLedgerData = async () => {
    const expList = await db.getExpenses();
    const hndList = await db.getCashHandovers();
    const txList = await db.getTransactions();
    const userList = await db.getUsers();

    setExpenses(expList);
    setHandovers(hndList);
    setTransactions(txList);
    setStaffUsers(userList.filter(u => u.role === 'staff'));
  };

  /* ================= LEDGER CALCULATIONS ================= */
  // Filter transactions and expenses based on role and selected staff
  const filteredTxs = transactions.filter(t => {
    if (isPrincipal && selectedStaffId !== 'all') {
      return t.staff_id === selectedStaffId;
    }
    if (!isPrincipal) {
      return t.staff_id === user?.id;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (isPrincipal && selectedStaffId !== 'all') {
      return e.staff_id === selectedStaffId;
    }
    if (!isPrincipal) {
      return e.staff_id === user?.id;
    }
    return true;
  });

  // Calculate gross sales
  const grossCashSales = filteredTxs
    .filter(t => t.payment_method === 'cash')
    .reduce((sum, t) => sum + t.paid_amount, 0);

  const grossDigitalSales = filteredTxs
    .filter(t => t.payment_method !== 'cash')
    .reduce((sum, t) => sum + t.paid_amount, 0);

  const totalGrossSales = grossCashSales + grossDigitalSales;

  // Calculate total staff expenses deducted
  const totalCashExpenses = filteredExpenses
    .filter(e => e.payment_channel.toLowerCase().includes('cash'))
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Cash in Hand = Gross Cash Collected minus Cash Expenses deducted
  const netCashInHand = Math.max(0, grossCashSales - totalCashExpenses);

  // Total already approved handovers
  const totalApprovedHandovers = handovers
    .filter(h => h.status === 'approved' && (isPrincipal ? (selectedStaffId === 'all' || h.staff_id === selectedStaffId) : h.staff_id === user?.id))
    .reduce((sum, h) => sum + h.net_cash_submitted, 0);

  /* ================= EXPENSE HANDLERS ================= */
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);

    if (!expTitle.trim() || expAmount === '' || expAmount <= 0) {
      setExpError('Please provide a valid expense title and amount.');
      return;
    }

    try {
      await db.createExpense({
        staff_id: user?.id || 'usr-staff-01',
        staff_name: user?.full_name || 'Staff Member',
        title: expTitle.trim(),
        category: expCategory,
        amount: Number(expAmount),
        payment_channel: expChannel,
        receipt_ref: expReceipt.trim() || undefined,
        description: expDesc.trim() || undefined,
      });

      showToast('success', 'Expense Logged', `Deducted PKR ${Number(expAmount).toLocaleString()} from cash ledger.`);
      setIsExpenseModalOpen(false);
      setExpTitle('');
      setExpAmount('');
      setExpReceipt('');
      setExpDesc('');
      await loadLedgerData();
    } catch (err: any) {
      setExpError(err.message || 'Failed to record expense.');
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete expense record "${title}"?`)) {
      await db.deleteExpense(id);
      showToast('delete', 'Expense Removed', `Deleted expense record "${title}".`);
      await loadLedgerData();
    }
  };

  /* ================= HANDOVER SUBMISSION (STAFF) ================= */
  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();

    if (netCashInHand <= 0) {
      alert('Cannot submit handover: Calculated net cash balance is 0 or negative.');
      return;
    }

    try {
      const newHandover = await db.submitCashHandover({
        staff_id: user?.id || 'usr-staff-01',
        staff_name: user?.full_name || 'Staff Cashier',
        period_start: new Date(handoverStartDate).toISOString(),
        period_end: new Date(handoverEndDate).toISOString(),
        gross_sales_cash: grossCashSales,
        gross_sales_digital: grossDigitalSales,
        total_gross_sales: totalGrossSales,
        total_expenses_deducted: totalCashExpenses,
        net_cash_submitted: netCashInHand,
        expense_ids: filteredExpenses.map(e => e.id),
        transaction_ids: filteredTxs.map(t => t.id),
        notes: handoverNotes.trim() || undefined,
      });

      showToast('success', 'Handover Submitted', `Cash Handover ${newHandover.handover_code} submitted to CEO for approval.`);
      setIsHandoverModalOpen(false);
      setHandoverNotes('');
      await loadLedgerData();
      setActiveTab('handovers');
    } catch (err: any) {
      alert(err.message || 'Failed to submit handover.');
    }
  };

  /* ================= CEO APPROVE / REJECT ACTIONS ================= */
  const handleConfirmCeoAction = async () => {
    if (!selectedHandoverForAction || !actionType) return;

    try {
      if (actionType === 'approve') {
        await db.approveCashHandover(
          selectedHandoverForAction.id,
          user?.full_name || 'Chief Executive Officer (CEO)',
          actionNotes.trim() || undefined
        );
        showToast('success', 'Handover Approved', `Immutable cash transfer certificate created for ${selectedHandoverForAction.handover_code}.`);
      } else if (actionType === 'reject') {
        if (!rejectionReason.trim()) {
          alert('Please enter a rejection reason.');
          return;
        }
        await db.rejectCashHandover(
          selectedHandoverForAction.id,
          user?.full_name || 'Chief Executive Officer (CEO)',
          rejectionReason.trim()
        );
        showToast('warning', 'Handover Returned', `Handover ${selectedHandoverForAction.handover_code} rejected and returned to staff.`);
      }

      setSelectedHandoverForAction(null);
      setActionType(null);
      setActionNotes('');
      rejectionReason && setRejectionReason('');
      await loadLedgerData();
    } catch (err: any) {
      alert(err.message || 'Failed to process handover action.');
    }
  };

  const pendingHandovers = handovers.filter(h => h.status === 'pending');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Financial Ledger & Cash Handover System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log school operating expenses deducted from sales revenue & execute dispute-free cash transfers to CEO.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Staff Expense Button */}
          <button
            onClick={() => { setExpError(null); setIsExpenseModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" /> Log School Expense
          </button>

          {/* Staff Submit Handover Button */}
          {!isPrincipal && (
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Submit Handover to CEO
            </button>
          )}
        </div>
      </div>

      {/* CEO Pending Acknowledgment Alert Banner (if pending handovers exist) */}
      {isPrincipal && pendingHandovers.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-indigo-500/15 border-2 border-amber-500/40 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-md">
              {pendingHandovers.length}
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pending Cash Handovers Requiring CEO Approval</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Staff have submitted month-end cash revenue for physical verification and CEO digital acknowledgment.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('handovers')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            Review & Acknowledge Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CEO Staff Filter Selector */}
      {isPrincipal && (
        <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-400">Filter Ledger by Cashier:</span>
          <select
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-semibold text-slate-900 dark:text-white"
          >
            <option value="all">Global (All Staff Members)</option>
            {staffUsers.map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
            ))}
          </select>
        </div>
      )}

      {/* Dynamic Calculated Financial Ledger Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales Cash */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Cash Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {currency} {grossCashSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            + {currency} {grossDigitalSales.toLocaleString()} via Bank/Digital
          </div>
        </div>

        {/* Staff Deducted Expenses */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deducted Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            - {currency} {totalCashExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {filteredExpenses.length} school operating expenses logged
          </div>
        </div>

        {/* Calculated Net Cash in Hand */}
        <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl shadow-lg shadow-emerald-900/20 space-y-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Net Cash in Hand</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-black relative z-10">
            {currency} {netCashInHand.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-100 font-semibold relative z-10">
            (Cash Sales − Cash Expenses)
          </div>
        </div>

        {/* Approved CEO Handovers */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acknowledged Transfers</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {currency} {totalApprovedHandovers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Immutable vault transfer audit
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Dynamic Ledger Breakdown
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Logged School Expenses ({filteredExpenses.length})
        </button>

        <button
          onClick={() => setActiveTab('handovers')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'handovers'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          CEO Cash Handovers ({handovers.length})
          {pendingHandovers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          )}
        </button>
      </div>

      {/* TAB 1: DYNAMIC LEDGER BREAKDOWN */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Mathematical Reconciliation Formula (Dispute Prevention)
            </h3>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2.5 font-mono">
              <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-300 font-bold">
                <span>[+] Total Gross Sales (Cash Inflows):</span>
                <span>{currency} {grossCashSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-bold">
                <span>[-] Total Staff Operational Expenses (Cash Deductions):</span>
                <span>- {currency} {totalCashExpenses.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-300 dark:border-slate-600 pt-2 flex justify-between items-center text-slate-900 dark:text-white font-black text-sm">
                <span>[=] Total Net Physical Cash Handover Amount:</span>
                <span>{currency} {netCashInHand.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed">
              * Note: Digital payments (Bank Transfers & EasyPaisa) are banked directly into institutional accounts and are not deducted from physical cash in hand.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOGGED EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Expense Title & Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Logged By</th>
                  <th className="py-3.5 px-4">Payment Channel</th>
                  <th className="py-3.5 px-4">Receipt Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount Deducted</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No school expenses logged for this period.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{exp.title}</div>
                        {exp.description && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{exp.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {exp.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {exp.staff_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{exp.payment_channel}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        {exp.receipt_ref || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                        - {currency} {exp.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete expense entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CASH HANDOVER RECORDS & CEO ACKNOWLEDGMENT PROMPT */}
      {activeTab === 'handovers' && (
        <div className="space-y-4">
          {handovers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No cash handover records submitted yet.
            </div>
          ) : (
            handovers.map(handover => {
              const isPending = handover.status === 'pending';
              const isApproved = handover.status === 'approved';
              const isRejected = handover.status === 'rejected';

              return (
                <div
                  key={handover.id}
                  className={`p-5 rounded-3xl border transition-all shadow-sm ${
                    isPending
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : isApproved
                      ? 'bg-white dark:bg-slate-900 border-emerald-300/80 dark:border-emerald-900/60'
                      : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Handover Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded bg-slate-900 text-white">
                          {handover.handover_code}
                        </span>
                        {isPending && (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full border border-amber-300">
                            PENDING CEO ACKNOWLEDGMENT
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACKNOWLEDGED & APPROVED
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-full border border-rose-300 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> REJECTED / DISCREPANCY
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Submitted by <strong>{handover.staff_name}</strong> on {new Date(handover.submitted_at).toLocaleString()}
                      </div>

                      {/* Mathematical summary */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                        <span className="text-slate-600 dark:text-slate-400">Gross Sales: {currency} {handover.total_gross_sales.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-rose-600 dark:text-rose-400">Expenses Deducted: - {currency} {handover.total_expenses_deducted.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                          Net Cash Handover: {currency} {handover.net_cash_submitted.toLocaleString()}
                        </span>
                      </div>

                      {handover.notes && (
                        <div className="text-[11px] text-slate-500 italic">
                          Staff Note: "{handover.notes}"
                        </div>
                      )}

                      {/* Approval metadata */}
                      {isApproved && handover.acknowledged_by && (
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Verified & Acknowledged by <strong>{handover.acknowledged_by}</strong> on {new Date(handover.acknowledged_at!).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {isRejected && handover.rejection_reason && (
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-[11px] text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                          <strong>Rejection Reason:</strong> {handover.rejection_reason}
                        </div>
                      )}
                    </div>

                    {/* CEO Action Buttons (Green Approve & Red Reject) */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => setViewVoucherHandover(handover)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Print / View Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" /> Voucher
                      </button>

                      {isPrincipal && isPending && (
                        <>
                          {/* GREEN APPROVE BUTTON */}
                          <button
                            onClick={() => {
                              setSelectedHandoverForAction(handover);
                              setActionType('approve');
                              setActionNotes('');
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve & Acknowledge
                          </button>

                          {/* RED REJECT BUTTON */}
                          <button
                            onClick={() => {
                              setSelectedHandoverForAction(handover);
                              setActionType('reject');
                              setRejectionReason('');
                            }}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" /> Reject / Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: LOG NEW SCHOOL EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-600" /> Log School Expense
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {expError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{expError}</div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Generator Diesel Fuel / POS Paper Rolls"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                  >
                    <option value="utilities">Utilities & Generator</option>
                    <option value="stationery">Stationery & Rolls</option>
                    <option value="maintenance">Campus Repairs</option>
                    <option value="refreshments">Staff Refreshments</option>
                    <option value="transport">Transport / Logistics</option>
                    <option value="emergency">Emergency Procurement</option>
                    <option value="other">Other Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ({currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="3500"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-extrabold text-rose-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paid Via</label>
                  <select
                    value={expChannel}
                    onChange={e => setExpChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                  >
                    <option value="Cash">Cash (Deducted from sales)</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt / Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. PSO-PUMP-9812"
                    value={expReceipt}
                    onChange={e => setExpReceipt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Detailed purpose of the expense"
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md"
                >
                  Log & Deduct Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT CASH HANDOVER (STAFF) */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Submit Cash Handover to CEO
              </h3>
              <button onClick={() => setIsHandoverModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHandover} className="space-y-4 text-xs">
              {/* Calculated Balance Box */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-mono">
                  <span>Gross Cash Sales:</span>
                  <span>{currency} {grossCashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-mono">
                  <span>Deducted Operating Expenses:</span>
                  <span>- {currency} {totalCashExpenses.toLocaleString()}</span>
                </div>
                <div className="border-t border-emerald-200 dark:border-emerald-800 pt-2 flex justify-between items-center text-emerald-800 dark:text-emerald-300 font-black text-sm font-mono">
                  <span>Net Physical Cash to Submit:</span>
                  <span>{currency} {netCashInHand.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Period From</label>
                  <input
                    type="date"
                    required
                    value={handoverStartDate}
                    onChange={e => setHandoverStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Period To</label>
                  <input
                    type="date"
                    required
                    value={handoverEndDate}
                    onChange={e => setHandoverEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Handover Submission Notes for CEO</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Month-end cash closure. Physical cash counted and ready in vault pouch."
                  value={handoverNotes}
                  onChange={e => setHandoverNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Confirm & Submit to CEO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CEO APPROVE / REJECT ACKNOWLEDGMENT */}
      {selectedHandoverForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {actionType === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                {actionType === 'approve' ? 'Approve & Acknowledge Cash Transfer' : 'Reject Handover & Report Discrepancy'}
              </h3>
              <button onClick={() => setSelectedHandoverForAction(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1.5">
              <div><strong>Handover Code:</strong> {selectedHandoverForAction.handover_code}</div>
              <div><strong>Staff Submitter:</strong> {selectedHandoverForAction.staff_name}</div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                <strong>Net Cash Amount:</strong> {currency} {selectedHandoverForAction.net_cash_submitted.toLocaleString()}
              </div>
            </div>

            {actionType === 'approve' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CEO Audit & Vault Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Physical cash verified and deposited into central vault."
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs dark:text-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Cash count was short by PKR 500 / missing fuel receipts."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs dark:text-white"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedHandoverForAction(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCeoAction}
                className={`px-5 py-2 text-white rounded-xl font-bold text-xs shadow-md ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionType === 'approve' ? 'Sign & Approve Cash Handover' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMMUTABLE PRINTABLE VOUCHER */}
      {viewVoucherHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Cash Handover Acknowledgment Voucher
              </h3>
              <button onClick={() => setViewVoucherHandover(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Paper Format */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">{settings.name}</div>
                <div className="text-[10px] text-slate-500">Official Cash Transfer Audit Voucher</div>
                <div className="font-black text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  VOUCHER #{viewVoucherHandover.handover_code}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><strong>Staff Submitter:</strong> {viewVoucherHandover.staff_name}</div>
                <div><strong>Submission Date:</strong> {new Date(viewVoucherHandover.submitted_at).toLocaleDateString()}</div>
                <div><strong>Audit Status:</strong> {viewVoucherHandover.status.toUpperCase()}</div>
                <div><strong>CEO Signature:</strong> {viewVoucherHandover.acknowledged_by || 'Pending'}</div>
              </div>

              <div className="border-t border-b border-slate-200 dark:border-slate-700 py-2 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Cash Collected:</span>
                  <span>{currency} {viewVoucherHandover.gross_sales_cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Deducted Staff Expenses:</span>
                  <span>- {currency} {viewVoucherHandover.total_expenses_deducted.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-400 pt-1 border-t border-slate-300 dark:border-slate-600">
                  <span>NET PHYSICAL CASH HANDOVER:</span>
                  <span>{currency} {viewVoucherHandover.net_cash_submitted.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500">
                This digital voucher constitutes an immutable legal audit record of physical cash transferred from the staff cashier to the CEO administration.
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-center text-[10px] text-slate-400 font-bold">
                developed by ai mobiles and technology • +92 311 7260898
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewVoucherHandover(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => printCashHandoverVoucher(viewVoucherHandover, settings)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print Voucher Proof (Direct A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
