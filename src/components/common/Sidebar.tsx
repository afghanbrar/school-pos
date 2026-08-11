import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Package, BarChart3, Users, Receipt, Lock, UserCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { isPrincipal } = useAuth();

  const navItems = [
    {
      id: 'pos',
      label: 'POS Terminal',
      icon: ShoppingCart,
      roles: ['principal', 'staff'],
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Package,
      roles: ['principal', 'staff'],
    },
    {
      id: 'customers',
      label: 'Customers & Students',
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
      id: 'analytics',
      label: 'Analytics & Financials',
      icon: BarChart3,
      roles: ['principal'], // Principal Only
    },
    {
      id: 'users',
      label: 'Staff Management',
      icon: Users,
      roles: ['principal'], // Principal Only
    },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 overflow-y-auto z-30">
      {/* Sidebar Navigation */}
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 mb-3">
            Main Menu
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {/* Principal Badge indicator for Admin tabs */}
                  {item.roles.length === 1 && item.roles[0] === 'principal' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security Info Card */}
        {!isPrincipal && (
          <div className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Lock className="w-3.5 h-3.5" /> Staff Cashier Mode
            </div>
            <p className="leading-tight text-slate-400">
              Analytics & Staff User settings are restricted to the Principal.
            </p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800 text-center">
        <div className="text-[11px] font-medium text-slate-400">Tauri POS Container v1.0</div>
        <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Database Secured & Encrypted
        </div>
      </div>
    </aside>
  );
};
