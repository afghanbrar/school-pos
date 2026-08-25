import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginModal } from './components/auth/LoginModal';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { PosTerminal } from './components/pos/PosTerminal';
import { InventoryManager } from './components/inventory/InventoryManager';
import { ExpenseLedgerManager } from './components/ledger/ExpenseLedgerManager';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { UserManagement } from './components/users/UserManagement';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { TransactionHistory } from './components/transactions/TransactionHistory';
import { RecentActivityFeed } from './components/activity/RecentActivityFeed';
import { SettingsModal } from './components/settings/SettingsModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { OfflineModal } from './components/common/OfflineModal';
import type { SchoolSettings } from './types';
import { db } from './services/db';
import { Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await db.getSettings();
    setSettings(s);
  };

  if (loading || !settings) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-300">Loading School POS & Security Container...</p>
        <OfflineModal />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginModal />
        <OfflineModal />
      </>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        activeTab={activeTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className={`flex-1 h-full ${activeTab === 'pos' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {activeTab === 'pos' && <PosTerminal settings={settings} />}
          {activeTab === 'inventory' && <InventoryManager settings={settings} />}
          {activeTab === 'ledger' && <ExpenseLedgerManager settings={settings} />}
          {activeTab === 'customers' && <CustomerManagement settings={settings} />}
          {activeTab === 'transactions' && <TransactionHistory settings={settings} />}
          {activeTab === 'activity' && <RecentActivityFeed settings={settings} />}
          {activeTab === 'analytics' && <AnalyticsDashboard settings={settings} />}
          {activeTab === 'users' && <UserManagement />}
        </main>
      </div>

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      <ToastContainer />
      <OfflineModal />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainAppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
