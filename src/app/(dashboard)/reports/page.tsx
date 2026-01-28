'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPercentage, cn, getMonthName } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/use-format-currency';
import { exportToExcel, exportToPDF } from '@/lib/export';
import {
  FileBarChart,
  CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
} from 'lucide-react';
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
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, eachMonthOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ReportsPage() {
  const { transactions, categories, accounts, user } = useAppStore();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const formatCurrency = useFormatCurrency();
  const userCurrency = user?.currency || 'IDR';

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from) return transactions;
    
    return transactions.filter(t => {
      const date = new Date(t.transaction_date);
      if (dateRange.from && date < dateRange.from) return false;
      if (dateRange.to && date > dateRange.to) return false;
      return true;
    });
  }, [transactions, dateRange]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      netCashFlow: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Income by category
  const incomeByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const name = t.category?.name || 'Lainnya';
        data[name] = (data[name] || 0) + t.amount;
      });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const name = t.category?.name || 'Lainnya';
        data[name] = (data[name] || 0) + t.amount;
      });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Monthly trend (last 12 months)
  const monthlyTrend = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date(),
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.transaction_date);
        return date >= monthStart && date <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: format(month, 'MMM', { locale: id }),
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions]);

  // Quick date presets
  const setPreset = (preset: 'thisMonth' | 'lastMonth' | 'thisYear' | 'last3Months') => {
    const now = new Date();
    switch (preset) {
      case 'thisMonth':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'thisYear':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case 'last3Months':
        setDateRange({ from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) });
        break;
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    if (!dateRange?.from || !dateRange?.to) {
      alert('Silakan pilih rentang tanggal terlebih dahulu');
      return;
    }

    const exportData = {
      transactions: filteredTransactions,
      summary,
      dateRange: {
        from: dateRange.from,
        to: dateRange.to,
      },
      currency: userCurrency,
    };

    if (type === 'csv') {
      exportToExcel(exportData);
    } else {
      exportToPDF(exportData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Analisis lengkap transaksi Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Periode:</span>
            <Button variant="outline" size="sm" onClick={() => setPreset('thisMonth')}>Bulan Ini</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset('lastMonth')}>Bulan Lalu</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset('last3Months')}>3 Bulan</Button>
            <Button variant="outline" size="sm" onClick={() => setPreset('thisYear')}>Tahun Ini</Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd MMM', { locale: id })} -{' '}
                        {format(dateRange.to, 'dd MMM yyyy', { locale: id })}
                      </>
                    ) : (
                      format(dateRange.from, 'dd MMM yyyy', { locale: id })
                    )
                  ) : (
                    'Pilih tanggal'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arus Kas Bersih</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600')}>
              {summary.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summary.netCashFlow)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rasio Tabungan</CardTitle>
            <PieChart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', summary.savingsRate >= 20 ? 'text-green-600' : 'text-yellow-600')}>
              {summary.savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">Tren Bulanan</TabsTrigger>
          <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
          <TabsTrigger value="income">Pemasukan</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Tren Keuangan 12 Bulan Terakhir</CardTitle>
              <CardDescription>Perbandingan pemasukan dan pengeluaran</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Pengeluaran</CardTitle>
                <CardDescription>Berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent>
                {expenseByCategory.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={expenseByCategory.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        >
                          {expenseByCategory.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Tidak ada data pengeluaran
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseByCategory.slice(0, 10).map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(cat.value)}</p>
                        <p className="text-xs text-muted-foreground">
                          {getPercentage(cat.value, summary.expense)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sumber Pemasukan</CardTitle>
                <CardDescription>Berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent>
                {incomeByCategory.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={incomeByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        >
                          {incomeByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Tidak ada data pemasukan
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomeByCategory.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(cat.value)}</p>
                        <p className="text-xs text-muted-foreground">
                          {getPercentage(cat.value, summary.income)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
