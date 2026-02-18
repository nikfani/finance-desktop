'use client';

import { useFinanceStore } from '@/store/finance-store';
import { Sidebar } from '@/components/finance/Sidebar';
import { Header } from '@/components/finance/Header';
import { Dashboard } from '@/components/finance/Dashboard';
import { AddTransaction } from '@/components/finance/AddTransaction';
import { TransactionHistory } from '@/components/finance/TransactionHistory';
import { Reports } from '@/components/finance/Reports';
import { LoginPage } from '@/components/finance/LoginPage';
import { SettingsPage } from '@/components/finance/SettingsPage';
import { ProfileModal } from '@/components/finance/ProfileModal';

export default function Home() {
  const { activeTab, isLoggedIn } = useFinanceStore();

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add':
        return <AddTransaction />;
      case 'history':
        return <TransactionHistory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal />
    </div>
  );
}
