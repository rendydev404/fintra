'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getPercentage, cn } from '@/lib/utils';
import { useFormatCurrency } from '@/hooks/use-format-currency';
import { HEALTH_GRADES } from '@/lib/constants';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RefreshCw,
  Brain,
  PiggyBank,
  Target,
  Shield,
} from 'lucide-react';
import { PredictiveChart } from "@/components/ai-insights/predictive-chart";
import type { AIInsight, FinancialHealthScore } from '@/types';

export default function AIInsightsPage() {
  const { transactions, budgets, goals, accounts } = useAppStore();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const formatCurrency = useFormatCurrency();

  // Calculate stats for AI
  const calculateStats = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    
    const budgetAdherence = budgets.length > 0
      ? budgets.reduce((sum, b) => sum + Math.min(100, (b.spent / b.amount) * 100), 0) / budgets.length
      : 100;

    const avgMonthlyExpense = totalExpense || 1000000; // default 1jt if no expense
    const emergencyFundMonths = totalBalance / avgMonthlyExpense;

    // Category breakdown
    const categorySpending: Record<string, number> = {};
    monthlyTransactions
      .filter(t => t.type === 'expense' && t.category)
      .forEach(t => {
        const name = t.category?.name || 'Lainnya';
        categorySpending[name] = (categorySpending[name] || 0) + t.amount;
      });

    const categoryBreakdown = Object.entries(categorySpending)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      totalBalance,
      budgetAdherence,
      emergencyFundMonths,
      categoryBreakdown,
    };
  };

  const generateInsights = async () => {
    setIsLoadingInsights(true);
    
    try {
      const stats = calculateStats();
      
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalIncome: stats.totalIncome,
          totalExpense: stats.totalExpense,
          categoryBreakdown: stats.categoryBreakdown,
          monthlyTrend: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      } else {
        // Fallback insights
        generateLocalInsights(stats);
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      const stats = calculateStats();
      generateLocalInsights(stats);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const generateLocalInsights = (stats: ReturnType<typeof calculateStats>) => {
    const localInsights: AIInsight[] = [];
    const savingsRate = stats.totalIncome > 0 
      ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100 
      : 0;

    // Savings insight
    if (savingsRate < 20) {
      localInsights.push({
        type: 'saving',
        title: 'Tingkatkan Rasio Tabungan',
        description: `Rasio tabungan Anda saat ini ${savingsRate.toFixed(1)}%. Idealnya 20% atau lebih dari pendapatan.`,
        severity: 'warning',
      });
    } else {
      localInsights.push({
        type: 'saving',
        title: 'Rasio Tabungan Bagus! 🎉',
        description: `Anda berhasil menabung ${savingsRate.toFixed(1)}% dari pendapatan bulan ini. Pertahankan!`,
        severity: 'success',
      });
    }

    // Top spending category
    if (stats.categoryBreakdown.length > 0) {
      const topCategory = stats.categoryBreakdown[0];
      const percentage = stats.totalExpense > 0 
        ? (topCategory.amount / stats.totalExpense) * 100 
        : 0;

      localInsights.push({
        type: 'spending',
        title: `Pengeluaran Terbesar: ${topCategory.name}`,
        description: `${formatCurrency(topCategory.amount)} (${percentage.toFixed(1)}% dari total pengeluaran)`,
        severity: percentage > 40 ? 'warning' : 'info',
      });
    }

    // Emergency fund
    if (stats.emergencyFundMonths < 3) {
      localInsights.push({
        type: 'recommendation',
        title: 'Bangun Dana Darurat',
        description: `Dana darurat Anda hanya cukup untuk ${stats.emergencyFundMonths.toFixed(1)} bulan. Target ideal: 3-6 bulan pengeluaran.`,
        severity: 'warning',
      });
    } else if (stats.emergencyFundMonths >= 6) {
      localInsights.push({
        type: 'recommendation',
        title: 'Dana Darurat Aman ✅',
        description: `Anda memiliki dana darurat untuk ${stats.emergencyFundMonths.toFixed(1)} bulan. Pertimbangkan untuk investasi.`,
        severity: 'success',
      });
    }

    // Budget adherence
    if (stats.budgetAdherence < 80 && budgets.length > 0) {
      localInsights.push({
        type: 'budget',
        title: 'Perhatikan Anggaran',
        description: 'Beberapa kategori melebihi anggaran yang ditetapkan.',
        severity: 'warning',
      });
    }

    setInsights(localInsights);
  };

  const calculateHealthScore = async () => {
    setIsLoadingHealth(true);
    
    try {
      const stats = calculateStats();
      
      const response = await fetch('/api/ai/health-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalIncome: stats.totalIncome,
          totalExpense: stats.totalExpense,
          totalSavings: stats.totalBalance,
          budgetAdherence: stats.budgetAdherence,
          emergencyFundMonths: stats.emergencyFundMonths,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHealthScore(data);
      } else {
        // Fallback calculation
        calculateLocalHealthScore(stats);
      }
    } catch (error) {
      console.error('Failed to calculate health score:', error);
      const stats = calculateStats();
      calculateLocalHealthScore(stats);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const calculateLocalHealthScore = (stats: ReturnType<typeof calculateStats>) => {
    const savingsRate = stats.totalIncome > 0 
      ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100 
      : 0;

    const expenseRatio = stats.totalIncome > 0 
      ? (stats.totalExpense / stats.totalIncome) * 100 
      : 0;

    const breakdown = {
      savingsRate: Math.min(100, savingsRate * 5),
      debtRatio: 80, // placeholder
      budgetAdherence: stats.budgetAdherence,
      emergencyFund: Math.min(100, (stats.emergencyFundMonths / 6) * 100),
    };

    const score = Math.round(
      (breakdown.savingsRate * 0.3) +
      (breakdown.budgetAdherence * 0.25) +
      (breakdown.emergencyFund * 0.25) +
      (Math.max(0, 100 - expenseRatio) * 0.2)
    );

    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

    const recommendations: string[] = [];
    if (savingsRate < 20) recommendations.push('Tingkatkan rasio tabungan minimal 20%');
    if (stats.emergencyFundMonths < 3) recommendations.push('Bangun dana darurat 3-6 bulan');
    if (stats.budgetAdherence < 80) recommendations.push('Perhatikan budget yang ditetapkan');

    setHealthScore({
      score,
      grade,
      breakdown,
      recommendations,
    });
  };

  useEffect(() => {
    generateInsights();
    calculateHealthScore();
  }, [transactions, budgets, accounts]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'spending': return TrendingDown;
      case 'saving': return PiggyBank;
      case 'budget': return Target;
      case 'anomaly': return AlertTriangle;
      case 'recommendation': return Lightbulb;
      default: return Sparkles;
    }
  };

  const getSeverityColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30';
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30';
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Analisis cerdas untuk keuangan Anda
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            generateInsights();
            calculateHealthScore();
          }}
          disabled={isLoadingInsights || isLoadingHealth}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', (isLoadingInsights || isLoadingHealth) && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Health Score */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            Skor Kesehatan Keuangan
          </CardTitle>
          <CardDescription>
            Penilaian keseluruhan kondisi keuangan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHealth ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          ) : healthScore ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={HEALTH_GRADES[healthScore.grade].color}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(healthScore.score / 100) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{healthScore.score}</span>
                    <span 
                      className="text-xl font-semibold"
                      style={{ color: HEALTH_GRADES[healthScore.grade].color }}
                    >
                      {healthScore.grade}
                    </span>
                  </div>
                </div>
                <p className="mt-4 font-medium" style={{ color: HEALTH_GRADES[healthScore.grade].color }}>
                  {HEALTH_GRADES[healthScore.grade].label}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <PiggyBank className="h-4 w-4" />Rasio Tabungan
                    </span>
                    <span>{Math.round(healthScore.breakdown.savingsRate)}%</span>
                  </div>
                  <Progress value={healthScore.breakdown.savingsRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />Kepatuhan Budget
                    </span>
                    <span>{Math.round(healthScore.breakdown.budgetAdherence)}%</span>
                  </div>
                  <Progress value={healthScore.breakdown.budgetAdherence} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />Dana Darurat
                    </span>
                    <span>{Math.round(healthScore.breakdown.emergencyFund)}%</span>
                  </div>
                  <Progress value={healthScore.breakdown.emergencyFund} className="h-2" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada data untuk dianalisis</p>
            </div>
          )}

          {/* Recommendations */}
          {healthScore && healthScore.recommendations.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Rekomendasi
              </h4>
              <ul className="space-y-2">
                {healthScore.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <PredictiveChart />

      {/* Insights */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Insight & Analisis</h2>
        {isLoadingInsights ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : insights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn('p-2 rounded-lg', getSeverityColor(insight.severity))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Belum ada insight</h3>
              <p className="text-muted-foreground">
                Tambahkan lebih banyak transaksi untuk mendapatkan analisis
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
