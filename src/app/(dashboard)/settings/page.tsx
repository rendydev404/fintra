'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { resetDataAction } from '@/actions/settings';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';
import {
  User,
  Moon,
  Sun,
  Monitor,
  Loader2,
  Camera,
  Shield,
  Bell,
  Palette,
  AlertTriangle,
  Mail,
  CreditCard,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { getExchangeRate } from '@/lib/currency';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, theme, setTheme, clearData } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Reset Data State
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [shouldDeleteAllData, setShouldDeleteAllData] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    currency: user?.currency || 'IDR',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailBudgetAlerts: true,
    emailWeeklyReport: false,
    emailGoalReminders: true,
    pushSubscriptionReminders: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Currency conversion state
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Load notification settings on mount
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const res = await fetch('/api/notifications/settings');
        if (res.ok) {
          const data = await res.json();
          setNotificationSettings({
            emailBudgetAlerts: data.email_budget_alerts ?? true,
            emailWeeklyReport: data.email_weekly_report ?? false,
            emailGoalReminders: data.email_goal_reminders ?? true,
            pushSubscriptionReminders: data.push_subscription_reminders ?? true,
          });
        }
      } catch (error) {
        console.log('Could not load notification settings:', error);
      }
    };
    loadNotificationSettings();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    // Check if currency changed
    if (formData.currency !== user.currency) {
      // Fetch exchange rate and show confirmation dialog
      try {
        setIsLoading(true);
        const rate = await getExchangeRate(user.currency, formData.currency);
        setExchangeRate(rate);
        setPendingCurrency(formData.currency);
        setIsCurrencyDialogOpen(true);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengambil kurs mata uang. Coba lagi.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Save profile without currency conversion
    await saveProfileOnly();
  };

  const saveProfileOnly = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          currency: formData.currency,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUser(data);
      toast.success('Profil berhasil diperbarui!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memperbarui profil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCurrencyConversion = async () => {
    if (!user || !pendingCurrency || !exchangeRate) return;
    
    setIsConvertingCurrency(true);
    const supabase = createClient();

    try {
      // Convert account balances
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('user_id', user.id);

      if (accounts && accounts.length > 0) {
        for (const account of accounts) {
          const newBalance = Math.round(account.balance * exchangeRate * 100) / 100;
          await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', account.id);
        }
      }

      // Convert transaction amounts
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount')
        .eq('user_id', user.id);

      if (transactions && transactions.length > 0) {
        for (const tx of transactions) {
          const newAmount = Math.round(tx.amount * exchangeRate * 100) / 100;
          await supabase
            .from('transactions')
            .update({ amount: newAmount })
            .eq('id', tx.id);
        }
      }

      // Convert budget amounts and spent
      const { data: budgets } = await supabase
        .from('budgets')
        .select('id, amount, spent')
        .eq('user_id', user.id);

      if (budgets && budgets.length > 0) {
        for (const budget of budgets) {
          const newAmount = Math.round(budget.amount * exchangeRate * 100) / 100;
          const newSpent = Math.round(budget.spent * exchangeRate * 100) / 100;
          await supabase
            .from('budgets')
            .update({ amount: newAmount, spent: newSpent })
            .eq('id', budget.id);
        }
      }

      // Convert goal amounts
      const { data: goals } = await supabase
        .from('goals')
        .select('id, target_amount, current_amount')
        .eq('user_id', user.id);

      if (goals && goals.length > 0) {
        for (const goal of goals) {
          const newTarget = Math.round(goal.target_amount * exchangeRate * 100) / 100;
          const newCurrent = Math.round(goal.current_amount * exchangeRate * 100) / 100;
          await supabase
            .from('goals')
            .update({ target_amount: newTarget, current_amount: newCurrent })
            .eq('id', goal.id);
        }
      }

      // Convert subscription amounts
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, amount')
        .eq('user_id', user.id);

      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          const newAmount = Math.round(sub.amount * exchangeRate * 100) / 100;
          await supabase
            .from('subscriptions')
            .update({ amount: newAmount })
            .eq('id', sub.id);
        }
      }

      // Update profile with new currency
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          currency: pendingCurrency,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      setUser(updatedProfile);
      toast.success(`Mata uang berhasil diubah ke ${pendingCurrency}! Semua nilai telah dikonversi.`);
      
      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengkonversi mata uang. Coba lagi.');
    } finally {
      setIsConvertingCurrency(false);
      setIsCurrencyDialogOpen(false);
      setPendingCurrency(null);
      setExchangeRate(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB.');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const supabase = createClient();
      
      // Delete old avatar if exists
      if (user.avatar_url) {
        try {
          // Extract file path from URL (format: .../storage/v1/object/public/avatars/avatars/filename)
          const urlParts = user.avatar_url.split('/');
          const bucketIndex = urlParts.indexOf('profile_foto');
          if (bucketIndex !== -1) {
            const oldFilePath = urlParts.slice(bucketIndex + 1).join('/');
            if (oldFilePath) {
              await supabase.storage.from('profile_foto').remove([oldFilePath]);
            }
          }
        } catch (deleteError) {
          console.log('No old avatar to delete or error:', deleteError);
        }
      }
      
      // Upload new avatar with user ID as consistent filename (one file per user)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('profile_foto')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          toast.error('Storage "profile_foto" belum dibuat di Supabase. Buat bucket "profile_foto" dengan public access.');
          return;
        }
        throw uploadError;
      }

      // Get public URL with cache-busting timestamp
      const { data: urlData } = supabase.storage
        .from('profile_foto')
        .getPublicUrl(filePath);
      
      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state to immediately show new avatar
      setUser({ ...data, avatar_url: newAvatarUrl });
      toast.success('Foto profil berhasil diperbarui!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengupload foto. Pastikan bucket "profile_foto" sudah dibuat.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    toast.success('Tema berhasil diubah!');
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru tidak cocok.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success('Password berhasil diubah!');
      setIsPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Gagal mengubah password.';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_budget_alerts: notificationSettings.emailBudgetAlerts,
          email_weekly_report: notificationSettings.emailWeeklyReport,
          email_goal_reminders: notificationSettings.emailGoalReminders,
          push_subscription_reminders: notificationSettings.pushSubscriptionReminders,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success('Pengaturan notifikasi berhasil disimpan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan pengaturan notifikasi.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const result = await resetDataAction(shouldDeleteAllData);
      if (result.success) {
        toast.success('Data berhasil di-reset!');
        setIsResetDialogOpen(false);
        // Reload to reflect changes
        window.location.reload();
      } else {
        toast.error(`Gagal: ${result.error}`);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'HAPUS AKUN SAYA') {
      toast.error('Teks konfirmasi tidak cocok.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      // Call server-side API to properly delete user from Auth and all data
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      // Clear local data and sign out
      const supabase = createClient();
      await supabase.auth.signOut();
      clearData();
      
      toast.success('Akun berhasil dihapus secara permanen.');
      router.push('/login');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus akun. Hubungi support.');
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola preferensi akun Anda</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
          <CardDescription>Informasi akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar_url || ''} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {getInitials(user?.full_name || null)}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Ganti Foto
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Maksimal 2MB. Format: JPG, PNG, GIF
              </p>
            </div>
          </div>

          <Separator />

          {/* Form */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nama lengkap Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Mata Uang</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tampilan
          </CardTitle>
          <CardDescription>Sesuaikan tampilan aplikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Tema</Label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => handleThemeChange('light')}
              >
                <Sun className="h-6 w-6" />
                <span>Terang</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => handleThemeChange('dark')}
              >
                <Moon className="h-6 w-6" />
                <span>Gelap</span>
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                className="flex flex-col h-auto py-4 gap-2"
                onClick={() => handleThemeChange('system')}
              >
                <Monitor className="h-6 w-6" />
                <span>Sistem</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikasi
          </CardTitle>
          <CardDescription>Pengaturan notifikasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </h4>
            <div className="space-y-4 ml-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="budgetAlerts">Peringatan Anggaran</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifikasi saat pengeluaran melebihi anggaran
                  </p>
                </div>
                <Switch
                  id="budgetAlerts"
                  checked={notificationSettings.emailBudgetAlerts}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, emailBudgetAlerts: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReport">Laporan Mingguan</Label>
                  <p className="text-xs text-muted-foreground">
                    Ringkasan keuangan setiap minggu
                  </p>
                </div>
                <Switch
                  id="weeklyReport"
                  checked={notificationSettings.emailWeeklyReport}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, emailWeeklyReport: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="goalReminders" className="flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    Pengingat Target
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Pengingat progress target tabungan
                  </p>
                </div>
                <Switch
                  id="goalReminders"
                  checked={notificationSettings.emailGoalReminders}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, emailGoalReminders: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pengingat Langganan
            </h4>
            <div className="ml-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="subscriptionReminders">Tagihan Jatuh Tempo</Label>
                  <p className="text-xs text-muted-foreground">
                    Pengingat 3 hari sebelum tagihan jatuh tempo
                  </p>
                </div>
                <Switch
                  id="subscriptionReminders"
                  checked={notificationSettings.pushSubscriptionReminders}
                  onCheckedChange={(checked: boolean) =>
                    setNotificationSettings({ ...notificationSettings, pushSubscriptionReminders: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveNotifications} variant="outline">
            Simpan Pengaturan Notifikasi
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Keamanan
          </CardTitle>
          <CardDescription>Pengaturan keamanan akun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
            Ubah Password
          </Button>
          <p className="text-xs text-muted-foreground">
            Disarankan untuk mengubah password secara berkala untuk keamanan.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona Bahaya
          </CardTitle>
          <CardDescription>Tindakan ini tidak dapat dibatalkan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <h4 className="font-medium text-destructive">Reset Saldo & Data</h4>
              <p className="text-xs text-muted-foreground">
                Reset saldo akun ke 0 dan opsi hapus data
              </p>
            </div>
            <Button variant="destructive" onClick={() => setIsResetDialogOpen(true)}>
              Reset Data
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <h4 className="font-medium text-destructive">Hapus Akun</h4>
              <p className="text-xs text-muted-foreground">
                Hapus akun dan semua data secara permanen
              </p>
            </div>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              Hapus Akun
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Data Keuangan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mereset data keuangan Anda? Tindakan ini akan mengubah saldo semua akun menjadi 0.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-md border">
              <Checkbox 
                id="deleteAll" 
                checked={shouldDeleteAllData}
                onCheckedChange={(checked) => setShouldDeleteAllData(checked as boolean)}
              />
              <label
                htmlFor="deleteAll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Hapus juga semua riwayat transaksi, anggaran, target, dan langganan
              </label>
            </div>
            
            {shouldDeleteAllData && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" />
                <span>Peringatan: Semua data yang dihapus tidak dapat dikembalikan!</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetData}
              disabled={isResetting}
            >
              {isResetting ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Memproses...
                 </>
              ) : (
                'Reset Sekarang'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>
              Masukkan password baru Anda. Minimal 6 karakter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Ubah Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Currency Conversion Dialog */}
      <AlertDialog open={isCurrencyDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCurrencyDialogOpen(false);
          setPendingCurrency(null);
          setExchangeRate(null);
          // Reset form currency to original
          setFormData({ ...formData, currency: user?.currency || 'IDR' });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              💱 Konfirmasi Konversi Mata Uang
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Anda akan mengubah mata uang dari <strong>{user?.currency}</strong> ke <strong>{pendingCurrency}</strong>.
              </p>
              {exchangeRate && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Kurs saat ini:</strong> 1 {user?.currency} = {exchangeRate.toFixed(4)} {pendingCurrency}
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Semua nilai keuangan akan dikonversi menggunakan kurs real-time:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Saldo rekening</li>
                <li>Jumlah transaksi</li>
                <li>Anggaran (budget)</li>
                <li>Target tabungan</li>
                <li>Biaya langganan</li>
              </ul>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Tindakan ini akan mengubah data secara permanen di database.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCurrencyConversion}
              disabled={isConvertingCurrency}
            >
              {isConvertingCurrency ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengkonversi...
                </>
              ) : (
                'Ya, Konversi Sekarang'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Hapus Akun Permanen
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Semua data Anda akan dihapus secara permanen termasuk:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Semua transaksi</li>
                <li>Semua akun/rekening</li>
                <li>Semua anggaran dan target</li>
                <li>Semua langganan</li>
                <li>Profil dan pengaturan</li>
              </ul>
              <div className="pt-4">
                <Label htmlFor="deleteConfirm">
                  Ketik <strong className="text-destructive">HAPUS AKUN SAYA</strong> untuk konfirmasi:
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="HAPUS AKUN SAYA"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmText !== 'HAPUS AKUN SAYA'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus Akun Saya'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
