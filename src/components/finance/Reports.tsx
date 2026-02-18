'use client';

import { useState } from 'react';
import { 
  useFinanceStore, 
  formatCurrency, 
  getCategoryBreakdown,
  getMonthName
} from '@/store/finance-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  Target,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { exportToCSV } from '@/store/finance-store';

const COLORS = [
  '#E8A87C', '#C38D6B', '#85C1AE', '#D4A5A5', '#B8977A',
  '#D4B896', '#A8D5BA', '#E8C4A2', '#C9B1A0', '#97B1A6',
];

export function Reports() {
  const { transactions, currentUser } = useFinanceStore();
  
  const userTransactions = transactions.filter(t => t.userId === currentUser?.id);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  
  // Get available years
  const availableYears = [...new Set(userTransactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
  if (availableYears.length === 0) {
    availableYears.push(currentYear, currentYear - 1, currentYear - 2);
  }

  const year = parseInt(selectedYear);
  
  // Get transactions for selected year
  const yearTransactions = userTransactions.filter(t => new Date(t.date).getFullYear() === year);
  
  // Monthly breakdown
  const monthlyData = [];
  for (let m = 0; m < 12; m++) {
    const monthTrans = yearTransactions.filter(t => new Date(t.date).getMonth() === m);
    const income = monthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    monthlyData.push({
      month: getMonthName(m).substring(0, 3),
      fullMonth: getMonthName(m),
      income,
      expense,
      savings: income - expense,
      transactions: monthTrans.length,
    });
  }
  
  // Category breakdown
  const expenseBreakdown = getCategoryBreakdown(yearTransactions, currentUser?.id || '', 'expense');
  const incomeBreakdown = getCategoryBreakdown(yearTransactions, currentUser?.id || '', 'income');
  
  // Day of week analysis
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const dayOfWeekData = [];
  for (let d = 0; d < 7; d++) {
    const dayTrans = yearTransactions.filter(t => new Date(t.date).getDay() === d);
    const expense = dayTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const count = dayTrans.length;
    dayOfWeekData.push({
      day: dayNames[d],
      expense,
      avgExpense: count > 0 ? expense / count : 0,
      count,
    });
  }
  
  // Calculate insights
  const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const avgMonthlyIncome = totalIncome / 12;
  const avgMonthlyExpense = totalExpense / 12;
  
  // Find best and worst months
  const bestMonth = monthlyData.reduce((best, m, idx) => 
    m.savings > (monthlyData[best]?.savings || -Infinity) ? idx : best, 0);
  const worstMonth = monthlyData.reduce((worst, m, idx) => 
    m.savings < (monthlyData[worst]?.savings || Infinity) ? idx : worst, 0);
  
  // Compare with previous year
  const prevYearTransactions = userTransactions.filter(t => new Date(t.date).getFullYear() === year - 1);
  const prevYearIncome = prevYearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevYearExpense = prevYearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const incomeChange = prevYearIncome > 0 ? ((totalIncome - prevYearIncome) / prevYearIncome * 100) : 0;
  const expenseChange = prevYearExpense > 0 ? ((totalExpense - prevYearExpense) / prevYearExpense * 100) : 0;
  
  // Top categories
  const topExpenses = expenseBreakdown.slice(0, 5);
  const topIncome = incomeBreakdown.slice(0, 5);
  
  // Predictions (simple linear extrapolation)
  const monthsPassed = new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12;
  const predictedYearExpense = (totalExpense / monthsPassed) * 12;
  const predictedYearIncome = (totalIncome / monthsPassed) * 12;
  
  // Category trends for radar chart (expense distribution by quarter)
  const categoryRadarData = expenseBreakdown.slice(0, 6).map(cat => {
    const catTrans = yearTransactions.filter(t => t.category === cat.name);
    const q1 = catTrans.filter(t => new Date(t.date).getMonth() < 3).reduce((s, t) => s + t.amount, 0);
    const q2 = catTrans.filter(t => new Date(t.date).getMonth() >= 3 && new Date(t.date).getMonth() < 6).reduce((s, t) => s + t.amount, 0);
    const q3 = catTrans.filter(t => new Date(t.date).getMonth() >= 6 && new Date(t.date).getMonth() < 9).reduce((s, t) => s + t.amount, 0);
    const q4 = catTrans.filter(t => new Date(t.date).getMonth() >= 9).reduce((s, t) => s + t.amount, 0);
    return {
      category: cat.name.length > 10 ? cat.name.substring(0, 10) + '...' : cat.name,
      Q1: q1,
      Q2: q2,
      Q3: q3,
      Q4: q4,
    };
  });

  // Export year data
  const handleExport = () => {
    const csv = exportToCSV(yearTransactions);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance-report-${year}.csv`;
    link.click();
  };

  if (userTransactions.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-[var(--text-secondary)] mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Нет данных для отчётов</h2>
            <p className="text-[var(--text-secondary)]">Добавьте транзакции для формирования аналитики</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Year Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Отчёты и аналитика</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 rounded-xl border-[var(--border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {availableYears.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleExport}
            className="rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] hover:opacity-90 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Доходы за год</p>
            <p className="text-xl font-bold text-[var(--success-green)]">{formatCurrency(totalIncome)}</p>
            {incomeChange !== 0 && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${incomeChange >= 0 ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'}`}>
                {incomeChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(incomeChange).toFixed(1)}% vs {year - 1}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Расходы за год</p>
            <p className="text-xl font-bold text-[var(--danger-rose)]">{formatCurrency(totalExpense)}</p>
            {expenseChange !== 0 && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${expenseChange <= 0 ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'}`}>
                {expenseChange <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {Math.abs(expenseChange).toFixed(1)}% vs {year - 1}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Баланс года</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {((totalIncome - totalExpense) / totalIncome * 100).toFixed(1)}% от доходов
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <p className="text-sm text-[var(--text-secondary)] mb-1">Транзакций</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{yearTransactions.length}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {(yearTransactions.length / 12).toFixed(1)} в месяц
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-[var(--success-green)]/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[var(--success-green)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Лучший месяц</span>
            </div>
            <p className="text-lg font-bold text-[var(--success-green)]">{monthlyData[bestMonth]?.fullMonth}</p>
            <p className="text-sm text-[var(--text-secondary)]">Экономия: {formatCurrency(monthlyData[bestMonth]?.savings || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-[var(--danger-rose)]/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-[var(--danger-rose)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Худший месяц</span>
            </div>
            <p className="text-lg font-bold text-[var(--danger-rose)]">{monthlyData[worstMonth]?.fullMonth}</p>
            <p className="text-sm text-[var(--text-secondary)]">Убыток: {formatCurrency(Math.abs(monthlyData[worstMonth]?.savings || 0))}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-[var(--accent-warm)]/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-[var(--accent-warm)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Прогноз на год</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Доходы: <span className="font-medium text-[var(--success-green)]">{formatCurrency(predictedYearIncome)}</span>
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Расходы: <span className="font-medium text-[var(--danger-rose)]">{formatCurrency(predictedYearExpense)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
            Динамика по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C4" />
                <XAxis dataKey="month" tick={{ fill: '#7A7A7A', fontSize: 12 }} />
                <YAxis tick={{ fill: '#7A7A7A', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E8D5C4',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="income" name="Доходы" stroke="#85C1AE" strokeWidth={2} dot={{ fill: '#85C1AE' }} />
                <Line type="monotone" dataKey="expense" name="Расходы" stroke="#E8A87C" strokeWidth={2} dot={{ fill: '#E8A87C' }} />
                <Line type="monotone" dataKey="savings" name="Экономия" stroke="#C38D6B" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#C38D6B' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Analysis */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Расходы по дням недели
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C4" />
                  <XAxis dataKey="day" tick={{ fill: '#7A7A7A', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#7A7A7A', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E8D5C4',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="expense" name="Расходы" fill="#E8A87C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Radar */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Расходы по кварталам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {categoryRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={categoryRadarData}>
                    <PolarGrid stroke="#E8D5C4" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: '#7A7A7A', fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fill: '#7A7A7A', fontSize: 10 }} />
                    <Radar name="Q1" dataKey="Q1" stroke="#85C1AE" fill="#85C1AE" fillOpacity={0.3} />
                    <Radar name="Q2" dataKey="Q2" stroke="#E8A87C" fill="#E8A87C" fillOpacity={0.3} />
                    <Radar name="Q3" dataKey="Q3" stroke="#C38D6B" fill="#C38D6B" fillOpacity={0.3} />
                    <Radar name="Q4" dataKey="Q4" stroke="#D4A5A5" fill="#D4A5A5" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
                  Недостаточно данных
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expenses */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[var(--danger-rose)]" />
              Топ расходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topExpenses.length === 0 ? (
                <p className="text-center text-[var(--text-secondary)] py-4">Нет данных</p>
              ) : (
                topExpenses.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-[var(--text-primary)]">{cat.name}</p>
                      <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${cat.percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[var(--text-primary)]">{formatCurrency(cat.value)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{cat.percentage}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Income */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--success-green)]" />
              Источники доходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topIncome.length === 0 ? (
                <p className="text-center text-[var(--text-secondary)] py-4">Нет данных</p>
              ) : (
                topIncome.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: COLORS[(idx + 5) % COLORS.length] }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-[var(--text-primary)]">{cat.name}</p>
                      <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${cat.percentage}%`,
                            backgroundColor: COLORS[(idx + 5) % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[var(--text-primary)]">{formatCurrency(cat.value)}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{cat.percentage}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Table */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
            Месячная сводка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--bg-secondary)]">
                  <TableHead className="rounded-tl-xl">Месяц</TableHead>
                  <TableHead className="text-right">Доходы</TableHead>
                  <TableHead className="text-right">Расходы</TableHead>
                  <TableHead className="text-right">Экономия</TableHead>
                  <TableHead className="text-right">Транзакций</TableHead>
                  <TableHead className="rounded-tr-xl text-right">Средняя</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((m, idx) => (
                  <TableRow key={idx} className="hover:bg-[var(--bg-secondary)]">
                    <TableCell className="font-medium">{m.fullMonth}</TableCell>
                    <TableCell className="text-right text-[var(--success-green)]">{formatCurrency(m.income)}</TableCell>
                    <TableCell className="text-right text-[var(--danger-rose)]">{formatCurrency(m.expense)}</TableCell>
                    <TableCell className={`text-right font-medium ${m.savings >= 0 ? 'text-[var(--success-green)]' : 'text-[var(--danger-rose)]'}`}>
                      {formatCurrency(m.savings)}
                    </TableCell>
                    <TableCell className="text-right">{m.transactions}</TableCell>
                    <TableCell className="text-right text-[var(--text-secondary)]">
                      {m.transactions > 0 ? formatCurrency(m.expense / m.transactions) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
