'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { formatDate, getPercentage, cn } from '@/lib/utils';
import { useFormatCurrency, useCurrencySymbol } from '@/hooks/use-format-currency';
import { ACCOUNT_COLORS } from '@/lib/constants';
import {
  Plus,
  Target,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  CalendarIcon,
  Trophy,
  Pause,
  Play,
  CheckCircle,
  PiggyBank,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Goal, GoalStatus } from '@/types';

export default function GoalsPage() {
  const { goals, user, addGoal, updateGoal, removeGoal } = useAppStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isContributing, setIsContributing] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const formatCurrency = useFormatCurrency();
  const currencySymbol = useCurrencySymbol();

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: undefined as Date | undefined,
    color: ACCOUNT_COLORS[0],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      deadline: undefined,
      color: ACCOUNT_COLORS[0],
    });
    setEditingGoal(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      color: goal.color,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const goalData = {
        user_id: user.id,
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        deadline: formData.deadline ? format(formData.deadline, 'yyyy-MM-dd') : null,
        color: formData.color,
        icon: 'target',
      };

      if (editingGoal) {
        const { data, error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id)
          .select()
          .single();

        if (error) throw error;
        updateGoal(editingGoal.id, data);
        toast.success('Target berhasil diperbarui!');
      } else {
        const { data, error } = await supabase
          .from('goals')
          .insert(goalData)
          .select()
          .single();

        if (error) throw error;
        addGoal(data);
        toast.success('Target berhasil ditambahkan!');
      }

      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (goal: Goal) => {
    if (!confirm('Hapus target ini?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('goals').delete().eq('id', goal.id);
      if (error) throw error;
      removeGoal(goal.id);
      toast.success('Target berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus target.');
    }
  };

  const handleStatusChange = async (goal: Goal, status: GoalStatus) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('goals')
        .update({ status })
        .eq('id', goal.id)
        .select()
        .single();

      if (error) throw error;
      updateGoal(goal.id, data);
      toast.success(`Target ${status === 'completed' ? 'selesai' : status === 'paused' ? 'dijeda' : 'dilanjutkan'}!`);
    } catch (error) {
      toast.error('Gagal mengubah status.');
    }
  };

  const handleContribute = async (goalId: string) => {
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) return;

    try {
      const supabase = createClient();
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAmount = goal.current_amount + amount;
      const newStatus: GoalStatus = newAmount >= goal.target_amount ? 'completed' : goal.status;

      const { data, error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount, status: newStatus })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      updateGoal(goalId, data);
      
      if (newStatus === 'completed') {
        toast.success('🎉 Selamat! Target Anda tercapai!');
      } else {
        toast.success(`Berhasil menambah ${formatCurrency(amount)}`);
      }
      
      setIsContributing(null);
      setContributionAmount('');
    } catch (error) {
      toast.error('Gagal menambah tabungan.');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
    return { activeGoals: activeGoals.length, completedGoals: completedGoals.length, totalTarget, totalSaved };
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Target Tabungan</h1>
          <p className="text-muted-foreground">Capai impian finansial Anda</p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Tambah Target</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Edit Target' : 'Tambah Target Baru'}</DialogTitle>
                <DialogDescription>Tentukan target tabungan Anda</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Target</Label>
                  <Input
                    placeholder="Contoh: Dana Darurat, Liburan, DP Rumah"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jumlah Target</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-10"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tabungan Awal (Opsional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-10"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Deadline (Opsional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start', !formData.deadline && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? format(formData.deadline, 'PPP', { locale: id }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => setFormData({ ...formData, deadline: date })}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Warna</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACCOUNT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-all',
                          formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : editingGoal ? 'Simpan' : 'Tambah'}
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Target Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeGoals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tercapai</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.completedGoals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalTarget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terkumpul</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalSaved)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      {goals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const percentage = getPercentage(goal.current_amount, goal.target_amount);
            const remaining = goal.target_amount - goal.current_amount;
            const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;

            return (
              <Card key={goal.id} className={cn('group relative overflow-hidden', goal.status === 'paused' && 'opacity-60')}>
                <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: goal.color }} />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
                      {goal.status === 'completed' ? (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Target className="h-5 w-5" style={{ color: goal.color }} />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{goal.name}</CardTitle>
                      {goal.deadline && (
                        <CardDescription>
                          {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} hari lagi` : 'Lewat deadline'}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {goal.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Tercapai</Badge>
                    )}
                    {goal.status === 'paused' && <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Dijeda</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {goal.status === 'active' && (
                          <>
                            <DropdownMenuItem onClick={() => setIsContributing(goal.id)}>
                              <PiggyBank className="mr-2 h-4 w-4" />Tambah Tabungan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(goal, 'paused')}>
                              <Pause className="mr-2 h-4 w-4" />Jeda
                            </DropdownMenuItem>
                          </>
                        )}
                        {goal.status === 'paused' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(goal, 'active')}>
                            <Play className="mr-2 h-4 w-4" />Lanjutkan
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(goal)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(goal)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isContributing === goal.id ? (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Jumlah"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleContribute(goal.id)}>Simpan</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsContributing(null)}>Batal</Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold">{percentage}%</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-3" style={{ '--progress-color': goal.color } as React.CSSProperties} />
                      </div>
                      {goal.status !== 'completed' && (
                        <p className="text-sm text-muted-foreground">Kurang {formatCurrency(remaining)}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Belum ada target</h3>
            <p className="text-muted-foreground mb-4">Mulai rencanakan target tabungan Anda</p>
            <Button onClick={() => setIsOpen(true)}><Plus className="mr-2 h-4 w-4" />Tambah Target</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
