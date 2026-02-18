import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  userId: string;
  originalCategory?: string; // Для транзакций без категории
  isUncategorized?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  userId: string;
  isDefault: boolean;
  isFavorite: boolean;
  order: number;
}

export interface BudgetLimit {
  id: string;
  category: string;
  amount: number;
  userId: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Продукты',
  'Одежда',
  'Здоровье',
  'Образование',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Зарплата',
];

interface FinanceState {
  // User state
  users: User[];
  currentUser: User | null;
  isLoggedIn: boolean;

  // Categories
  categories: Category[];

  // Budget limits
  budgetLimits: BudgetLimit[];

  // Transactions
  transactions: Transaction[];
  isImported: boolean;
  activeTab: 'dashboard' | 'add' | 'history' | 'reports' | 'settings';

  // Profile modal
  isProfileOpen: boolean;
  
  // User actions
  register: (username: string, password: string) => { success: boolean; message: string };
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  deleteCurrentUser: () => void;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) => void;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  
  // Profile modal
  openProfile: () => void;
  closeProfile: () => void;
  
  // Category actions
  addCategory: (name: string, type: 'income' | 'expense') => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  toggleFavorite: (id: string) => void;
  reorderCategories: (type: 'income' | 'expense', newOrder: string[]) => void;
  getExpenseCategories: () => string[];
  getIncomeCategories: () => string[];
  getAllUserCategories: (type: 'income' | 'expense') => Category[];
  hasUncategorizedTransactions: (type: 'income' | 'expense') => boolean;
  
  // Transaction actions
  setActiveTab: (tab: 'dashboard' | 'add' | 'history' | 'reports' | 'settings') => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (
    id: string,
    transaction: Pick<Transaction, 'type' | 'category' | 'amount' | 'date' | 'description'>
  ) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (transactions: Transaction[]) => void;
  clearAllTransactions: () => void;
  
  // Budget limit actions
  setBudgetLimit: (category: string, amount: number) => void;
  removeBudgetLimit: (category: string) => void;
  getBudgetLimit: (category: string) => number | null;
  getBudgetProgress: (category: string, year?: number, month?: number) => { spent: number; limit: number; percentage: number } | null;
  getAllBudgetLimits: () => BudgetLimit[];

  // Computed helpers
  getMonthlyIncome: (year: number, month: number) => number;
  getMonthlyExpenses: (year: number, month: number) => number;
  getCategoryTotals: (type: 'income' | 'expense', year?: number, month?: number) => Record<string, number>;
  getRecentTransactions: (limit?: number) => Transaction[];
  searchTransactions: (query: string) => Transaction[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      isLoggedIn: false,
      categories: [],
      budgetLimits: [],
      transactions: [],
      isImported: false,
      activeTab: 'dashboard',
      isProfileOpen: false,

      // User actions
      register: (username, password) => {
        const { users } = get();
        
        if (!username || username.length < 3) {
          return { success: false, message: 'Имя пользователя должно быть минимум 3 символа' };
        }
        
        if (!password || password.length < 4) {
          return { success: false, message: 'Пароль должен быть минимум 4 символа' };
        }
        
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          return { success: false, message: 'Пользователь с таким именем уже существует' };
        }
        
        const newUser: User = {
          id: generateId(),
          username,
          password: hashPassword(password),
          firstName: '',
          lastName: '',
          email: '',
          createdAt: new Date().toISOString(),
        };
        
        const defaultExpenseCategories: Category[] = DEFAULT_EXPENSE_CATEGORIES.map((name, idx) => ({
          id: `cat-exp-${generateId()}`,
          name,
          type: 'expense' as const,
          userId: newUser.id,
          isDefault: true,
          isFavorite: false,
          order: idx,
        }));
        
        const defaultIncomeCategories: Category[] = DEFAULT_INCOME_CATEGORIES.map((name, idx) => ({
          id: `cat-inc-${generateId()}`,
          name,
          type: 'income' as const,
          userId: newUser.id,
          isDefault: true,
          isFavorite: false,
          order: idx,
        }));
        
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
          isLoggedIn: true,
          categories: [...state.categories, ...defaultExpenseCategories, ...defaultIncomeCategories],
        }));
        
        return { success: true, message: 'Регистрация успешна!' };
      },

      login: (username, password) => {
        const { users } = get();
        const hashedPassword = hashPassword(password);
        
        const user = users.find(
          u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashedPassword
        );
        
        if (!user) {
          return { success: false, message: 'Неверное имя пользователя или пароль' };
        }
        
        set({ currentUser: user, isLoggedIn: true });
        return { success: true, message: 'Вход выполнен!' };
      },

      logout: () => {
        set({ currentUser: null, isLoggedIn: false, activeTab: 'dashboard', isProfileOpen: false });
      },

      deleteCurrentUser: () => {
        const { currentUser } = get();
        if (!currentUser) return;

        set((state) => ({
          users: state.users.filter((u) => u.id !== currentUser.id),
          categories: state.categories.filter((c) => c.userId !== currentUser.id),
          transactions: state.transactions.filter((t) => t.userId !== currentUser.id),
          currentUser: null,
          isLoggedIn: false,
          isProfileOpen: false,
          activeTab: 'dashboard',
          isImported: false,
        }));
      },

      updateProfile: (data) => {
        set((state) => {
          if (!state.currentUser) return state;
          
          const updatedUser = { ...state.currentUser, ...data };
          return {
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
          };
        });
      },

      changePassword: (oldPassword, newPassword) => {
        const { currentUser, users } = get();
        if (!currentUser) {
          return { success: false, message: 'Пользователь не найден' };
        }
        
        if (hashPassword(oldPassword) !== currentUser.password) {
          return { success: false, message: 'Неверный текущий пароль' };
        }
        
        if (newPassword.length < 4) {
          return { success: false, message: 'Новый пароль должен быть минимум 4 символа' };
        }
        
        const updatedUser = { ...currentUser, password: hashPassword(newPassword) };
        set({
          currentUser: updatedUser,
          users: users.map(u => u.id === updatedUser.id ? updatedUser : u),
        });
        
        return { success: true, message: 'Пароль успешно изменён!' };
      },

      openProfile: () => set({ isProfileOpen: true }),
      closeProfile: () => set({ isProfileOpen: false }),

      // Category actions
      addCategory: (name, type) => {
        const { currentUser, categories } = get();
        if (!currentUser) return;
        
        const exists = categories.some(
          c => c.userId === currentUser.id && c.name.toLowerCase() === name.toLowerCase() && c.type === type
        );
        
        if (exists) return;
        
        const sameTypeCategories = categories.filter(
          c => c.userId === currentUser.id && c.type === type
        );
        const maxOrder = sameTypeCategories.length > 0 
          ? Math.max(...sameTypeCategories.map(c => c.order)) 
          : -1;
        
        const newCategory: Category = {
          id: `cat-${generateId()}`,
          name,
          type,
          userId: currentUser.id,
          isDefault: false,
          isFavorite: false,
          order: maxOrder + 1,
        };
        
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      renameCategory: (id, newName) => {
        const { currentUser, categories, transactions } = get();
        if (!currentUser) return;
        
        const category = categories.find(c => c.id === id);
        if (!category) return;
        
        const oldName = category.name;
        
        const exists = categories.some(
          c => c.id !== id && c.userId === currentUser.id && c.name.toLowerCase() === newName.toLowerCase() && c.type === category.type
        );
        
        if (exists) return;
        
        set((state) => ({
          categories: state.categories.map(c => 
            c.id === id ? { ...c, name: newName } : c
          ),
          transactions: state.transactions.map(t => 
            t.category === oldName &&
            t.type === category.type &&
            t.userId === currentUser.id
              ? { ...t, category: newName }
              : t
          ),
        }));
      },

      deleteCategory: (id) => {
        const { currentUser, categories, transactions } = get();
        if (!currentUser) return;
        
        const category = categories.find(c => c.id === id);
        if (!category) return;
        
        const oldName = category.name;
        const uncategorizedName = 'Без категории';
        
        // Move transactions to "Без категории"
        set((state) => ({
          categories: state.categories.filter(c => c.id !== id),
          transactions: state.transactions.map(t => 
            t.category === oldName &&
            t.type === category.type &&
            t.userId === currentUser.id
              ? { ...t, category: uncategorizedName, originalCategory: oldName, isUncategorized: true }
              : t
          ),
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          categories: state.categories.map(c => 
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          ),
        }));
      },

      reorderCategories: (type, newOrder) => {
        set((state) => ({
          categories: state.categories.map(c => {
            const index = newOrder.indexOf(c.id);
            if (c.type === type && index !== -1) {
              return { ...c, order: index };
            }
            return c;
          }),
        }));
      },

      getExpenseCategories: () => {
        const { currentUser, categories } = get();
        if (!currentUser) return DEFAULT_EXPENSE_CATEGORIES;
        
        return categories
          .filter(c => c.userId === currentUser.id && c.type === 'expense')
          .sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return a.order - b.order;
          })
          .map(c => c.name);
      },

      getIncomeCategories: () => {
        const { currentUser, categories } = get();
        if (!currentUser) return DEFAULT_INCOME_CATEGORIES;
        
        return categories
          .filter(c => c.userId === currentUser.id && c.type === 'income')
          .sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return a.order - b.order;
          })
          .map(c => c.name);
      },

      getAllUserCategories: (type) => {
        const { currentUser, categories } = get();
        if (!currentUser) return [];
        
        return categories
          .filter(c => c.userId === currentUser.id && c.type === type)
          .sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return a.order - b.order;
          });
      },

      hasUncategorizedTransactions: (type) => {
        const { transactions, currentUser } = get();
        return transactions.some(
          t => t.userId === currentUser?.id && t.type === type && t.isUncategorized
        );
      },

      // Transaction actions
      setActiveTab: (tab) => set({ activeTab: tab }),

      addTransaction: (transaction) => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        const newTransaction: Transaction = {
          ...transaction,
          id: `tx-${generateId()}`,
          userId: currentUser.id,
        };
        
        set((state) => ({
          transactions: [newTransaction, ...state.transactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        }));
      },

      updateTransaction: (id, transaction) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set((state) => ({
          transactions: state.transactions
            .map((t) => {
              if (t.id !== id || t.userId !== currentUser.id) return t;

              const isUncategorized = transaction.category === 'Без категории';
              return {
                ...t,
                ...transaction,
                isUncategorized: isUncategorized ? t.isUncategorized : false,
                originalCategory: isUncategorized ? t.originalCategory : undefined,
              };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      importTransactions: (transactions) => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        set((state) => {
          const existingIds = new Set(state.transactions.map(t => t.id));
          const newTransactions = transactions
            .filter(t => !existingIds.has(t.id))
            .map(t => ({ ...t, userId: currentUser.id }));
          const allTransactions = [...state.transactions, ...newTransactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          return {
            transactions: allTransactions,
            isImported: true,
          };
        });
      },

      clearAllTransactions: () => {
        set({ transactions: [], isImported: false });
      },

      // Budget limit actions
      setBudgetLimit: (category, amount) => {
        const { currentUser, budgetLimits } = get();
        if (!currentUser) return;

        const existingIndex = budgetLimits.findIndex(
          bl => bl.userId === currentUser.id && bl.category === category
        );

        if (existingIndex >= 0) {
          // Update existing
          set({
            budgetLimits: budgetLimits.map(bl =>
              bl.userId === currentUser.id && bl.category === category
                ? { ...bl, amount }
                : bl
            )
          });
        } else {
          // Create new
          const newLimit: BudgetLimit = {
            id: `limit-${generateId()}`,
            category,
            amount,
            userId: currentUser.id,
          };
          set({ budgetLimits: [...budgetLimits, newLimit] });
        }
      },

      removeBudgetLimit: (category) => {
        const { currentUser, budgetLimits } = get();
        if (!currentUser) return;

        set({
          budgetLimits: budgetLimits.filter(
            bl => !(bl.userId === currentUser.id && bl.category === category)
          )
        });
      },

      getBudgetLimit: (category) => {
        const { currentUser, budgetLimits } = get();
        if (!currentUser) return null;

        const limit = budgetLimits.find(
          bl => bl.userId === currentUser.id && bl.category === category
        );
        return limit ? limit.amount : null;
      },

      getBudgetProgress: (category, year, month) => {
        const { currentUser, transactions, budgetLimits } = get();
        if (!currentUser) return null;

        const limit = budgetLimits.find(
          bl => bl.userId === currentUser.id && bl.category === category
        );
        if (!limit) return null;

        const now = new Date();
        const targetYear = year ?? now.getFullYear();
        const targetMonth = month ?? now.getMonth();

        const spent = transactions
          .filter(t => {
            const date = new Date(t.date);
            return t.userId === currentUser.id &&
                   t.type === 'expense' &&
                   t.category === category &&
                   date.getFullYear() === targetYear &&
                   date.getMonth() === targetMonth;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          spent,
          limit: limit.amount,
          percentage: limit.amount > 0 ? Math.min((spent / limit.amount) * 100, 100) : 0
        };
      },

      getAllBudgetLimits: () => {
        const { currentUser, budgetLimits } = get();
        if (!currentUser) return [];
        return budgetLimits.filter(bl => bl.userId === currentUser.id);
      },

      getMonthlyIncome: (year, month) => {
        const { transactions, currentUser } = get();
        return transactions
          .filter((t) => {
            const date = new Date(t.date);
            return t.type === 'income' && 
                   t.userId === currentUser?.id &&
                   date.getFullYear() === year && 
                   date.getMonth() === month;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      },

      getMonthlyExpenses: (year, month) => {
        const { transactions, currentUser } = get();
        return transactions
          .filter((t) => {
            const date = new Date(t.date);
            return t.type === 'expense' && 
                   t.userId === currentUser?.id &&
                   date.getFullYear() === year && 
                   date.getMonth() === month;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      },

      getCategoryTotals: (type, year, month) => {
        const { transactions, currentUser } = get();
        const filtered = transactions.filter((t) => {
          const date = new Date(t.date);
          const typeMatch = t.type === type;
          const userMatch = t.userId === currentUser?.id;
          const yearMatch = year ? date.getFullYear() === year : true;
          const monthMatch = month !== undefined ? date.getMonth() === month : true;
          return typeMatch && userMatch && yearMatch && monthMatch;
        });

        return filtered.reduce<Record<string, number>>((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});
      },

      getRecentTransactions: (limit = 5) => {
        const { transactions, currentUser } = get();
        return transactions
          .filter(t => t.userId === currentUser?.id)
          .slice(0, limit);
      },

      searchTransactions: (query) => {
        const { transactions, currentUser } = get();
        if (!currentUser || !query.trim()) return [];

        const searchTerm = query.toLowerCase().trim();
        return transactions.filter(t => {
          if (t.userId !== currentUser.id) return false;
          return (
            t.category.toLowerCase().includes(searchTerm) ||
            t.description.toLowerCase().includes(searchTerm) ||
            t.amount.toString().includes(searchTerm) ||
            t.date.includes(searchTerm)
          );
        });
      },
    }),
    {
      name: 'finance-storage',
      partialize: (state) => ({
        users: state.users,
        currentUser: state.currentUser,
        isLoggedIn: state.isLoggedIn,
        categories: state.categories,
        budgetLimits: state.budgetLimits,
        transactions: state.transactions,
        isImported: state.isImported,
      }),
    }
  )
);

// Helper functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getMonthName = (month: number): string => {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[month];
};

export const getMonthlyChartData = (transactions: Transaction[], userId: string, months: number = 6) => {
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    const income = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return t.type === 'income' && 
               t.userId === userId &&
               tDate.getFullYear() === year && 
               tDate.getMonth() === month;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && 
               t.userId === userId &&
               tDate.getFullYear() === year && 
               tDate.getMonth() === month;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    result.push({
      month: getMonthName(month),
      year,
      income,
      expense,
      savings: income - expense,
    });
  }

  return result;
};

export const getCategoryBreakdown = (transactions: Transaction[], userId: string, type: 'income' | 'expense') => {
  const filtered = transactions.filter((t) => t.type === type && t.userId === userId);
  const totals: Record<string, number> = {};

  filtered.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const total = Object.values(totals).reduce((sum, val) => sum + val, 0);

  return Object.entries(totals)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
    }))
    .sort((a, b) => b.value - a.value);
};

export const exportToCSV = (transactions: Transaction[]): string => {
  const headers = ['Дата', 'Тип', 'Категория', 'Сумма', 'Описание'];
  const rows = transactions.map((t) => [
    t.date,
    t.type === 'income' ? 'Доход' : 'Расход',
    t.isUncategorized ? `${t.category} (было: ${t.originalCategory})` : t.category,
    t.amount.toString(),
    t.description,
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.join(';')),
  ].join('\n');

  return csvContent;
};
