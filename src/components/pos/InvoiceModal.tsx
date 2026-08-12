import React from 'react';
import type { Transaction, SchoolSettings } from '../../types';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { printPosInvoiceReceipt } from '../../utils/print';
import { CheckCircle2, Download, Printer, X, User, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InvoiceModalProps {
  transaction: Transaction;
  settings: SchoolSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, settings, onClose }) => {

  React.useEffect(() => {
    const fireFastConfetti = () => {
      confetti({
        particleCount: 120,
        spread: 100,
        startVelocity: 75,
        gravity: 2.8,
        ticks: 80,
        scalar: 1.15,
        origin: { y: 0.65 }
      });
    };

    fireFastConfetti();
    const t = setTimeout(fireFastConfetti, 120);
    return () => clearTimeout(t);
  }, []);

  const handleDownloadPDF = () => {
    generateInvoicePDF(transaction, settings);
  };

  const handlePrint = () => {
    printPosInvoiceReceipt(transaction, settings);
  };

  const currency = settings.currency_symbol || 'PKR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="no-print bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <CheckCircle2 className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Transaction Successful</h3>
              <p className="text-xs text-emerald-100">Invoice #{transaction.invoice_number} generated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="printable-area p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* School Header with Logo */}
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            {settings.logo_url && (
              <img src={settings.logo_url} alt="School Logo" className="w-16 h-16 object-contain mb-2" />
            )}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {settings.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{settings.tagline}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{settings.address} | Tel: {settings.phone}</p>
          </div>

          {/* Buyer & Transaction Meta Box */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div>
              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Buyer Details
              </div>
              <div className="font-semibold text-slate-900 dark:text-white">{transaction.buyer_name}</div>
              {transaction.buyer_type === 'student' ? (
                <div className="text-slate-500 space-y-0.5 mt-1">
                  <div>Roll No: <span className="font-medium text-slate-700 dark:text-slate-300">{transaction.student_roll_no || 'N/A'}</span></div>
                  <div>Class: <span className="font-medium text-slate-700 dark:text-slate-300">{transaction.student_class || 'N/A'}</span></div>
                </div>
              ) : (
                <div className="text-slate-500 space-y-0.5 mt-1">
                  <div>Buyer Type: <span className="font-medium text-indigo-600 dark:text-indigo-400">Bulk External School</span></div>
                  <div>School: <span className="font-medium text-slate-700 dark:text-slate-300">{transaction.school_name || 'External'}</span></div>
                </div>
              )}
            </div>

            <div>
              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Payment Meta
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <div>Date: <span className="font-medium">{new Date(transaction.created_at).toLocaleString()}</span></div>
                <div>Payment Method: <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{transaction.payment_method.replace('_', ' ')}</span></div>
                <div>Cashier Staff: <span className="font-medium">{transaction.staff_name || 'Staff'}</span></div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Itemized Line Items
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3">Variant / Size</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.product_name}</td>
                      <td className="p-3 text-slate-500">{item.size || 'Std'} / {item.color || 'N/A'}</td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">{currency} {item.unit_price.toLocaleString()}</td>
                      <td className="p-3 text-right font-semibold">{currency} {item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Dues Breakdown */}
          <div className="flex justify-end">
            <div className="w-72 bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>{currency} {transaction.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount:</span>
                <span>- {currency} {transaction.discount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span>{currency} {(transaction.total_amount - transaction.discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currency} {transaction.paid_amount.toLocaleString()}</span>
              </div>

              {transaction.pending_amount > 0 ? (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-extrabold text-xs text-rose-600 dark:text-rose-400">
                  <span>PENDING DUES:</span>
                  <span>{currency} {transaction.pending_amount.toLocaleString()}</span>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  <span>STATUS:</span>
                  <span>PAID IN FULL</span>
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Footer Branding */}
          <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 text-center font-bold text-[10px] text-slate-500 tracking-wide">
            Developed by Ai Mobiles & Technology 0311-7260898
          </div>
        </div>

        {/* Modal Actions */}
        <div className="no-print p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Start New POS Sale
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" /> Download Official PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
