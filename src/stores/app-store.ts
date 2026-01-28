import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Account, Category, Transaction, Budget, Goal, Subscription } from '@/types';

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Accounts
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  removeAccount: (id: string) => void;

  // Categories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  // Budgets
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  removeBudget: (id: string) => void;

  // Goals
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  // Subscriptions
  subscriptions: Subscription[];
  setSubscriptions: (subscriptions: Subscription[]) => void;
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (id: string, data: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Clear all data (for logout)
  clearData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Accounts
      accounts: [],
      setAccounts: (accounts) => set({ accounts }),
      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      updateAccount: (id, data) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        })),
      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),

      // Categories
      categories: [],
      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, data) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      // Transactions
      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({ transactions: [transaction, ...state.transactions] })),
      updateTransaction: (id, data) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      // Budgets
      budgets: [],
      setBudgets: (budgets) => set({ budgets }),
      addBudget: (budget) =>
        set((state) => ({ budgets: [...state.budgets, budget] })),
      updateBudget: (id, data) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, ...data } : b
          ),
        })),
      removeBudget: (id) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        })),

      // Goals
      goals: [],
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) =>
        set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (id, data) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...data } : g
          ),
        })),
      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      // Subscriptions
      subscriptions: [],
      setSubscriptions: (subscriptions) => set({ subscriptions }),
      addSubscription: (subscription) =>
        set((state) => ({ subscriptions: [...state.subscriptions, subscription] })),
      updateSubscription: (id, data) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      removeSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        })),

      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Loading
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Clear data
      clearData: () =>
        set({
          user: null,
          accounts: [],
          categories: [],
          transactions: [],
          budgets: [],
          goals: [],
          subscriptions: [],
        }),
    }),
    {
      name: 'finance-tracking-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Computed values
export const useTotalBalance = () => {
  const accounts = useAppStore((state) => state.accounts);
  return accounts.reduce((sum, acc) => sum + acc.balance, 0);
};

export const useActiveAccounts = () => {
  const accounts = useAppStore((state) => state.accounts);
  return accounts.filter((acc) => acc.is_active);
};

export const useExpenseCategories = () => {
  const categories = useAppStore((state) => state.categories);
  return categories.filter((cat) => cat.type === 'expense');
};

export const useIncomeCategories = () => {
  const categories = useAppStore((state) => state.categories);
  return categories.filter((cat) => cat.type === 'income');
};

export const useActiveBudgets = () => {
  const budgets = useAppStore((state) => state.budgets);
  const now = new Date().toISOString().split('T')[0];
  return budgets.filter((b) => b.start_date <= now && b.end_date >= now);
};

export const useActiveGoals = () => {
  const goals = useAppStore((state) => state.goals);
  return goals.filter((g) => g.status === 'active');
};

export const useActiveSubscriptions = () => {
  const subscriptions = useAppStore((state) => state.subscriptions);
  return subscriptions.filter((s) => s.is_active);
};
