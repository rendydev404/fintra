'use client';

import { useMemo, useState } from 'react';
import { useAppStore, useTotalBalance, useActiveGoals, useActiveBudgets } from '@/stores/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getPercentage, abbreviateNumber } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/use-format-currency';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowLeftRight,
  Target,
  PieChart,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function DashboardPage() {
  const { accounts, transactions, categories } = useAppStore();
  const totalBalance = useTotalBalance();
  const activeGoals = useActiveGoals();
  const activeBudgets = useActiveBudgets();
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const formatCurrency = useFormatCurrency();

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Last month comparison
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const lastMonthExpense = transactions
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseChange = lastMonthExpense > 0 
      ? ((expense - lastMonthExpense) / lastMonthExpense) * 100 
      : 0;

    return {
      income,
      expense,
      netCashFlow: income - expense,
      expenseChange,
    };
  }, [transactions]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const expenseByCategory: Record<string, number> = {};

    transactions
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date.getMonth() === thisMonth && 
               date.getFullYear() === thisYear && 
               t.type === 'expense' &&
               t.category_id;
      })
      .forEach(t => {
        const categoryName = t.category?.name || 'Lainnya';
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + t.amount;
      });

    return Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // Monthly trend data
  const trendData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    const now = new Date();

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      months[key] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (months[key]) {
        if (t.type === 'income') {
          months[key].income += t.amount;
        } else if (t.type === 'expense') {
          months[key].expense += t.amount;
        }
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    return Object.entries(months).map(([key, value]) => {
      const [year, month] = key.split('-');
      return {
        name: monthNames[parseInt(month) - 1],
        income: value.income,
        expense: value.expense,
      };
    });
  }, [transactions]);

  // Recent transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang! Berikut ringkasan keuangan Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions?action=add">
            <Button data-tour="add-transaction">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Transaksi
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Saldo</CardTitle>
            <Wallet className="h-5 w-5 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs opacity-70 mt-1">
              {accounts.length} akun aktif
            </p>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan Bulan Ini</CardTitle>
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-xs text-muted-foreground">dari transaksi</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expense */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran Bulan Ini</CardTitle>
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.expense)}</div>
            <div className="flex items-center gap-1 mt-1">
              {stats.expenseChange > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">+{stats.expenseChange.toFixed(1)}%</span>
                </>
              ) : stats.expenseChange < 0 ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">{stats.expenseChange.toFixed(1)}%</span>
                </>
              ) : null}
              <span className="text-xs text-muted-foreground">dari bulan lalu</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arus Kas Bersih</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <ArrowLeftRight className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.netCashFlow >= 0 ? '+' : ''}{formatCurrency(stats.netCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.netCashFlow >= 0 ? 'Surplus' : 'Defisit'} bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tren Keuangan</CardTitle>
                <CardDescription>Pemasukan vs Pengeluaran 6 bulan terakhir</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => abbreviateNumber(value)} 
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Pemasukan"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Pengeluaran"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
            <CardDescription>Distribusi pengeluaran bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada data pengeluaran</p>
                </div>
              </div>
            )}
            {categoryBreakdown.length > 0 && (
              <div className="mt-4 space-y-2">
                {categoryBreakdown.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i] }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>5 transaksi terakhir Anda</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : transaction.type === 'expense'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : transaction.type === 'expense' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.description || transaction.category?.name || 'Transaksi'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{transaction.account?.name}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.transaction_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-semibold ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : transaction.type === 'expense'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada transaksi</p>
                <Link href="/transactions?action=add">
                  <Button variant="link" className="mt-2">
                    Tambah transaksi pertama Anda
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Goals */}
        <div className="space-y-6">
          {/* Active Budgets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Anggaran Aktif</CardTitle>
              <Link href="/budgets">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeBudgets.length > 0 ? (
                <div className="space-y-4">
                  {activeBudgets.slice(0, 3).map((budget) => {
                    const percentage = getPercentage(budget.spent, budget.amount);
                    const isOverBudget = percentage > 100;
                    
                    return (
                      <div key={budget.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{budget.category?.name}</span>
                          <span className={isOverBudget ? 'text-red-600' : 'text-muted-foreground'}>
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={`h-2 ${isOverBudget ? '[&>div]:bg-red-600' : ''}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground text-sm">
                  <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Belum ada anggaran</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Target Tabungan</CardTitle>
              <Link href="/goals">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeGoals.length > 0 ? (
                <div className="space-y-4">
                  {activeGoals.slice(0, 3).map((goal) => {
                    const percentage = getPercentage(goal.current_amount, goal.target_amount);
                    
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-muted-foreground">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(goal.current_amount)} dari {formatCurrency(goal.target_amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground text-sm">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Belum ada target</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights Teaser */}
          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">AI Insights</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dapatkan analisis cerdas dan rekomendasi personal untuk keuangan Anda
                  </p>
                  <Link href="/ai-insights">
                    <Button size="sm" variant="secondary" className="mt-3">
                      Lihat Insights
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
