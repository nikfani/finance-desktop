'use client';

import { useState } from 'react';
import { useFinanceStore, formatCurrency } from '@/store/finance-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CheckCircle, ArrowDownCircle, ArrowUpCircle, Trash2, Calculator, X } from 'lucide-react';

type AddMode = 'single' | 'batch';

type BatchRow = {
  id: string;
  amount: string;
  description: string;
};

const createBatchRow = (): BatchRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  amount: '',
  description: '',
});

export function AddTransaction() {
  const { addTransaction, getExpenseCategories, getIncomeCategories } = useFinanceStore();
  
  const [mode, setMode] = useState<AddMode>('single');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [batchRows, setBatchRows] = useState<BatchRow[]>([createBatchRow()]);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeBatchRowId, setActiveBatchRowId] = useState<string | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcStoredValue, setCalcStoredValue] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<'+' | '-' | '*' | '/' | null>(null);
  const [calcAwaitingOperand, setCalcAwaitingOperand] = useState(false);

  const categories = type === 'income' ? getIncomeCategories() : getExpenseCategories();
  const validBatchRows = batchRows.filter((row) => {
    const parsed = Number.parseFloat(row.amount);
    return !Number.isNaN(parsed) && parsed > 0;
  });
  const hasBatchData = validBatchRows.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !date) return;

    if (mode === 'single') {
      if (!amount) return;
      const numAmount = Number.parseFloat(amount);
      if (Number.isNaN(numAmount) || numAmount <= 0) return;

      addTransaction({
        type,
        category,
        amount: numAmount,
        date,
        description,
      });

      setAmount('');
      setDescription('');
      setSuccessMessage('Транзакция успешно добавлена!');
    } else {
      if (!hasBatchData) return;

      validBatchRows.forEach((row) => {
        addTransaction({
          type,
          category,
          amount: Number.parseFloat(row.amount),
          date,
          description: row.description.trim(),
        });
      });

      setBatchRows([createBatchRow()]);
      setSuccessMessage(`Добавлено позиций: ${validBatchRows.length}`);
    }

    setCategory('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(''); // Reset category when type changes
  };

  const handleModeChange = (newMode: AddMode) => {
    setMode(newMode);
    setAmount('');
    setDescription('');
    setBatchRows([createBatchRow()]);
    setActiveBatchRowId(null);
  };

  const updateBatchRow = (id: string, patch: Partial<BatchRow>) => {
    setBatchRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const addBatchRow = () => {
    setBatchRows((current) => [...current, createBatchRow()]);
  };

  const removeBatchRow = (id: string) => {
    setBatchRows((current) => {
      if (current.length === 1) return current;
      return current.filter((row) => row.id !== id);
    });
    setActiveBatchRowId((current) => (current === id ? null : current));
  };

  const parseCalcValue = (value: string) => Number.parseFloat(value);

  const formatCalcValue = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    const rounded = Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
    return String(rounded);
  };

  const calcCompute = (left: number, right: number, operator: '+' | '-' | '*' | '/') => {
    if (operator === '+') return left + right;
    if (operator === '-') return left - right;
    if (operator === '*') return left * right;
    if (right === 0) return 0;
    return left / right;
  };

  const handleCalcDigit = (digit: string) => {
    if (calcAwaitingOperand || calcDisplay === '0') {
      setCalcDisplay(digit);
      setCalcAwaitingOperand(false);
      return;
    }
    setCalcDisplay((current) => `${current}${digit}`);
  };

  const handleCalcDot = () => {
    if (calcAwaitingOperand) {
      setCalcDisplay('0.');
      setCalcAwaitingOperand(false);
      return;
    }
    if (!calcDisplay.includes('.')) {
      setCalcDisplay((current) => `${current}.`);
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcStoredValue(null);
    setCalcOperator(null);
    setCalcAwaitingOperand(false);
  };

  const handleCalcPercent = () => {
    const current = parseCalcValue(calcDisplay);
    if (Number.isNaN(current)) return;
    setCalcDisplay(formatCalcValue(current / 100));
  };

  const handleCalcOperator = (nextOperator: '+' | '-' | '*' | '/') => {
    const inputValue = parseCalcValue(calcDisplay);
    if (Number.isNaN(inputValue)) return;

    if (calcStoredValue === null) {
      setCalcStoredValue(inputValue);
    } else if (calcOperator && !calcAwaitingOperand) {
      const result = calcCompute(calcStoredValue, inputValue, calcOperator);
      setCalcStoredValue(result);
      setCalcDisplay(formatCalcValue(result));
    }

    setCalcOperator(nextOperator);
    setCalcAwaitingOperand(true);
  };

  const handleCalcEquals = () => {
    if (calcStoredValue === null || calcOperator === null) return;

    const inputValue = parseCalcValue(calcDisplay);
    if (Number.isNaN(inputValue)) return;

    const result = calcCompute(calcStoredValue, inputValue, calcOperator);
    setCalcDisplay(formatCalcValue(result));
    setCalcStoredValue(null);
    setCalcOperator(null);
    setCalcAwaitingOperand(true);
  };

  const applyCalculatorValueToAmount = () => {
    const numericValue = parseCalcValue(calcDisplay);
    if (Number.isNaN(numericValue) || numericValue <= 0) return;

    const nextValue = formatCalcValue(numericValue);

    if (mode === 'single') {
      setAmount(nextValue);
      return;
    }

    const targetId = activeBatchRowId ?? batchRows[0]?.id;
    if (!targetId) return;
    updateBatchRow(targetId, { amount: nextValue });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить транзакцию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 inline-flex rounded-xl border border-[var(--border)] p-1">
            <button
              type="button"
              onClick={() => handleModeChange('single')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                mode === 'single'
                  ? 'bg-[var(--accent-warm)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              Одна позиция
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('batch')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                mode === 'batch'
                  ? 'bg-[var(--accent-warm)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              Несколько позиций
            </button>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[var(--success-green)]/20 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[var(--success-green)]" />
              <p className="text-[var(--success-green)] font-medium">
                {successMessage}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type */}
            <div className="space-y-3">
              <Label className="text-[var(--text-primary)] font-medium">Тип транзакции</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    type === 'expense'
                      ? 'border-[var(--danger-rose)] bg-[var(--danger-rose)]/10'
                      : 'border-[var(--border)] hover:border-[var(--accent-warm)]'
                  }`}
                >
                  <ArrowDownCircle className={`w-6 h-6 ${
                    type === 'expense' ? 'text-[var(--danger-rose)]' : 'text-[var(--text-secondary)]'
                  }`} />
                  <span className={`font-medium ${
                    type === 'expense' ? 'text-[var(--danger-rose)]' : 'text-[var(--text-secondary)]'
                  }`}>
                    Расход
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    type === 'income'
                      ? 'border-[var(--success-green)] bg-[var(--success-green)]/10'
                      : 'border-[var(--border)] hover:border-[var(--accent-warm)]'
                  }`}
                >
                  <ArrowUpCircle className={`w-6 h-6 ${
                    type === 'income' ? 'text-[var(--success-green)]' : 'text-[var(--text-secondary)]'
                  }`} />
                  <span className={`font-medium ${
                    type === 'income' ? 'text-[var(--success-green)]' : 'text-[var(--text-secondary)]'
                  }`}>
                    Доход
                  </span>
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-[var(--text-primary)] font-medium">
                Категория
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl h-12 border-[var(--border)] focus:border-[var(--accent-warm)]">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-lg">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Категории не найдены. Добавьте их в Настройках.
                </p>
              )}
            </div>

            {mode === 'single' ? (
              <>
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-[var(--text-primary)] font-medium">
                    Сумма
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onFocus={() => setActiveBatchRowId(null)}
                      placeholder="0.00"
                      className="rounded-xl h-12 pr-16 border-[var(--border)] focus:border-[var(--accent-warm)]"
                      min="0"
                      step="0.01"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                      ₽
                    </span>
                  </div>
                  {amount && Number.parseFloat(amount) > 0 && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      {formatCurrency(Number.parseFloat(amount))}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[var(--text-primary)] font-medium">
                    Описание (необязательно)
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Добавьте описание транзакции..."
                    className="rounded-xl border-[var(--border)] focus:border-[var(--accent-warm)] min-h-[100px]"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Label className="text-[var(--text-primary)] font-medium">Позиции</Label>
                <div className="space-y-2">
                  {batchRows.map((row, index) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2 items-start">
                      <div className="relative">
                        <Input
                          type="number"
                          value={row.amount}
                          onChange={(e) => updateBatchRow(row.id, { amount: e.target.value })}
                          onFocus={() => setActiveBatchRowId(row.id)}
                          placeholder="Сумма"
                          className="rounded-xl h-11 pr-8 border-[var(--border)]"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">
                          ₽
                        </span>
                      </div>
                      <Input
                        value={row.description}
                        onChange={(e) => updateBatchRow(row.id, { description: e.target.value })}
                        placeholder={`Описание позиции ${index + 1} (необязательно)`}
                        className="rounded-xl h-11 border-[var(--border)]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBatchRow(row.id)}
                        disabled={batchRows.length === 1}
                        className="h-11 w-11 rounded-xl hover:bg-[var(--danger-rose)]/15 disabled:opacity-40"
                        aria-label="Удалить позицию"
                      >
                        <Trash2 className="w-4 h-4 text-[var(--danger-rose)]" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBatchRow}
                  className="rounded-xl border-[var(--border)]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить строку
                </Button>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-[var(--text-primary)] font-medium">
                Дата
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl h-14 text-lg border-[var(--border)] focus:border-[var(--accent-warm)]"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] hover:opacity-90 text-white font-medium shadow-md"
              disabled={mode === 'single' ? !category || !amount || !date : !category || !date || !hasBatchData}
            >
              <Plus className="w-5 h-5 mr-2" />
              {mode === 'single'
                ? 'Добавить транзакцию'
                : `Добавить позиции${hasBatchData ? ` (${validBatchRows.length})` : ''}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
        {calcOpen && (
          <div className="w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-white shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[var(--text-secondary)]">Калькулятор</p>
              <button
                type="button"
                onClick={() => setCalcOpen(false)}
                className="rounded-lg p-1 hover:bg-[var(--bg-secondary)]"
                aria-label="Закрыть калькулятор"
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="rounded-xl bg-[var(--bg-secondary)] px-3 py-2 text-right mb-3">
              <p className="text-xl font-semibold text-[var(--text-primary)] truncate">{calcDisplay}</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button type="button" variant="outline" onClick={handleCalcClear} className="rounded-lg h-9 border-[var(--border)]">C</Button>
              <Button type="button" variant="outline" onClick={handleCalcPercent} className="rounded-lg h-9 border-[var(--border)]">%</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcOperator('/')} className="rounded-lg h-9 border-[var(--border)]">÷</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcOperator('*')} className="rounded-lg h-9 border-[var(--border)]">×</Button>

              <Button type="button" variant="outline" onClick={() => handleCalcDigit('7')} className="rounded-lg h-9 border-[var(--border)]">7</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcDigit('8')} className="rounded-lg h-9 border-[var(--border)]">8</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcDigit('9')} className="rounded-lg h-9 border-[var(--border)]">9</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcOperator('-')} className="rounded-lg h-9 border-[var(--border)]">-</Button>

              <Button type="button" variant="outline" onClick={() => handleCalcDigit('4')} className="rounded-lg h-9 border-[var(--border)]">4</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcDigit('5')} className="rounded-lg h-9 border-[var(--border)]">5</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcDigit('6')} className="rounded-lg h-9 border-[var(--border)]">6</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcOperator('+')} className="rounded-lg h-9 border-[var(--border)]">+</Button>

              <Button type="button" variant="outline" onClick={() => handleCalcDigit('1')} className="rounded-lg h-9 border-[var(--border)]">1</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcDigit('2')} className="rounded-lg h-9 border-[var(--border)]">2</Button>
              <Button type="button" variant="outline" onClick={() => handleCalcDigit('3')} className="rounded-lg h-9 border-[var(--border)]">3</Button>
              <Button type="button" variant="default" onClick={handleCalcEquals} className="rounded-lg h-9 bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white">=</Button>

              <Button type="button" variant="outline" onClick={() => handleCalcDigit('0')} className="rounded-lg h-9 border-[var(--border)]">0</Button>
              <Button type="button" variant="outline" onClick={handleCalcDot} className="rounded-lg h-9 border-[var(--border)]">.</Button>
              <Button
                type="button"
                onClick={applyCalculatorValueToAmount}
                className="col-span-2 rounded-lg h-9 bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                В сумму
              </Button>
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={() => setCalcOpen((current) => !current)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] text-white shadow-md"
          aria-label="Открыть калькулятор"
        >
          <Calculator className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
