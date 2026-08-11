import React, { useState, useEffect } from 'react';
import type { Transaction, SchoolSettings } from '../../types';
import { db } from '../../services/db';
import { InvoiceModal } from '../pos/InvoiceModal';
import { 
  Receipt, 
  Search, 
  Download, 
  Eye
} from 'lucide-react';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

interface TransactionHistoryProps {
  settings: SchoolSettings;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ settings }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadTxHistory();
  }, []);

  const loadTxHistory = async () => {
    const list = await db.getTransactions();
    setTransactions(list);
  };

  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = 
      tx.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.student_roll_no && tx.student_roll_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'paid' && tx.pending_amount <= 0) ||
      (statusFilter === 'pending' && tx.pending_amount > 0);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" /> Sales Receipts & Payment Audit Log
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search past receipts, review item breakdown, re-print or export official PDF invoices.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, student name, roll number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Sales ({transactions.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Fully Paid
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'pending'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Has Pending Dues
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Buyer Info</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-right">Received</th>
                <th className="p-4 text-right">Pending Dues</th>
                <th className="p-4 text-center">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No transaction records match search.
                  </td>
                </tr>
              ) : (
                filteredTxs.map(tx => {
                  const isPending = tx.pending_amount > 0;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.invoice_number}
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {tx.buyer_name}
                        </div>
                        {tx.buyer_type === 'student' ? (
                          <div className="text-[10px] text-slate-400">
                            Roll #{tx.student_roll_no || 'N/A'} ({tx.student_class || 'N/A'})
                          </div>
                        ) : (
                          <div className="text-[10px] text-indigo-500 font-medium">
                            Bulk External School Purchase
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {tx.payment_method.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                        {currency} {(tx.total_amount - tx.discount).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {currency} {tx.paid_amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        {isPending ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {currency} {tx.pending_amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            PAID
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="View Receipt Modal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateInvoicePDF(tx, settings)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Download PDF Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <InvoiceModal
          transaction={selectedTx}
          settings={settings}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};
