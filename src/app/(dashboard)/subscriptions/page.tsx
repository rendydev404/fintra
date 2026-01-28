'use client';

import { useState, useMemo } from 'react';
import { useAppStore, useExpenseCategories } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
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
import { formatDate, cn } from '@/lib/utils';
import { useFormatCurrency, useCurrencySymbol } from '@/hooks/use-format-currency';
import { BILLING_CYCLES } from '@/lib/constants';
import {
  Plus,
  Repeat,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  CalendarIcon,
  Pause,
  Play,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, differenceInDays, isPast } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Subscription, BillingCycle } from '@/types';

export default function SubscriptionsPage() {
  const { subscriptions, accounts, user, addSubscription, updateSubscription, removeSubscription } = useAppStore();
  const expenseCategories = useExpenseCategories();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const formatCurrency = useFormatCurrency();
  const currencySymbol = useCurrencySymbol();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billing_cycle: 'monthly' as BillingCycle,
    next_billing_date: new Date(),
    category_id: '',
    account_id: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      billing_cycle: 'monthly',
      next_billing_date: new Date(),
      category_id: '',
      account_id: accounts[0]?.id || '',
      notes: '',
    });
    setEditingSub(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
    else if (!editingSub && accounts.length > 0) {
      setFormData(prev => ({ ...prev, account_id: accounts[0].id }));
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      billing_cycle: sub.billing_cycle,
      next_billing_date: new Date(sub.next_billing_date),
      category_id: sub.category_id || '',
      account_id: sub.account_id || '',
      notes: sub.notes || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const subData = {
        user_id: user.id,
        name: formData.name,
        amount: parseFloat(formData.amount),
        billing_cycle: formData.billing_cycle,
        next_billing_date: format(formData.next_billing_date, 'yyyy-MM-dd'),
        category_id: formData.category_id || null,
        account_id: formData.account_id || null,
        notes: formData.notes || null,
      };

      if (editingSub) {
        const { data, error } = await supabase
          .from('subscriptions')
          .update(subData)
          .eq('id', editingSub.id)
          .select('*, category:categories(*), account:accounts(*)')
          .single();

        if (error) throw error;
        updateSubscription(editingSub.id, data);
        toast.success('Langganan berhasil diperbarui!');
      } else {
        const { data, error } = await supabase
          .from('subscriptions')
          .insert(subData)
          .select('*, category:categories(*), account:accounts(*)')
          .single();

        if (error) throw error;
        addSubscription(data);
        toast.success('Langganan berhasil ditambahkan!');
      }

      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sub: Subscription) => {
    if (!confirm('Hapus langganan ini?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('subscriptions').delete().eq('id', sub.id);
      if (error) throw error;
      removeSubscription(sub.id);
      toast.success('Langganan berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus langganan.');
    }
  };

  const handleToggleActive = async (sub: Subscription) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ is_active: !sub.is_active })
        .eq('id', sub.id)
        .select('*, category:categories(*), account:accounts(*)')
        .single();

      if (error) throw error;
      updateSubscription(sub.id, data);
      toast.success(data.is_active ? 'Langganan diaktifkan' : 'Langganan dijeda');
    } catch (error) {
      toast.error('Gagal mengubah status.');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const active = subscriptions.filter(s => s.is_active);
    const monthlyTotal = active.reduce((sum, s) => {
      switch (s.billing_cycle) {
        case 'weekly': return sum + (s.amount * 4);
        case 'monthly': return sum + s.amount;
        case 'quarterly': return sum + (s.amount / 3);
        case 'yearly': return sum + (s.amount / 12);
        default: return sum;
      }
    }, 0);
    const yearlyTotal = monthlyTotal * 12;
    const upcoming = active.filter(s => {
      const days = differenceInDays(new Date(s.next_billing_date), new Date());
      return days >= 0 && days <= 7;
    });
    return { activeCount: active.length, monthlyTotal, yearlyTotal, upcomingCount: upcoming.length };
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Langganan</h1>
          <p className="text-muted-foreground">Kelola tagihan dan langganan bulanan Anda</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Tambah Langganan</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingSub ? 'Edit Langganan' : 'Tambah Langganan Baru'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama</Label>
                  <Input
                    placeholder="Contoh: Netflix, Spotify, Gym"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jumlah</Label>
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
                    <Label>Siklus</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value: BillingCycle) => setFormData({ ...formData, billing_cycle: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BILLING_CYCLES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tagihan Berikutnya</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.next_billing_date, 'PPP', { locale: id })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.next_billing_date}
                        onSelect={(date) => date && setFormData({ ...formData, next_billing_date: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Kategori (Opsional)</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Akun Pembayaran (Opsional)</Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catatan (Opsional)</Label>
                  <Input
                    placeholder="Catatan tambahan"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : editingSub ? 'Simpan' : 'Tambah'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Langganan Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Per Tahun</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.yearlyTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jatuh Tempo Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', stats.upcomingCount > 0 && 'text-yellow-600')}>
              {stats.upcomingCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const billingCycle = BILLING_CYCLES.find(c => c.value === sub.billing_cycle);
            const daysUntil = differenceInDays(new Date(sub.next_billing_date), new Date());
            const isOverdue = isPast(new Date(sub.next_billing_date));

            return (
              <Card key={sub.id} className={cn('group', !sub.is_active && 'opacity-60')}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Repeat className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{sub.name}</CardTitle>
                      <CardDescription>{billingCycle?.label}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleActive(sub)}>
                        {sub.is_active ? <><Pause className="mr-2 h-4 w-4" />Jeda</> : <><Play className="mr-2 h-4 w-4" />Aktifkan</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(sub)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(sub)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">{formatCurrency(sub.amount)}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tagihan berikutnya</span>
                    <div className="flex items-center gap-2">
                      {isOverdue && sub.is_active && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />Terlambat
                        </Badge>
                      )}
                      {!isOverdue && daysUntil <= 3 && sub.is_active && (
                        <Badge className="bg-yellow-100 text-yellow-700">Segera</Badge>
                      )}
                      <span>{formatDate(sub.next_billing_date)}</span>
                    </div>
                  </div>
                  {sub.account && (
                    <p className="text-xs text-muted-foreground">
                      Dari: {sub.account.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Belum ada langganan</h3>
            <p className="text-muted-foreground mb-4">Catat langganan dan tagihan rutin Anda</p>
            <Button onClick={() => setIsOpen(true)}><Plus className="mr-2 h-4 w-4" />Tambah Langganan</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
