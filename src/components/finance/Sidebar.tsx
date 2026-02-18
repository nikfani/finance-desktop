'use client';

import { useFinanceStore } from '@/store/finance-store';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart3,
  Wallet,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'add', label: 'Добавить', icon: PlusCircle },
  { id: 'history', label: 'История', icon: History },
  { id: 'reports', label: 'Отчёты', icon: BarChart3 },
  { id: 'settings', label: 'Настройки', icon: Settings },
] as const;

export function Sidebar() {
  const { activeTab, setActiveTab, currentUser, openProfile, logout } = useFinanceStore();

  // Get display name
  const displayName = currentUser?.firstName 
    ? currentUser.firstName 
    : currentUser?.username || 'Гость';
  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).replace(' г.', '');

  return (
    <aside className="w-64 bg-white border-r border-[var(--border)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-24 px-6 border-b border-[var(--border)] flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent-warm)] to-[var(--accent-coral)] flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Финансы</h1>
            <p className="text-xs text-[var(--text-secondary)]">Личный учёт</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Date */}
      <div className="px-6 pb-4">
        <p className="text-xs text-[var(--text-secondary)] capitalize text-center">{dateStr}</p>
      </div>

      {/* Account Button */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)]">
          <button
            onClick={openProfile}
            className="min-w-0 flex-1 flex items-center gap-3 px-1 py-1 text-left rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-warm)] to-[var(--accent-coral)] flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {displayName}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Аккаунт</p>
            </div>
          </button>

          <button
            type="button"
            onClick={logout}
            aria-label="Выйти из аккаунта"
            className="shrink-0 w-10 h-10 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--danger-rose)]/10 transition-colors flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 text-[var(--danger-rose)]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
