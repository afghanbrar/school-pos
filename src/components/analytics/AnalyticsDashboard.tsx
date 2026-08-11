import React, { useState, useEffect } from 'react';
import type { Transaction, UserProfile, SchoolSettings, DateFilterRange } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertCircle,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

interface AnalyticsDashboardProps {
  settings: SchoolSettings;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ settings }) => {
  const { isPrincipal } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterRange>('1M');
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    const txs = await db.getTransactions();
    const usrs = await db.getUsers();
    setTransactions(txs);
    setStaffUsers(usrs.filter(u => u.role === 'staff'));
  };

  const getFilteredTransactions = (): Transaction[] => {
    const now = new Date();

    if (dateFilter === 'custom') {
      if (!startDate && !endDate) return transactions;
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() + 86400000 : Infinity;
      return transactions.filter(t => {
        const time = new Date(t.created_at).getTime();
        return time >= start && time <= end;
      });
    }

    let daysToSubtract = 30;
    if (dateFilter === '1M') daysToSubtract = 30;
    if (dateFilter === '3M') daysToSubtract = 90;
    if (dateFilter === '6M') daysToSubtract = 180;
    if (dateFilter === '1Y') daysToSubtract = 365;
    if (dateFilter === '5Y') daysToSubtract = 1825;

    const cutoffTime = now.getTime() - daysToSubtract * 86400000;
    return transactions.filter(t => new Date(t.created_at).getTime() >= cutoffTime);
  };

  const filteredTx = getFilteredTransactions();

  const totalRevenue = filteredTx.reduce((acc, t) => acc + (t.total_amount - t.discount), 0);
  const totalReceived = filteredTx.reduce((acc, t) => acc + t.paid_amount, 0);
  const totalPendingDues = filteredTx.reduce((acc, t) => acc + t.pending_amount, 0);

  const totalCostOfGoods = filteredTx.reduce((acc, t) => {
    const itemCosts = t.items.reduce((itemAcc, item) => itemAcc + (item.unit_cost * item.quantity), 0);
    return acc + itemCosts;
  }, 0);

  const netProfit = totalRevenue - totalCostOfGoods;

  const timelineMap: Record<string, { date: string; Revenue: number; Profit: number }> = {};
  filteredTx.forEach(t => {
    const d = new Date(t.created_at);
    const dateStr = dateFilter === '5Y' || dateFilter === '1Y' 
      ? `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`
      : `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    
    const rev = t.total_amount - t.discount;
    const cogs = t.items.reduce((acc, item) => acc + item.unit_cost * item.quantity, 0);
    const prof = rev - cogs;

    if (!timelineMap[dateStr]) {
      timelineMap[dateStr] = { date: dateStr, Revenue: 0, Profit: 0 };
    }
    timelineMap[dateStr].Revenue += rev;
    timelineMap[dateStr].Profit += prof;
  });

  const timelineChartData = Object.values(timelineMap).reverse();

  const paymentMethodCounts = {
    Cash: 0,
    'Bank Transfer': 0,
    EasyPaisa: 0,
  };
  filteredTx.forEach(t => {
    if (t.payment_method === 'cash') paymentMethodCounts.Cash += t.paid_amount;
    if (t.payment_method === 'bank_transfer') paymentMethodCounts['Bank Transfer'] += t.paid_amount;
    if (t.payment_method === 'easypaisa') paymentMethodCounts.EasyPaisa += t.paid_amount;
  });

  const pieChartData = [
    { name: 'Cash', value: paymentMethodCounts.Cash, color: '#10b981' },
    { name: 'Bank Transfer', value: paymentMethodCounts['Bank Transfer'], color: '#6366f1' },
    { name: 'EasyPaisa', value: paymentMethodCounts.EasyPaisa, color: '#14b8a6' },
  ];

  const staffPerformance = staffUsers.map(stf => {
    const staffSales = filteredTx.filter(t => t.staff_id === stf.id || t.staff_name === stf.full_name);
    const salesCount = staffSales.length;
    const revenueGen = staffSales.reduce((acc, t) => acc + (t.total_amount - t.discount), 0);
    const avgOrderValue = salesCount > 0 ? revenueGen / salesCount : 0;

    return {
      id: stf.id,
      name: stf.full_name,
      email: stf.email,
      status: stf.status,
      salesCount,
      revenueGen,
      avgOrderValue,
    };
  }).sort((a, b) => b.revenueGen - a.revenueGen);

  if (!isPrincipal) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Principal Analytics & Financial Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time financial flow, profit margins, outstanding student dues & staff sales performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['1M', '3M', '6M', '1Y', '5Y', 'custom'] as DateFilterRange[]).map(preset => (
            <button
              key={preset}
              onClick={() => setDateFilter(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilter === preset
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {preset === '1M' && '1 Month'}
              {preset === '3M' && '3 Months'}
              {preset === '6M' && '6 Months'}
              {preset === '1Y' && '1 Year'}
              {preset === '5Y' && '5 Years'}
              {preset === 'custom' && 'Custom Date'}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-lg relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium">Total Gross Sales Revenue</div>
          <div className="text-2xl font-extrabold mt-1">{currency} {totalRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> Filtered ({filteredTx.length} transactions)
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Net Profit (Revenue - COGS)</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {currency} {netProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            COGS Cost: {currency} {totalCostOfGoods.toLocaleString()}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Actual Cash Collected</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {currency} {totalReceived.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Received via Cash / Bank / EasyPaisa
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-950 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Outstanding Pending Dues</div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {currency} {totalPendingDues.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-500 flex items-center gap-1 mt-2">
            <AlertCircle className="w-3.5 h-3.5" /> Recoverable student/bulk credit
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Revenue & Profit Trend Analysis
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Profit" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-600" /> Payment Methods Breakdown
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Cash Payments:</span>
              <span className="font-bold text-emerald-600">{currency} {paymentMethodCounts.Cash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Bank Transfers:</span>
              <span className="font-bold text-indigo-600">{currency} {paymentMethodCounts['Bank Transfer'].toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>EasyPaisa:</span>
              <span className="font-bold text-teal-600">{currency} {paymentMethodCounts.EasyPaisa.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Individual Staff Sales Performance
            </h3>
            <p className="text-xs text-slate-500">Monitor transactions processed and total revenue generated by each staff member.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Rank & Staff Name</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Transactions Handled</th>
                <th className="p-4 text-right">Total Revenue Generated</th>
                <th className="p-4 text-right">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffPerformance.map((stf, index) => (
                <tr key={stf.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                      index === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                    {stf.name}
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{stf.email}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      stf.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {stf.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-800 dark:text-white">
                    {stf.salesCount} receipts
                  </td>
                  <td className="p-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {currency} {stf.revenueGen.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-slate-600 dark:text-slate-400">
                    {currency} {Math.round(stf.avgOrderValue).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
