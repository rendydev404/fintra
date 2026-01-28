'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore, useExpenseCategories, useIncomeCategories } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { formatDate, cn } from '@/lib/utils';
import { useFormatCurrency, useCurrencySymbol } from '@/hooks/use-format-currency';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  CalendarIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Check,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Transaction, TransactionType } from '@/types';

export default function TransactionsPage() {
  const { transactions, accounts, categories, user, addTransaction, updateTransaction, removeTransaction, updateAccount } = useAppStore();
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Filters - initialize from URL params
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const formatCurrency = useFormatCurrency();
  const currencySymbol = useCurrencySymbol();

  // Read search query from URL on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    account_id: '',
    to_account_id: '',
    category_id: '',
    description: '',
    transaction_date: new Date(),
  });

  const [openCategorySelect, setOpenCategorySelect] = useState(false);

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      account_id: accounts[0]?.id || '',
      to_account_id: '',
      category_id: '',
      description: '',
      transaction_date: new Date(),
    });
    setEditingTransaction(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    } else if (!editingTransaction && accounts.length > 0) {
      setFormData(prev => ({ ...prev, account_id: accounts[0].id }));
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      account_id: transaction.account_id,
      to_account_id: transaction.to_account_id || '',
      category_id: transaction.category_id || '',
      description: transaction.description || '',
      transaction_date: new Date(transaction.transaction_date),
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const transactionData = {
        user_id: user.id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        account_id: formData.account_id,
        to_account_id: formData.type === 'transfer' ? formData.to_account_id : null,
        category_id: formData.type !== 'transfer' ? formData.category_id || null : null,
        description: formData.description || null,
        transaction_date: format(formData.transaction_date, 'yyyy-MM-dd'),
      };

      const newAmount = parseFloat(formData.amount);

      if (editingTransaction) {
        const { data, error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id)
          .select('*, account:accounts!transactions_account_id_fkey(*), to_account:accounts!transactions_to_account_id_fkey(*), category:categories(*)')
          .single();

        if (error) throw error;

        // Reverse old transaction's effect on balances
        const oldAccount = accounts.find(a => a.id === editingTransaction.account_id);
        if (oldAccount) {
          let oldBalanceChange = 0;
          if (editingTransaction.type === 'income') {
            oldBalanceChange = -editingTransaction.amount; // Reverse: subtract income
          } else if (editingTransaction.type === 'expense') {
            oldBalanceChange = editingTransaction.amount; // Reverse: add back expense
          } else if (editingTransaction.type === 'transfer') {
            oldBalanceChange = editingTransaction.amount; // Reverse: add back to source
          }
          updateAccount(editingTransaction.account_id, { balance: oldAccount.balance + oldBalanceChange });
        }

        // Reverse old transfer destination effect
        if (editingTransaction.type === 'transfer' && editingTransaction.to_account_id) {
          const oldToAccount = accounts.find(a => a.id === editingTransaction.to_account_id);
          if (oldToAccount) {
            updateAccount(editingTransaction.to_account_id, { balance: oldToAccount.balance - editingTransaction.amount });
          }
        }

        // Apply new transaction's effect on balances
        const sourceAccount = accounts.find(a => a.id === formData.account_id);
        if (sourceAccount) {
          // Need to get the current balance after reversing old transaction
          const currentSourceBalance = sourceAccount.id === editingTransaction.account_id 
            ? sourceAccount.balance + (editingTransaction.type === 'income' ? -editingTransaction.amount : editingTransaction.type === 'expense' ? editingTransaction.amount : editingTransaction.amount)
            : sourceAccount.balance;
            
          let newBalanceChange = 0;
          if (formData.type === 'income') {
            newBalanceChange = newAmount;
          } else if (formData.type === 'expense') {
            newBalanceChange = -newAmount;
          } else if (formData.type === 'transfer') {
            newBalanceChange = -newAmount;
          }
          updateAccount(formData.account_id, { balance: currentSourceBalance + newBalanceChange });
        }

        // Apply new transfer destination effect
        if (formData.type === 'transfer' && formData.to_account_id) {
          const toAccount = accounts.find(a => a.id === formData.to_account_id);
          if (toAccount) {
            // Get current balance considering if this was the old destination
            const currentToBalance = toAccount.id === editingTransaction.to_account_id
              ? toAccount.balance - editingTransaction.amount
              : toAccount.balance;
            updateAccount(formData.to_account_id, { balance: currentToBalance + newAmount });
          }
        }

        updateTransaction(editingTransaction.id, data);
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        const { data, error } = await supabase
          .from('transactions')
          .insert(transactionData)
          .select('*, account:accounts!transactions_account_id_fkey(*), to_account:accounts!transactions_to_account_id_fkey(*), category:categories(*)')
          .single();

        if (error) throw error;

        // Update account balance based on transaction type
        const sourceAccount = accounts.find(a => a.id === formData.account_id);
        if (sourceAccount) {
          let balanceChange = 0;
          if (formData.type === 'income') {
            balanceChange = newAmount;
          } else if (formData.type === 'expense') {
            balanceChange = -newAmount;
          } else if (formData.type === 'transfer') {
            balanceChange = -newAmount;
          }
          updateAccount(formData.account_id, { balance: sourceAccount.balance + balanceChange });
        }

        // For transfers, also update the destination account
        if (formData.type === 'transfer' && formData.to_account_id) {
          const toAccount = accounts.find(a => a.id === formData.to_account_id);
          if (toAccount) {
            updateAccount(formData.to_account_id, { balance: toAccount.balance + newAmount });
          }
        }

        addTransaction(data);
        toast.success('Transaksi berhasil ditambahkan!');
      }

      handleOpenChange(false);
    } catch (error: unknown) {
      console.error('Transaction error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Terjadi kesalahan. Pastikan tabel database sudah dibuat.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm('Hapus transaksi ini?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      // Reverse the transaction's effect on account balance
      const sourceAccount = accounts.find(a => a.id === transaction.account_id);
      if (sourceAccount) {
        let balanceChange = 0;
        if (transaction.type === 'income') {
          balanceChange = -transaction.amount; // Remove income: subtract
        } else if (transaction.type === 'expense') {
          balanceChange = transaction.amount; // Remove expense: add back
        } else if (transaction.type === 'transfer') {
          balanceChange = transaction.amount; // Remove transfer: add back to source
        }
        updateAccount(transaction.account_id, { balance: sourceAccount.balance + balanceChange });
      }

      // For transfers, also reverse the destination account effect
      if (transaction.type === 'transfer' && transaction.to_account_id) {
        const toAccount = accounts.find(a => a.id === transaction.to_account_id);
        if (toAccount) {
          updateAccount(transaction.to_account_id, { balance: toAccount.balance - transaction.amount });
        }
      }

      removeTransaction(transaction.id);
      toast.success('Transaksi berhasil dihapus!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus transaksi.');
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (filterType !== 'all' && t.type !== filterType) return false;
      
      // Account filter
      if (filterAccount !== 'all' && t.account_id !== filterAccount) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchDescription = t.description?.toLowerCase().includes(query);
        const matchCategory = t.category?.name?.toLowerCase().includes(query);
        const matchAccount = t.account?.name?.toLowerCase().includes(query);
        if (!matchDescription && !matchCategory && !matchAccount) return false;
      }
      
      return true;
    });
  }, [transactions, filterType, filterAccount, searchQuery]);

  // Available categories based on transaction type
  const availableCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
          <p className="text-muted-foreground">
            Lihat dan kelola semua transaksi Anda
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
                </DialogTitle>
                <DialogDescription>
                  Catat pemasukan, pengeluaran, atau transfer
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Transaction Type Tabs */}
                <Tabs
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as TransactionType, category_id: '' })
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expense" className="gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Pengeluaran
                    </TabsTrigger>
                    <TabsTrigger value="income" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Pemasukan
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className="gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      Transfer
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {currencySymbol}
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      className="pl-10 text-lg font-semibold"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Account */}
                <div className="space-y-2">
                  <Label>
                    {formData.type === 'transfer' ? 'Dari Akun' : 'Akun'}
                  </Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih akun" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: account.color }}
                            />
                            {account.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* To Account (for transfers) */}
                {formData.type === 'transfer' && (
                  <div className="space-y-2">
                    <Label>Ke Akun</Label>
                    <Select
                      value={formData.to_account_id}
                      onValueChange={(value) => setFormData({ ...formData, to_account_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih akun tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts
                          .filter((a) => a.id !== formData.account_id)
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: account.color }}
                                />
                                {account.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Category (for income/expense) */}
                {formData.type !== 'transfer' && (
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Popover open={openCategorySelect} onOpenChange={setOpenCategorySelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCategorySelect}
                          className="w-full justify-between"
                        >
                          {formData.category_id
                            ? availableCategories.find((c) => c.id === formData.category_id)?.name
                            : 'Pilih kategori...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Cari kategori..." />
                          <CommandList>
                            <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {availableCategories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() => {
                                    setFormData({ ...formData, category_id: category.id });
                                    setOpenCategorySelect(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      formData.category_id === category.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  <div
                                    className="mr-2 h-3 w-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.transaction_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.transaction_date ? (
                          format(formData.transaction_date, 'PPP', { locale: id })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.transaction_date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, transaction_date: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Input
                    id="description"
                    placeholder="Contoh: Makan siang, Gaji bulan Januari"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading || !formData.account_id}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : editingTransaction ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Transaksi'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as TransactionType | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            {/* Account Filter */}
            <Select
              value={filterAccount}
              onValueChange={(value) => setFilterAccount(value)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Semua Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Akun</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-2">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-2.5 rounded-full',
                        transaction.type === 'income' && 'bg-green-100 dark:bg-green-900/30',
                        transaction.type === 'expense' && 'bg-red-100 dark:bg-red-900/30',
                        transaction.type === 'transfer' && 'bg-blue-100 dark:bg-blue-900/30'
                      )}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : transaction.type === 'expense' ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.description || transaction.category?.name || 'Transaksi'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{transaction.account?.name}</span>
                        {transaction.type === 'transfer' && transaction.to_account && (
                          <>
                            <span>→</span>
                            <span>{transaction.to_account.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(transaction.transaction_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-semibold',
                          transaction.type === 'income' && 'text-green-600',
                          transaction.type === 'expense' && 'text-red-600',
                          transaction.type === 'transfer' && 'text-blue-600'
                        )}
                      >
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.category && (
                        <Badge variant="secondary" className="mt-1">
                          {transaction.category.name}
                        </Badge>
                      )}
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
                        <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(transaction)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filterType !== 'all' || filterAccount !== 'all'
                ? 'Tidak ada transaksi yang cocok'
                : 'Belum ada transaksi'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all' || filterAccount !== 'all'
                ? 'Coba ubah filter pencarian'
                : 'Mulai catat transaksi keuangan Anda'}
            </p>
            {!searchQuery && filterType === 'all' && filterAccount === 'all' && (
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Transaksi Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
