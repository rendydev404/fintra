'use client';

import { useState, useMemo } from 'react';
import { useAppStore, useExpenseCategories } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPercentage, cn } from '@/lib/utils';
import { useFormatCurrency, useCurrencySymbol } from '@/hooks/use-format-currency';
import {
  Plus,
  PieChart,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import type { Budget, BudgetPeriod } from '@/types';

const BUDGET_PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];

export default function BudgetsPage() {
  const { budgets, user, addBudget, updateBudget, removeBudget } = useAppStore();
  const expenseCategories = useExpenseCategories();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const formatCurrency = useFormatCurrency();
  const currencySymbol = useCurrencySymbol();

  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly' as BudgetPeriod,
  });

  const resetForm = () => {
    setFormData({
      category_id: '',
      amount: '',
      period: 'monthly',
    });
    setEditingBudget(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category_id: budget.category_id,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    setIsOpen(true);
  };

  const getDateRange = (period: BudgetPeriod) => {
    const now = new Date();
    switch (period) {
      case 'weekly':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'monthly':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'yearly':
        return { start: startOfYear(now), end: endOfYear(now) };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { start, end } = getDateRange(formData.period);

      const budgetData = {
        user_id: user.id,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
      };

      if (editingBudget) {
        const { data, error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingBudget.id)
          .select('*, category:categories(*)')
          .single();

        if (error) throw error;
        updateBudget(editingBudget.id, data);
        toast.success('Anggaran berhasil diperbarui!');
      } else {
        const { data, error } = await supabase
          .from('budgets')
          .insert(budgetData)
          .select('*, category:categories(*)')
          .single();

        if (error) throw error;
        addBudget(data);
        toast.success('Anggaran berhasil ditambahkan!');
      }

      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (budget: Budget) => {
    if (!confirm('Hapus anggaran ini?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('budgets').delete().eq('id', budget.id);
      if (error) throw error;
      removeBudget(budget.id);
      toast.success('Anggaran berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus anggaran.');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgets.filter(b => b.spent > b.amount).length;
    return { totalBudget, totalSpent, overBudgetCount };
  }, [budgets]);

  // Available categories (not already budgeted)
  const availableCategories = expenseCategories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id) || editingBudget?.category_id === c.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggaran</h1>
          <p className="text-muted-foreground">Atur batas pengeluaran per kategori</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Anggaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingBudget ? 'Edit Anggaran' : 'Tambah Anggaran Baru'}</DialogTitle>
                <DialogDescription>
                  Tentukan batas pengeluaran untuk kategori tertentu
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jumlah Anggaran</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-10"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Periode</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value: BudgetPeriod) => setFormData({ ...formData, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_PERIODS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || !formData.category_id}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> 
                    : editingBudget ? 'Simpan' : 'Tambah'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Anggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Terpakai</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {getPercentage(stats.totalSpent, stats.totalBudget)}% dari total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Melebihi Batas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', stats.overBudgetCount > 0 && 'text-red-600')}>
              {stats.overBudgetCount} kategori
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {budgets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = getPercentage(budget.spent, budget.amount);
            const isOver = percentage > 100;
            const isWarning = percentage > 80 && !isOver;
            const period = BUDGET_PERIODS.find(p => p.value === budget.period);

            return (
              <Card key={budget.id} className="group relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-1 w-full"
                  style={{ backgroundColor: budget.category?.color }}
                />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${budget.category?.color}20` }}
                    >
                      <PieChart className="h-4 w-4" style={{ color: budget.category?.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{budget.category?.name}</CardTitle>
                      <CardDescription>{period?.label}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(budget)}>
                        <Pencil className="mr-2 h-4 w-4" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(budget)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Terpakai</span>
                      <span className={cn(isOver && 'text-red-600', isWarning && 'text-yellow-600')}>
                        {percentage}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={cn(
                        'h-2',
                        isOver && '[&>div]:bg-red-600',
                        isWarning && '[&>div]:bg-yellow-500'
                      )}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                    {isOver && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Over
                      </Badge>
                    )}
                    {!isOver && percentage < 50 && (
                      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Baik
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sisa: {formatCurrency(Math.max(0, budget.amount - budget.spent))}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Belum ada anggaran</h3>
            <p className="text-muted-foreground mb-4">Buat anggaran untuk mengontrol pengeluaran Anda</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Tambah Anggaran
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
