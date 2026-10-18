import React, { useState, useEffect } from 'react';
import type { Transaction, UserProfile, SchoolSettings, DateFilterRange, SchoolExpense } from '../../types';
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
  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterRange>('1M');
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const currency = settings.currency_symbol || 'PKR';

  useEffect(() => {
    loadAnalyticsData();
    const unsub = db.subscribe(category => {
      if (category === 'transactions' || category === 'expenses' || category === 'users' || category === 'all') {
        loadAnalyticsData();
      }
    });
    return () => unsub();
  }, []);

  const loadAnalyticsData = async () => {
    const txs = await db.getTransactions();
    const usrs = await db.getUsers();
    const exp = await db.getExpenses();

    setTransactions(txs);
    setStaffUsers(usrs.filter(u => u.role === 'staff'));
    setExpenses(exp);
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

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalCostOfGoods - totalExpenses;

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Executive Analytics & Financial Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            CEO high-altitude financial monitoring, sales volume, expense deductions & staff reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['1M', '3M', '6M', '1Y', '5Y', 'custom'] as DateFilterRange[]).map(preset => (
            <button
              key={preset}
              onClick={() => setDateFilter(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-lg relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium">Total Gross Sales Revenue</div>
          <div className="text-2xl font-extrabold mt-1">{currency} {totalRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> Filtered ({filteredTx.length} transactions)
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Net Profit (Revenue − COGS − Exp)</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {currency} {netProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Expenses: {currency} {totalExpenses.toLocaleString()}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Actual Paid Revenue Inflows</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {currency} {totalReceived.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Directly collected by cashier staff
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Outstanding Student Receivables</div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {currency} {totalPendingDues.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-500 flex items-center gap-1 mt-2">
            <AlertCircle className="w-3.5 h-3.5" /> Unpaid student dues to collect
          </div>
        </div>
      </div>

      {/* Revenue & Profit Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue & Profit Progression</h3>
              <p className="text-xs text-slate-400">Periodic revenue vs gross profit trendline</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Profit" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-500" /> Payment Channels
            </h3>
            <p className="text-xs text-slate-400">Distribution by transaction method</p>
          </div>

          <div className="h-56 w-full my-auto">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            Cash accounts for the dominant portion of school store billing.
          </div>
        </div>
      </div>

      {/* Staff Performance & Accountability Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Cashier Staff Performance & Accountability
            </h3>
            <p className="text-xs text-slate-400">Total volume and revenue processed by each active cashier</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Invoices Issued</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
                <th className="py-3 px-4 text-right">Avg Order Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {staffPerformance.map(stf => (
                <tr key={stf.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{stf.name}</div>
                    <div className="text-[10px] text-slate-400">{stf.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      stf.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {stf.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                    {stf.salesCount}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {currency} {stf.revenueGen.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 font-mono">
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
