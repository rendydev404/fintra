// Database Types
export type AccountType = 'bank' | 'e-wallet' | 'cash' | 'crypto' | 'investment';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// User
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
}

// Account
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Category
export interface Category {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  created_at: string;
}

// Transaction
export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  to_account_id?: string | null; // For transfers
  amount: number;
  type: TransactionType;
  transaction_date: string;
  description: string | null;
  attachment_url: string | null;
  is_recurring: boolean;
  recurring_rule: RecurringRule | null;
  created_at: string;
  updated_at: string;
  // Joined data
  account?: Account;
  category?: Category;
  to_account?: Account;
}

// Recurring Rule
export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  end_date?: string;
}

// Budget
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  spent: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  rollover: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
}

// Goal
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

// Subscription
export interface Subscription {
  id: string;
  user_id: string;
  category_id: string | null;
  account_id: string | null;
  name: string;
  amount: number;
  billing_cycle: BillingCycle;
  next_billing_date: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
  account?: Account;
}

// Dashboard Stats
export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  accountBalances: { account: Account; balance: number }[];
  categoryBreakdown: { category: Category; amount: number; percentage: number }[];
  recentTransactions: Transaction[];
  monthlyTrend: { month: string; income: number; expense: number }[];
}

// AI Insights
export interface AIInsight {
  type: 'spending' | 'saving' | 'budget' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  data?: Record<string, unknown>;
}

export interface FinancialHealthScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    savingsRate: number;
    debtRatio: number;
    budgetAdherence: number;
    emergencyFund: number;
  };
  recommendations: string[];
}

// Form Types
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string;
  to_account_id?: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  description?: string;
  is_recurring?: boolean;
  recurring_rule?: RecurringRule;
}

export interface CreateBudgetInput {
  category_id: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  rollover?: boolean;
}

export interface CreateGoalInput {
  name: string;
  target_amount: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export interface CreateSubscriptionInput {
  name: string;
  amount: number;
  billing_cycle: BillingCycle;
  next_billing_date: string;
  category_id?: string;
  account_id?: string;
  notes?: string;
}
