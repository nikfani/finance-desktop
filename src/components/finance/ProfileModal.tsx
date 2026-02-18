'use client';

import { useState } from 'react';
import { useFinanceStore, formatCurrency } from '@/store/finance-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Lock, 
  LogOut, 
  Trash2,
  Download,
  Check, 
  AlertCircle,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';

export function ProfileModal() {
  const { 
    isProfileOpen, 
    closeProfile, 
    currentUser, 
    updateProfile, 
    changePassword,
    logout,
    deleteCurrentUser,
    transactions,
    categories,
  } = useFinanceStore();
  
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [exportBeforeDelete, setExportBeforeDelete] = useState(true);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'profile' | 'security'>('profile');

  const hasProfileChanges =
    firstName !== (currentUser?.firstName || '') ||
    lastName !== (currentUser?.lastName || '') ||
    email !== (currentUser?.email || '');

  const handleSaveProfile = () => {
    if (!hasProfileChanges) return;

    updateProfile({ firstName, lastName, email });
    setMessage({ type: 'success', text: 'Профиль обновлён!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }
    
    const result = changePassword(oldPassword, newPassword);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    
    if (result.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = () => {
    closeProfile();
    logout();
  };

  // User stats
  const userTransactions = transactions.filter(t => t.userId === currentUser?.id);
  const userCategories = categories.filter(c => c.userId === currentUser?.id);
  const totalIncome = userTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = userTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Get display name
  const displayName = currentUser?.firstName 
    ? currentUser.firstName 
    : currentUser?.username || 'Пользователь';

  const downloadUserBackup = () => {
    if (!currentUser) return;

    const payload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: currentUser.id,
        username: currentUser.username,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        createdAt: currentUser.createdAt,
      },
      categories: userCategories,
      transactions: userTransactions,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-backup-${currentUser.username}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (!deleteConfirmed) return;

    if (exportBeforeDelete) {
      downloadUserBackup();
    }

    setDeleteConfirmed(false);
    setExportBeforeDelete(true);
    closeProfile();
    deleteCurrentUser();
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={closeProfile}>
      <DialogContent className="rounded-2xl max-w-md w-full p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] p-6 pb-16 relative">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Аккаунт</DialogTitle>
          </DialogHeader>
          
          {/* Avatar */}
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <span className="text-3xl font-bold text-[var(--accent-coral)]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          {/* User Name */}
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {displayName}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            @{currentUser?.username}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 mb-6">
            <div className="p-2 rounded-xl bg-[var(--bg-secondary)] text-center">
              <p className="text-xs text-[var(--text-secondary)]">Баланс</p>
              <p className={`text-sm font-bold ${balance >= 0 ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-[var(--success-green)]/10 text-center">
              <p className="text-xs text-[var(--text-secondary)]">Доходы</p>
              <p className="text-sm font-bold text-[var(--success-green)]">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-[var(--danger-rose)]/10 text-center">
              <p className="text-xs text-[var(--text-secondary)]">Расходы</p>
              <p className="text-sm font-bold text-[var(--danger-rose)]">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
              message.type === 'error' 
                ? 'bg-[var(--danger-rose)]/20' 
                : 'bg-[var(--success-green)]/20'
            }`}>
              {message.type === 'error' 
                ? <AlertCircle className="w-4 h-4 text-[var(--danger-rose)]" />
                : <Check className="w-4 h-4 text-[var(--success-green)]" />
              }
              <span className={`text-sm ${message.type === 'error' ? 'text-[var(--danger-rose)]' : 'text-[var(--success-green)]'}`}>
                {message.text}
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setActiveSection('profile')}
              variant={activeSection === 'profile' ? 'default' : 'outline'}
              className={`flex-1 rounded-xl ${activeSection === 'profile' 
                ? 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white' 
                : 'border-[var(--border)]'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Профиль
            </Button>
            <Button
              onClick={() => setActiveSection('security')}
              variant={activeSection === 'security' ? 'default' : 'outline'}
              className={`flex-1 rounded-xl ${activeSection === 'security' 
                ? 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white' 
                : 'border-[var(--border)]'
              }`}
            >
              <Lock className="w-4 h-4 mr-2" />
              Безопасность
            </Button>
          </div>

          {activeSection === 'profile' && (
            <div className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label className="text-[var(--text-primary)]">Имя</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Введите имя"
                  className="rounded-xl border-[var(--border)]"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label className="text-[var(--text-primary)]">Фамилия</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Введите фамилию"
                  className="rounded-xl border-[var(--border)]"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-[var(--text-primary)]">Email для отчётов</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="rounded-xl border-[var(--border)]"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={!hasProfileChanges}
                className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Сохранить
              </Button>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-4">
              {/* Change Password */}
              <div className="space-y-2">
                <Label className="text-[var(--text-primary)]">Текущий пароль</Label>
                <div className="relative">
                  <Input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Введите текущий пароль"
                    className="rounded-xl border-[var(--border)] pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text-primary)]">Новый пароль</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Введите новый пароль"
                    className="rounded-xl border-[var(--border)] pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--text-primary)]">Подтверждение пароля</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Подтвердите новый пароль"
                    className="rounded-xl border-[var(--border)] pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Пароли чувствительны к регистру.
              </p>

              <Button
                onClick={handleChangePassword}
                disabled={!oldPassword || !newPassword || !confirmPassword}
                className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                Изменить пароль
              </Button>
            </div>
          )}

          {/* Account Info */}
          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)] mb-4">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Аккаунт создан:
              </span>
              <span>
                {currentUser?.createdAt 
                  ? new Date(currentUser.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : '—'
                }
              </span>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full rounded-xl border-[var(--danger-rose)] text-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти из аккаунта
              </Button>

              <AlertDialog
                onOpenChange={(open) => {
                  if (open) return;
                  setDeleteConfirmed(false);
                  setExportBeforeDelete(true);
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-[var(--danger-rose)]/50 text-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить аккаунт
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Все ваши категории и транзакции будут удалены без возможности восстановления.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-3 py-1">
                    <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                      <Checkbox
                        checked={exportBeforeDelete}
                        onCheckedChange={(checked) => setExportBeforeDelete(checked === true)}
                        className="mt-0.5"
                      />
                      <span className="inline-flex items-center gap-2">
                        <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                        Выгрузить резервную копию перед удалением
                      </span>
                    </label>

                    <label className="flex items-start gap-2 text-sm text-[var(--danger-rose)]">
                      <Checkbox
                        checked={deleteConfirmed}
                        onCheckedChange={(checked) => setDeleteConfirmed(checked === true)}
                        className="mt-0.5"
                      />
                      <span>Подтверждаю удаление аккаунта и всех данных</span>
                    </label>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        if (!deleteConfirmed) {
                          e.preventDefault();
                          return;
                        }
                        handleDeleteAccount();
                      }}
                      disabled={!deleteConfirmed}
                      className="rounded-xl bg-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/90"
                    >
                      Удалить аккаунт
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
