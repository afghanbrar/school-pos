import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { formatRoleLabel } from '../../utils/roleUtils';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Receipt, 
  Lock, 
  UserCheck, 
  Wallet, 
  Activity,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { isPrincipal, user } = useAuth();
  const [pendingHandoverCount, setPendingHandoverCount] = useState(0);

  useEffect(() => {
    const checkHandovers = async () => {
      try {
        const handovers = await db.getCashHandovers();
        const pending = handovers.filter(h => h.status === 'pending');
        setPendingHandoverCount(pending.length);
      } catch {
        // silent fallback
      }
    };
    checkHandovers();
    const interval = setInterval(checkHandovers, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'pos',
      label: 'POS Billing Terminal',
      icon: ShoppingCart,
      roles: ['principal', 'staff'],
    },
    {
      id: 'inventory',
      label: 'Inventory & Wholesaler',
      icon: Package,
      roles: ['principal', 'staff'],
    },
    {
      id: 'ledger',
      label: 'Expense & Cash Ledger',
      icon: Wallet,
      roles: ['principal', 'staff'],
      badge: isPrincipal && pendingHandoverCount > 0 ? `${pendingHandoverCount} Handover` : undefined,
    },
    {
      id: 'customers',
      label: 'Students & Customers',
      icon: UserCheck,
      roles: ['principal', 'staff'],
    },
    {
      id: 'transactions',
      label: 'Sales Receipts',
      icon: Receipt,
      roles: ['principal', 'staff'],
    },
    {
      id: 'activity',
      label: 'Live Activity Stream',
      icon: Activity,
      roles: ['principal', 'staff'],
    },
    {
      id: 'analytics',
      label: 'Financial & Analytics',
      icon: BarChart3,
      roles: ['principal'], // CEO Only
    },
    {
      id: 'users',
      label: 'Staff Management',
      icon: Users,
      roles: ['principal'], // CEO Only
    },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 overflow-y-auto z-30">
      {/* Sidebar Navigation */}
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase px-3 mb-3">
            Core Modules
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isAllowed = isPrincipal || item.roles.includes('staff');
              const isActive = activeTab === item.id;

              if (!isAllowed) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500 text-slate-900 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  ) : item.roles.length === 1 && item.roles[0] === 'principal' ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                      CEO
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security Info Card */}
        {!isPrincipal ? (
          <div className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Lock className="w-3.5 h-3.5" /> {user ? `${formatRoleLabel(user.role)} Mode` : 'Staff Mode'}
            </div>
            <p className="text-[10px] leading-relaxed">
              Sales, expense deductions & cash handovers are monitored live by the CEO administration.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-950/40 rounded-2xl border border-emerald-800/40 text-[11px] text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> CEO Master Oversight
            </div>
            <p className="text-[10px] leading-relaxed text-emerald-300/80">
              Full authority to review live staff feeds, reconcile ledgers & approve cash transfers.
            </p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
        <div>School POS Enterprise</div>
        <div className="text-[9px] text-slate-600 mt-0.5">developed by AI Mobiles & Tech</div>
      </div>
    </aside>
  );
};
