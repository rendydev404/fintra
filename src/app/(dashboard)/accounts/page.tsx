'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useFormatCurrency } from '@/hooks/use-format-currency';
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/lib/constants';
import {
  Plus,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  Bitcoin,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Account, AccountType } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  wallet: Wallet,
  'building-2': Building2,
  smartphone: Smartphone,
  banknote: Banknote,
  bitcoin: Bitcoin,
  'trending-up': TrendingUp,
};


export default function AccountsPage() {
  const { accounts, user, addAccount, updateAccount, removeAccount } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showBalances, setShowBalances] = useState(true);
  const formatCurrency = useFormatCurrency();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as AccountType,
    balance: '',
    color: ACCOUNT_COLORS[0],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bank',
      balance: '',
      color: ACCOUNT_COLORS[0],
    });
    setEditingAccount(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      color: account.color,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const accountType = ACCOUNT_TYPES.find(t => t.value === formData.type);

      if (editingAccount) {
        // Update existing account
        const { data, error } = await supabase
          .from('accounts')
          .update({
            name: formData.name,
            type: formData.type,
            balance: parseFloat(formData.balance) || 0,
            color: formData.color,
            icon: accountType?.icon || 'wallet',
          })
          .eq('id', editingAccount.id)
          .select()
          .single();

        if (error) throw error;

        updateAccount(editingAccount.id, data);
        toast.success('Akun berhasil diperbarui!');
      } else {
        // Create new account
        const { data, error } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: formData.name,
            type: formData.type,
            balance: parseFloat(formData.balance) || 0,
            color: formData.color,
            icon: accountType?.icon || 'wallet',
          })
          .select()
          .single();

        if (error) throw error;

        addAccount(data);
        toast.success('Akun berhasil ditambahkan!');
      }

      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!confirm(`Hapus akun "${account.name}"? Semua transaksi terkait juga akan dihapus.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', account.id);

      if (error) throw error;

      removeAccount(account.id);
      toast.success('Akun berhasil dihapus!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus akun.');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Akun Saya</h1>
          <p className="text-muted-foreground">
            Kelola semua rekening dan dompet Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Akun
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAccount
                      ? 'Perbarui informasi akun Anda'
                      : 'Tambahkan rekening bank, e-wallet, atau dompet tunai baru'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Akun</Label>
                    <Input
                      id="name"
                      placeholder="Contoh: BCA, GoPay, Dompet"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Jenis Akun</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: AccountType) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => {
                          const Icon = iconMap[type.icon] || Wallet;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="balance">Saldo Awal</Label>
                    <Input
                      id="balance"
                      type="number"
                      placeholder="0"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Warna</Label>
                    <div className="flex flex-wrap gap-2">
                      {ACCOUNT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            formData.color === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : editingAccount ? (
                      'Simpan Perubahan'
                    ) : (
                      'Tambah Akun'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Saldo Semua Akun</p>
              <p className="text-3xl font-bold mt-1">
                {showBalances ? formatCurrency(totalBalance) : '••••••••'}
              </p>
            </div>
            <Wallet className="h-12 w-12 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const accountType = ACCOUNT_TYPES.find((t) => t.value === account.type);
            const Icon = iconMap[account.icon] || Wallet;

            return (
              <Card key={account.id} className="group relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-1 w-full"
                  style={{ backgroundColor: account.color }}
                />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <CardDescription>{accountType?.label}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(account)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(account)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {showBalances ? formatCurrency(account.balance) : '••••••••'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Belum ada akun</h3>
            <p className="text-muted-foreground mb-4">
              Tambahkan rekening bank, e-wallet, atau dompet tunai Anda
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Akun Pertama
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
