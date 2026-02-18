'use client';

import { useState, useRef } from 'react';
import { useFinanceStore, formatCurrency } from '@/store/finance-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Tag, 
  TrendingUp, 
  TrendingDown,
  User,
  Calendar,
  Pencil,
  Check,
  Star,
  GripVertical,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  Wallet,
  Target
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function SettingsPage() {
  const { 
    currentUser, 
    categories,
    budgetLimits,
    addCategory, 
    renameCategory,
    deleteCategory,
    toggleFavorite,
    reorderCategories,
    transactions,
    getExpenseCategories,
    getIncomeCategories,
    getAllUserCategories,
    hasUncategorizedTransactions,
    importTransactions,
    clearAllTransactions,
    setBudgetLimit,
    removeBudgetLimit,
    getBudgetLimit,
    getAllBudgetLimits
  } = useFinanceStore();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategoryType, setAddingCategoryType] = useState<'income' | 'expense' | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'profile' | 'data'>('categories');
  
  // Rename state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [categoryToRename, setCategoryToRename] = useState<{id: string; name: string; type: 'income' | 'expense'} | null>(null);
  const [newName, setNewName] = useState('');
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string; name: string; type: 'income' | 'expense'} | null>(null);
  
  // Drag state
  const draggedItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);
  
  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{type: 'income' | 'expense'; count: number}[]>([]);
  const [importYears, setImportYears] = useState<number[]>([]);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  
  // Budget limit state
  const [budgetLimitDialogOpen, setBudgetLimitDialogOpen] = useState(false);
  const [selectedCategoryForLimit, setSelectedCategoryForLimit] = useState<string | null>(null);
  const [limitAmount, setLimitAmount] = useState('');

  const expenseCategories = getExpenseCategories();
  const incomeCategories = getIncomeCategories();
  
  const userCategories = categories.filter(c => c.userId === currentUser?.id);
  const userTransactions = transactions.filter(t => t.userId === currentUser?.id);

  const handleAddCategory = (type: 'income' | 'expense') => {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim(), type);
    setNewCategoryName('');
    setAddingCategoryType(null);
  };

  const handleToggleInlineAdd = (type: 'income' | 'expense') => {
    setAddingCategoryType((current) => {
      const next = current === type ? null : type;
      if (next) setNewCategoryName('');
      return next;
    });
  };

  const handleRenameClick = (category: {id: string; name: string; type: 'income' | 'expense'}) => {
    setCategoryToRename(category);
    setNewName(category.name);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = () => {
    if (categoryToRename && newName.trim()) {
      renameCategory(categoryToRename.id, newName.trim());
    }
    setRenameDialogOpen(false);
    setCategoryToRename(null);
    setNewName('');
  };

  const handleDeleteClick = (category: {id: string; name: string; type: 'income' | 'expense'}) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // Import functions
  const handleImport = async () => {
    setImportLoading(true);
    setImportError(null);
    
    try {
      // Check if running in Electron
      const electronAPI = (window as any).electronAPI;
      
      if (!electronAPI) {
        setImportError('Импорт доступен только в десктопной версии приложения');
        setImportLoading(false);
        return;
      }
      
      const result = await electronAPI.selectExcelFile();
      
      if (result.canceled) {
        setImportLoading(false);
        return;
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка импорта');
      }
      
      const data = result.data;
      
      if (data.transactions.length === 0) {
        setImportError('Файл не содержит данных за годы 2021-2024');
        setImportLoading(false);
        return;
      }
      
      // Count transactions by type
      const incomeCount = data.transactions.filter((t: any) => t.type === 'income').length;
      const expenseCount = data.transactions.filter((t: any) => t.type === 'expense').length;
      
      setImportPreview([
        { type: 'income', count: incomeCount },
        { type: 'expense', count: expenseCount }
      ]);
      
      // Set years from import
      setImportYears(data.years || []);
      
      // Import transactions
      importTransactions(data.transactions);
      setImportLoading(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      setImportLoading(false);
    }
  };

  const handleClearData = () => {
    clearAllTransactions();
    setClearDataDialogOpen(false);
  };

  // Budget limit handlers
  const handleOpenBudgetLimitDialog = (categoryName: string) => {
    setSelectedCategoryForLimit(categoryName);
    const existingLimit = getBudgetLimit(categoryName);
    setLimitAmount(existingLimit ? existingLimit.toString() : '');
    setBudgetLimitDialogOpen(true);
  };

  const handleSaveBudgetLimit = () => {
    if (selectedCategoryForLimit && limitAmount) {
      const amount = parseFloat(limitAmount);
      if (amount > 0) {
        setBudgetLimit(selectedCategoryForLimit, amount);
      } else {
        removeBudgetLimit(selectedCategoryForLimit);
      }
    }
    setBudgetLimitDialogOpen(false);
    setSelectedCategoryForLimit(null);
    setLimitAmount('');
  };

  const handleRemoveBudgetLimit = () => {
    if (selectedCategoryForLimit) {
      removeBudgetLimit(selectedCategoryForLimit);
    }
    setBudgetLimitDialogOpen(false);
    setSelectedCategoryForLimit(null);
    setLimitAmount('');
  };

  // Get transaction count for category
  const getCategoryTransactionCount = (
    categoryName: string,
    categoryType: 'income' | 'expense'
  ) => {
    return userTransactions.filter(
      (t) => t.category === categoryName && t.type === categoryType
    ).length;
  };

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    draggedItem.current = id;
  };

  const handleDragEnter = (id: string) => {
    dragOverItem.current = id;
  };

  const handleDragEnd = (type: 'income' | 'expense') => {
    if (!draggedItem.current || !dragOverItem.current) return;
    if (draggedItem.current === dragOverItem.current) return;

    const typeCategories = getAllUserCategories(type);
    const draggedIndex = typeCategories.findIndex(c => c.id === draggedItem.current);
    const dropIndex = typeCategories.findIndex(c => c.id === dragOverItem.current);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const newOrder = [...typeCategories];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    reorderCategories(type, newOrder.map(c => c.id));

    draggedItem.current = null;
    dragOverItem.current = null;
  };

  const stats = {
    totalTransactions: userTransactions.length,
    totalIncome: userTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: userTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    categoriesCount: userCategories.length,
  };

  // Render category list
  const renderCategoryList = (type: 'income' | 'expense') => {
    const cats = getAllUserCategories(type);
    const hasUncategorized = hasUncategorizedTransactions(type);
    
    return (
      <div className="space-y-2">
        {cats.map((category) => {
          const transactionCount = getCategoryTransactionCount(category.name, category.type);
          
          return (
            <div
              key={category.id}
              draggable
              onDragStart={() => handleDragStart(category.id)}
              onDragEnter={() => handleDragEnter(category.id)}
              onDragEnd={() => handleDragEnd(type)}
              onDragOver={(e) => e.preventDefault()}
              className="group flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all cursor-grab active:cursor-grabbing"
            >
              {/* Drag Handle */}
              <GripVertical className="w-4 h-4 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Favorite Star */}
              <button
                onClick={() => toggleFavorite(category.id)}
                className="transition-opacity opacity-0 group-hover:opacity-100"
              >
                <Star className={`w-4 h-4 ${category.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-secondary)]'}`} />
              </button>
              
              {/* Category Name */}
              <span className="flex-1 text-[var(--text-primary)]">{category.name}</span>
              
              {/* Transaction Count */}
              {transactionCount > 0 && (
                <span className="text-xs text-[var(--text-secondary)] mr-2">
                  {transactionCount} транз.
                </span>
              )}
              
              {/* Budget Limit Indicator */}
              {type === 'expense' && getBudgetLimit(category.name) && (
                <Badge 
                  variant="secondary" 
                  className="mr-2 bg-[var(--accent-warm)]/20 text-[var(--accent-warm)] text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  {formatCurrency(getBudgetLimit(category.name)!)}
                </Badge>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {type === 'expense' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-lg hover:bg-[var(--success-green)]/20 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBudgetLimitDialog(category.name);
                    }}
                    title="Лимит бюджета"
                  >
                    <Wallet className={`w-4 h-4 ${getBudgetLimit(category.name) ? 'text-[var(--success-green)]' : 'text-[var(--text-secondary)]'}`} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg hover:bg-[var(--accent-warm)]/20 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameClick({ id: category.id, name: category.name, type: category.type });
                  }}
                >
                  <Pencil className="w-4 h-4 text-[var(--accent-warm)]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg hover:bg-[var(--danger-rose)]/20 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick({ id: category.id, name: category.name, type: category.type });
                  }}
                >
                  <Trash2 className="w-4 h-4 text-[var(--danger-rose)]" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {/* Uncategorized transactions indicator */}
        {hasUncategorized && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger-rose)]/10 border border-dashed border-[var(--danger-rose)]/30">
            <AlertCircle className="w-4 h-4 text-[var(--danger-rose)]" />
            <span className="text-sm text-[var(--danger-rose)]">Без категории</span>
            <span className="text-xs text-[var(--text-secondary)]">
              ({userTransactions.filter(t => t.type === type && t.isUncategorized).length} транз.)
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Настройки
      </h1>

      {/* Tab Selector */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setActiveTab('categories')}
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          className={`rounded-xl ${activeTab === 'categories' 
            ? 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white' 
            : 'border-[var(--border)]'
          }`}
        >
          <Tag className="w-4 h-4 mr-2" />
          Категории
        </Button>
        <Button
          onClick={() => setActiveTab('profile')}
          variant={activeTab === 'profile' ? 'default' : 'outline'}
          className={`rounded-xl ${activeTab === 'profile' 
            ? 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white' 
            : 'border-[var(--border)]'
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          Профиль
        </Button>
        <Button
          onClick={() => setActiveTab('data')}
          variant={activeTab === 'data' ? 'default' : 'outline'}
          className={`rounded-xl ${activeTab === 'data' 
            ? 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white' 
            : 'border-[var(--border)]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Данные
        </Button>
      </div>

      {activeTab === 'categories' && (
        <>
          {/* Hint */}
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <GripVertical className="w-4 h-4" />
            Перетащите категории для изменения порядка. Наведите для отображения действий.
          </div>

          {/* Categories Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-[var(--danger-rose)]" />
                    Расходы ({expenseCategories.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => handleToggleInlineAdd('expense')}
                  >
                    <Plus className="w-4 h-4 text-[var(--text-secondary)]" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addingCategoryType === 'expense' && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--border)] p-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Новая категория расходов"
                      className="h-9 rounded-lg border-[var(--border)]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory('expense');
                        if (e.key === 'Escape') setAddingCategoryType(null);
                      }}
                    />
                    <Button
                      onClick={() => handleAddCategory('expense')}
                      disabled={!newCategoryName.trim()}
                      className="h-9 rounded-lg bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white px-3"
                    >
                      Добавить
                    </Button>
                  </div>
                )}
                {renderCategoryList('expense')}
              </CardContent>
            </Card>

            {/* Income Categories */}
            <Card className="border-0 shadow-md rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--success-green)]" />
                    Доходы ({incomeCategories.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => handleToggleInlineAdd('income')}
                  >
                    <Plus className="w-4 h-4 text-[var(--text-secondary)]" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addingCategoryType === 'income' && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--border)] p-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Новая категория доходов"
                      className="h-9 rounded-lg border-[var(--border)]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory('income');
                        if (e.key === 'Escape') setAddingCategoryType(null);
                      }}
                    />
                    <Button
                      onClick={() => handleAddCategory('income')}
                      disabled={!newCategoryName.trim()}
                      className="h-9 rounded-lg bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white px-3"
                    >
                      Добавить
                    </Button>
                  </div>
                )}
                {renderCategoryList('income')}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'profile' && (
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <User className="w-5 h-5" />
              Информация об аккаунте
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-warm)] to-[var(--accent-coral)] flex items-center justify-center shadow-md">
                <span className="text-2xl font-bold text-white">
                  {(currentUser?.firstName || currentUser?.username || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xl font-semibold text-[var(--text-primary)]">
                  {currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser?.username}
                </p>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Calendar className="w-4 h-4" />
                  Создан: {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ru-RU') : '—'}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalTransactions}</p>
                <p className="text-sm text-[var(--text-secondary)]">Транзакций</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--success-green)]/10 text-center">
                <p className="text-2xl font-bold text-[var(--success-green)]">{formatCurrency(stats.totalIncome)}</p>
                <p className="text-sm text-[var(--text-secondary)]">Доходы</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--danger-rose)]/10 text-center">
                <p className="text-2xl font-bold text-[var(--danger-rose)]">{formatCurrency(stats.totalExpense)}</p>
                <p className="text-sm text-[var(--text-secondary)]">Расходы</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.categoriesCount}</p>
                <p className="text-sm text-[var(--text-secondary)]">Категорий</p>
              </div>
            </div>

            {/* Balance */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-[var(--accent-warm)]/10 to-[var(--accent-coral)]/10">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Общий баланс</p>
              <p className={`text-3xl font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'}`}>
                {formatCurrency(stats.totalIncome - stats.totalExpense)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Import Section */}
          <Card className="border-0 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[var(--success-green)]" />
                Импорт данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Импортируйте данные из Excel-файла "Финансы.xlsx". Файл должен содержать листы "Расходы" и "Доходы" с колонками: Дата, Категория, Сумма, Описание.
              </p>
              
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setImportDialogOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-[var(--success-green)] to-[#6BA888] hover:opacity-90 text-white"
                  disabled={importLoading}
                >
                  {importLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Импортировать
                    </>
                  )}
                </Button>
              </div>

              {/* Import preview badges */}
              {importPreview.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {importPreview.map((item) => (
                    <Badge 
                      key={item.type}
                      className={`rounded-lg px-3 py-1 ${
                        item.type === 'income' 
                          ? 'bg-[var(--success-green)]/20 text-[var(--success-green)]' 
                          : 'bg-[var(--danger-rose)]/20 text-[var(--danger-rose)]'
                      }`}
                    >
                      {item.type === 'income' ? 'Доходы' : 'Расходы'}: {item.count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clear Data Section */}
          <Card className="border-0 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-[var(--danger-rose)]" />
                Управление данными
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Очистить все транзакции текущего пользователя. Это действие нельзя отменить.
              </p>
              
              <Button
                onClick={() => setClearDataDialogOpen(true)}
                variant="outline"
                className="rounded-xl border-[var(--danger-rose)] text-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Очистить все транзакции
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Переименовать категорию</DialogTitle>
            <DialogDescription>
              Введите новое название для категории "{categoryToRename?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Новое название"
              className="rounded-xl border-[var(--border)]"
              onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="rounded-xl">
              Отмена
            </Button>
            <Button 
              onClick={handleRenameConfirm}
              disabled={!newName.trim()}
              className="rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[var(--danger-rose)]" />
              Удалить категорию?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">Категория "{categoryToDelete?.name}" будет удалена.</span>
              {categoryToDelete && getCategoryTransactionCount(categoryToDelete.name, categoryToDelete.type) > 0 && (
                <span className="block text-[var(--danger-rose)]">
                  Все транзакции в этой категории ({getCategoryTransactionCount(categoryToDelete.name, categoryToDelete.type)} шт.) будут перемещены в раздел "Без категории".
                </span>
              )}
              <span className="block">Это действие нельзя отменить.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
              Отмена
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/90 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[var(--success-green)]" />
              Импорт данных из Excel
            </DialogTitle>
            <DialogDescription>
              Загрузка транзакций из файла Финансы.xlsx (годы 2021-2024)
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {importError && (
              <div className="p-4 rounded-xl bg-[var(--danger-rose)]/10 text-[var(--danger-rose)] text-sm">
                {importError}
              </div>
            )}
            
            {importPreview.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">Загружено транзакций:</p>
                
                {/* Years badges */}
                {importYears.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {importYears.map(year => (
                      <Badge key={year} variant="secondary" className="text-xs">
                        {year}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  {importPreview.map((item) => (
                    <div 
                      key={item.type}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        item.type === 'income' 
                          ? 'bg-[var(--success-green)]/10' 
                          : 'bg-[var(--danger-rose)]/10'
                      }`}
                    >
                      <span className={`font-medium ${
                        item.type === 'income' ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'
                      }`}>
                        {item.type === 'income' ? 'Доходы' : 'Расходы'}
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">{item.count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Всего: {importPreview.reduce((sum, item) => sum + item.count, 0)} транзакций
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Нажмите "Загрузить" для импорта данных из файла
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setImportDialogOpen(false);
                setImportPreview([]);
                setImportError(null);
                setImportYears([]);
              }} 
              className="rounded-xl"
            >
              {importPreview.length > 0 ? 'Закрыть' : 'Отмена'}
            </Button>
            {importPreview.length === 0 && (
              <Button 
                onClick={handleImport}
                disabled={importLoading}
                className="rounded-xl bg-gradient-to-r from-[var(--success-green)] to-[#6BA888] text-white"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Dialog */}
      <Dialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[var(--danger-rose)]" />
              Очистить все данные?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">Все транзакции ({stats.totalTransactions} шт.) будут удалены.</span>
              <span className="block text-[var(--danger-rose)]">
                Категории останутся, но все финансовые данные будут потеряны.
              </span>
              <span className="block">Это действие нельзя отменить.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDataDialogOpen(false)} className="rounded-xl">
              Отмена
            </Button>
            <Button 
              onClick={handleClearData}
              className="rounded-xl bg-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/90 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Limit Dialog */}
      <Dialog open={budgetLimitDialogOpen} onOpenChange={setBudgetLimitDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--accent-warm)]" />
              Лимит бюджета
            </DialogTitle>
            <DialogDescription>
              Установите месячный лимит расходов для категории "{selectedCategoryForLimit}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-[var(--text-secondary)] mb-2 block">
              Лимит (₽)
            </label>
            <Input
              type="number"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="100"
              className="rounded-xl h-12 border-[var(--border)]"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveBudgetLimit()}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Оставьте пустым или введите 0 для удаления лимита
            </p>
          </div>
          <DialogFooter className="gap-2">
            {selectedCategoryForLimit && getBudgetLimit(selectedCategoryForLimit) && (
              <Button 
                variant="outline" 
                onClick={handleRemoveBudgetLimit}
                className="rounded-xl text-[var(--danger-rose)] border-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            )}
            <Button variant="outline" onClick={() => setBudgetLimitDialogOpen(false)} className="rounded-xl">
              Отмена
            </Button>
            <Button 
              onClick={handleSaveBudgetLimit}
              disabled={!limitAmount || parseFloat(limitAmount) < 0}
              className="rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
