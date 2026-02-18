'use client';

import { useState } from 'react';
import { 
  useFinanceStore, 
  formatCurrency, 
  formatDate, 
  type Transaction,
} from '@/store/finance-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Filter, ArrowUpRight, ArrowDownRight, Calendar, AlertCircle, PencilLine, ArrowDownWideNarrow, RotateCcw } from 'lucide-react';

type SortDirection = 'none' | 'asc' | 'desc';

export function TransactionHistory() {
  const { transactions, deleteTransaction, updateTransaction, currentUser, getExpenseCategories, getIncomeCategories } = useFinanceStore();
  
  const userTransactions = transactions.filter(t => t.userId === currentUser?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateSort, setDateSort] = useState<SortDirection>('none');
  const [amountSort, setAmountSort] = useState<SortDirection>('none');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const allCategories = [...new Set(userTransactions.map(t => t.category))].sort();
  const editingTransaction = editingTransactionId
    ? userTransactions.find((t) => t.id === editingTransactionId) || null
    : null;
  const editCategories = [
    ...new Set([
      ...((editType === 'income' ? getIncomeCategories() : getExpenseCategories()) || []),
      editCategory,
    ].filter(Boolean)),
  ];
  const parsedEditAmount = Number(editAmount);
  const hasValidEditForm = Boolean(editCategory && editDate && !Number.isNaN(parsedEditAmount) && parsedEditAmount > 0);
  const hasEditChanges = Boolean(
    editingTransaction &&
      (
        editingTransaction.type !== editType ||
        editingTransaction.category !== editCategory ||
        editingTransaction.date !== editDate ||
        editingTransaction.description !== editDescription ||
        editingTransaction.amount !== parsedEditAmount
      )
  );

  const filteredTransactions = userTransactions.filter(t => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !t.category.toLowerCase().includes(query) &&
        !t.description.toLowerCase().includes(query) &&
        !(t.originalCategory && t.originalCategory.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    if (typeFilter !== 'all' && t.type !== typeFilter) {
      return false;
    }

    if (categoryFilter !== 'all' && t.category !== categoryFilter) {
      return false;
    }

    if (dateFrom && t.date < dateFrom) {
      return false;
    }

    if (dateTo && t.date > dateTo) {
      return false;
    }

    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (dateSort !== 'none') {
      const aTime = new Date(`${a.date}T00:00:00`).getTime();
      const bTime = new Date(`${b.date}T00:00:00`).getTime();
      return dateSort === 'desc' ? bTime - aTime : aTime - bTime;
    }

    if (amountSort !== 'none') {
      return amountSort === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }

    return 0;
  });

  const getNextSortDirection = (current: SortDirection): SortDirection => {
    if (current === 'none') return 'desc';
    if (current === 'desc') return 'asc';
    return 'none';
  };

  const toggleDateSort = () => {
    setDateSort((current) => getNextSortDirection(current));
    setAmountSort('none');
  };

  const toggleAmountSort = () => {
    setAmountSort((current) => getNextSortDirection(current));
    setDateSort('none');
  };

  const resetSorting = () => {
    setDateSort('none');
    setAmountSort('none');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleOpenEditDialog = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    setEditType(transaction.type);
    setEditCategory(transaction.category);
    setEditAmount(transaction.amount.toString());
    setEditDate(transaction.date);
    setEditDescription(transaction.description);
    setEditDialogOpen(true);
  };

  const handleEditTypeChange = (newType: 'income' | 'expense') => {
    setEditType(newType);
    const nextCategories = newType === 'income' ? getIncomeCategories() : getExpenseCategories();
    if (!nextCategories.includes(editCategory)) {
      setEditCategory('');
    }
  };

  const handleCloseEditDialog = (open: boolean) => {
    setEditDialogOpen(open);
    if (open) return;

    setEditingTransactionId(null);
    setEditType('expense');
    setEditCategory('');
    setEditAmount('');
    setEditDate('');
    setEditDescription('');
  };

  const handleSaveEdit = () => {
    if (!editingTransaction || !hasValidEditForm || !hasEditChanges) return;

    updateTransaction(editingTransaction.id, {
      type: editType,
      category: editCategory,
      amount: parsedEditAmount,
      date: editDate,
      description: editDescription,
    });
    handleCloseEditDialog(false);
  };

  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="p-6 space-y-6">
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full min-w-[280px] md:w-[440px] lg:w-[520px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по категории или описанию..."
                  className="pl-10 rounded-xl h-10 border-[var(--border)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                  <SelectTrigger className="rounded-xl h-10 w-[170px] border-[var(--border)]">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="income">Доходы</SelectItem>
                    <SelectItem value="expense">Расходы</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="rounded-xl h-10 w-[200px] border-[var(--border)]">
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    <SelectItem value="all">Все категории</SelectItem>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="rounded-xl h-10 w-[150px] border-[var(--border)]"
                >
                  Сбросить
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 pr-1">
                <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                <Label className="text-[var(--text-secondary)]">Период:</Label>
              </div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl h-12 w-[220px] text-base border-[var(--border)]"
                placeholder="С"
              />
              <span className="text-[var(--text-secondary)]">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl h-12 w-[220px] text-base border-[var(--border)]"
                placeholder="По"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-[var(--success-green)]/10 to-[var(--success-green)]/5">
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-secondary)]">Доходы</p>
            <p className="text-xl font-bold text-[var(--success-green)]">
              {formatCurrency(income)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-[var(--danger-rose)]/10 to-[var(--danger-rose)]/5">
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-secondary)]">Расходы</p>
            <p className="text-xl font-bold text-[var(--danger-rose)]">
              {formatCurrency(expense)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-[var(--accent-warm)]/10 to-[var(--accent-coral)]/5">
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-secondary)]">Баланс</p>
            <p className={`text-xl font-bold ${
              balance >= 0 ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'
            }`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Транзакции ({filteredTransactions.length} из {userTransactions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={dateSort === 'none' ? 'outline' : 'default'}
                size="sm"
                onClick={toggleDateSort}
                className={`h-8 rounded-lg px-3 ${
                  dateSort === 'none'
                    ? 'border-[var(--border)] text-[var(--text-secondary)]'
                    : 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white'
                }`}
              >
                Дата {dateSort === 'desc' ? '↓' : dateSort === 'asc' ? '↑' : ''}
              </Button>
              <Button
                variant={amountSort === 'none' ? 'outline' : 'default'}
                size="sm"
                onClick={toggleAmountSort}
                className={`h-8 rounded-lg px-3 ${
                  amountSort === 'none'
                    ? 'border-[var(--border)] text-[var(--text-secondary)]'
                    : 'bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white'
                }`}
              >
                <ArrowDownWideNarrow className="w-3.5 h-3.5 mr-1" />
                Сумма {amountSort === 'desc' ? '↓' : amountSort === 'asc' ? '↑' : ''}
              </Button>
              {(dateSort !== 'none' || amountSort !== 'none') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetSorting}
                  className="h-8 w-8 rounded-lg hover:bg-[var(--bg-secondary)]"
                  aria-label="Сбросить сортировку"
                >
                  <RotateCcw className="w-4 h-4 text-[var(--text-secondary)]" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto rounded-xl">
            <Table>
              <TableHeader className="sticky top-0 bg-[var(--bg-secondary)]">
                <TableRow>
                  <TableHead className="rounded-tl-xl">Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="rounded-tr-xl text-center">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[var(--text-secondary)]">
                      Транзакции не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-[var(--bg-secondary)]">
                      <TableCell className="font-medium">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-[var(--success-green)]/20 text-[var(--success-green)]'
                            : 'bg-[var(--danger-rose)]/20 text-[var(--danger-rose)]'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {transaction.type === 'income' ? 'Доход' : 'Расход'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={transaction.isUncategorized ? 'text-[var(--danger-rose)]' : ''}>
                            {transaction.category}
                          </span>
                          {transaction.isUncategorized && transaction.originalCategory && (
                            <span className="text-xs text-[var(--text-secondary)]">
                              было: {transaction.originalCategory}
                            </span>
                          )}
                          {transaction.isUncategorized && (
                            <Badge variant="outline" className="w-fit mt-1 text-xs border-[var(--danger-rose)] text-[var(--danger-rose)]">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              без категории
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-[var(--text-secondary)]">
                        {transaction.description || '—'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        transaction.type === 'income' 
                          ? 'text-[var(--success-green)]' 
                          : 'text-[var(--danger-rose)]'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(transaction)}
                            className="rounded-lg hover:bg-[var(--accent-warm)]/15"
                          >
                            <PencilLine className="w-4 h-4 text-[var(--accent-coral)]" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="rounded-lg hover:bg-[var(--danger-rose)]/20"
                              >
                                <Trash2 className="w-4 h-4 text-[var(--danger-rose)]" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Транзакция будет удалена навсегда.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">
                                  Отмена
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteTransaction(transaction.id)}
                                  className="rounded-xl bg-[var(--danger-rose)] hover:bg-[var(--danger-rose)]/90"
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Изменить транзакцию</DialogTitle>
            <DialogDescription>
              Обновите поля и сохраните изменения.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Тип транзакции</Label>
              <Select value={editType} onValueChange={(value) => handleEditTypeChange(value as 'income' | 'expense')}>
                <SelectTrigger className="rounded-xl border-[var(--border)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="income">Доход</SelectItem>
                  <SelectItem value="expense">Расход</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="rounded-xl border-[var(--border)]">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[260px]">
                  {editCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="rounded-xl border-[var(--border)]"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Дата</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-xl h-12 text-lg border-[var(--border)]"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded-xl border-[var(--border)] min-h-[90px]"
                placeholder="Описание (необязательно)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseEditDialog(false)} className="rounded-xl">
              Отмена
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!hasValidEditForm || !hasEditChanges}
              className="rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white"
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
