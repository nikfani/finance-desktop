'use client';

import { useFinanceStore, formatCurrency, getMonthlyChartData, getCategoryBreakdown } from '@/store/finance-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = [
  '#E8A87C', '#C38D6B', '#85C1AE', '#D4A5A5', '#B8977A',
  '#D4B896', '#A8D5BA', '#E8C4A2', '#C9B1A0', '#97B1A6',
  '#D9C4B0', '#B5C4B1', '#E8D5C4', '#C4A484', '#A8B5A0',
  '#D4C5B0', '#B8A090', '#9DB5A0', '#D0C0B0', '#B0A090'
];

export function Dashboard() {
  const { transactions, currentUser, getMonthlyIncome, getMonthlyExpenses, getRecentTransactions, getAllBudgetLimits, getBudgetProgress, getExpenseCategories } = useFinanceStore();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Filter transactions for current user
  const userTransactions = transactions.filter(t => t.userId === currentUser?.id);
  
  // Calculate totals
  const totalIncome = userTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = userTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;
  const monthlyIncome = getMonthlyIncome(currentYear, currentMonth);
  const monthlyExpenses = getMonthlyExpenses(currentYear, currentMonth);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  
  const recentTransactions = getRecentTransactions(5);
  const monthlyChartData = getMonthlyChartData(transactions, currentUser?.id || '', 6);
  const categoryBreakdown = getCategoryBreakdown(transactions, currentUser?.id || '', 'expense');
  
  // Get budget limits with progress
  const budgetLimits = getAllBudgetLimits();
  const budgetProgress = budgetLimits.map(limit => {
    const progress = getBudgetProgress(limit.category, currentYear, currentMonth);
    return {
      category: limit.category,
      limit: limit.amount,
      spent: progress?.spent || 0,
      percentage: progress?.percentage || 0,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const metricCards = [
    {
      title: 'Общий баланс',
      value: formatCurrency(balance),
      icon: Wallet,
      iconBg: 'bg-gradient-to-br from-[var(--accent-warm)] to-[var(--accent-coral)]',
      trend: balance >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Доходы за месяц',
      value: formatCurrency(monthlyIncome),
      icon: TrendingUp,
      iconBg: 'bg-gradient-to-br from-[var(--success-green)] to-[#6BAF9B]',
      trend: 'positive',
    },
    {
      title: 'Расходы за месяц',
      value: formatCurrency(monthlyExpenses),
      icon: TrendingDown,
      iconBg: 'bg-gradient-to-br from-[var(--danger-rose)] to-[#C49090]',
      trend: 'negative',
    },
    {
      title: 'Экономия за месяц',
      value: formatCurrency(monthlySavings),
      icon: PiggyBank,
      iconBg: 'bg-gradient-to-br from-[var(--warm-peach)] to-[var(--warm-coral)]',
      trend: monthlySavings >= 0 ? 'positive' : 'negative',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-0 shadow-md hover:shadow-lg transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--text-secondary)]">{card.title}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income/Expense Chart */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Доходы и расходы по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#85C1AE" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#85C1AE" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8A87C" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#E8A87C" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C4" />
                  <XAxis dataKey="month" tick={{ fill: '#7A7A7A', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#7A7A7A', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E8D5C4',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#85C1AE" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)"
                    name="Доходы"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#E8A87C" 
                    fillOpacity={1} 
                    fill="url(#colorExpense)"
                    name="Расходы"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
              Расходы по категориям
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      labelLine={{ stroke: '#7A7A7A' }}
                    >
                      {categoryBreakdown.slice(0, 8).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E8D5C4',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
                  Нет данных для отображения
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Limits */}
      {budgetProgress.length > 0 && (
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--accent-warm)]" />
              Лимиты бюджета
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetProgress.map((item) => {
                const isOverLimit = item.percentage >= 100;
                const isWarning = item.percentage >= 80 && item.percentage < 100;
                
                return (
                  <div 
                    key={item.category}
                    className="p-4 rounded-xl bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--text-primary)]">{item.category}</span>
                      <div className="flex items-center gap-2">
                        {isOverLimit && (
                          <AlertCircle className="w-4 h-4 text-[var(--danger-rose)]" />
                        )}
                        <span className={`text-sm font-medium ${
                          isOverLimit ? 'text-[var(--danger-rose)]' : 
                          isWarning ? 'text-[var(--accent-warm)]' : 
                          'text-[var(--text-secondary)]'
                        }`}>
                          {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverLimit ? 'bg-[var(--danger-rose)]' :
                          isWarning ? 'bg-[var(--accent-warm)]' :
                          'bg-[var(--success-green)]'
                        }`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {item.percentage.toFixed(0)}% использовано
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
            Последние транзакции
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-8">
                Нет транзакций. Добавьте первую!
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-[var(--success-green)]/20' 
                        : 'bg-[var(--danger-rose)]/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-[var(--success-green)]" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-[var(--danger-rose)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {transaction.category}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {transaction.description || 'Без описания'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-[var(--success-green)]' 
                        : 'text-[var(--danger-rose)]'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {new Date(transaction.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
