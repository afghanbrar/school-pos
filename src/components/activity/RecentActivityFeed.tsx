import React, { useState, useEffect } from 'react';
import type { ActivityLog, ActivityAction, UserProfile, SchoolSettings } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  Activity, 
  Search, 
  ShoppingCart, 
  TrendingDown, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Tag, 
  UserPlus, 
  ShieldCheck, 
  X, 
  Eye
} from 'lucide-react';
import { formatRoleLabel } from '../../utils/roleUtils';

interface RecentActivityFeedProps {
  settings?: SchoolSettings;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = () => {
  const { user, isPrincipal } = useAuth();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  // Detail Modal
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  useEffect(() => {
    loadActivities();
    const unsub = db.subscribe(category => {
      if (category === 'activities' || category === 'users' || category === 'all') {
        loadActivities();
      }
    });
    return () => unsub();
  }, [user, isPrincipal]);

  const loadActivities = async () => {
    const logs = await db.getActivityLogs(user?.id, isPrincipal);
    const users = await db.getUsers();
    setActivities(logs);
    setStaffUsers(users);
  };

  const getActionIcon = (action: ActivityAction) => {
    switch (action) {
      case 'sale_created':
        return <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'expense_logged':
        return <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'expense_deleted':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'handover_submitted':
        return <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'handover_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'handover_rejected':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'product_added':
      case 'product_updated':
      case 'product_deleted':
        return <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'category_created':
        return <Tag className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'staff_created':
      case 'user_status_changed':
        return <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'profile_updated':
        return <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActionBadgeColor = (action: ActivityAction) => {
    if (action.includes('sale') || action.includes('approved')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (action.includes('expense') || action.includes('rejected') || action.includes('deleted')) return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    if (action.includes('handover_submitted')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    if (action.includes('product') || action.includes('category')) return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const filteredLogs = activities.filter(log => {
    if (!isPrincipal && log.user_id !== user?.id) {
      return false;
    }

    if (isPrincipal && selectedStaffFilter !== 'all' && log.user_id !== selectedStaffFilter) {
      return false;
    }

    if (selectedActionFilter !== 'all' && log.action !== selectedActionFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(q);
      const matchDesc = log.description.toLowerCase().includes(q);
      const matchUser = log.user_name.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchUser;
    }

    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {isPrincipal ? 'Global Real-Time Activity Feed' : 'My Terminal Activity History'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isPrincipal 
              ? 'Real-time global audit stream of all live cashier transactions, expenses, inventory & approvals across the campus. Immutable record history.'
              : 'Audit history of your POS billing transactions, expense deductions, and handover submissions.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Security Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {isPrincipal ? 'CEO Global Audit' : 'Staff Session'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities, staff name, invoices..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Staff Filter (CEO only) */}
          {isPrincipal && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Staff:</span>
              <select
                value={selectedStaffFilter}
                onChange={e => setSelectedStaffFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-semibold text-slate-800 dark:text-white"
              >
                <option value="all">All Personnel</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Action:</span>
            <select
              value={selectedActionFilter}
              onChange={e => setSelectedActionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-semibold text-slate-800 dark:text-white"
            >
              <option value="all">All Events</option>
              <option value="sale_created">POS Sales & Invoices</option>
              <option value="expense_logged">School Expenses</option>
              <option value="handover_submitted">Cash Handovers</option>
              <option value="handover_approved">CEO Approvals</option>
              <option value="product_added">Stock & Inventory</option>
              <option value="staff_created">User Management</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline Feed List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-1" />
            No activities found matching selected criteria.
          </div>
        ) : (
          filteredLogs.map(log => {
            const dateObj = new Date(log.created_at);
            const timeAgo = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div
                key={log.id}
                onClick={() => setSelectedActivity(log)}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Action Icon Container */}
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Activity Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {log.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getActionBadgeColor(log.action)}`}>
                        {log.action.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {log.description}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                      <span>By: <strong className="text-slate-700 dark:text-slate-300">{log.user_name}</strong></span>
                      <span>•</span>
                      <span>{dateStr} at {timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-bold transition-colors">
                    <span className="hidden sm:inline text-[11px]">View Details</span>
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ACTIVITY FULL DETAILS MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {getActionIcon(selectedActivity.action)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedActivity.title}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Audit Log ID: {selectedActivity.id}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Meta */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Executing User:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedActivity.user_name} ({formatRoleLabel(selectedActivity.user_role)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action Type:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedActivity.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(selectedActivity.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Event Description */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Event Summary</span>
              <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                {selectedActivity.description}
              </p>
            </div>

            {/* Detailed Payload JSON Viewer */}
            {selectedActivity.details && Object.keys(selectedActivity.details).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detailed Event Payload</span>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 scrollbar-thin">
                  {JSON.stringify(selectedActivity.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow transition-colors cursor-pointer"
              >
                Close Activity Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
