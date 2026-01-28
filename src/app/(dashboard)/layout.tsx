'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/sonner';
import { GuidedTour } from '@/components/onboarding/guided-tour';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/lib/constants';
import type { User, Account, Category, Transaction, Budget, Goal, Subscription } from '@/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const { 
    setUser, 
    setAccounts, 
    setCategories, 
    setTransactions,
    setBudgets,
    setGoals,
    setSubscriptions,
    theme
  } = useAppStore();

  useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Get user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser(profile as User);
        }

        // Get accounts
        const { data: accounts } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (accounts) {
          setAccounts(accounts as Account[]);
        }

        // Get categories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categories && categories.length > 0) {
          setCategories(categories as Category[]);
        } else {
          // Seed default categories if none exist
          const defaultCategories = [
            ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({
              user_id: authUser.id,
              name: c.name,
              type: 'expense' as const,
              icon: c.icon,
              color: c.color,
            })),
            ...DEFAULT_INCOME_CATEGORIES.map(c => ({
              user_id: authUser.id,
              name: c.name,
              type: 'income' as const,
              icon: c.icon,
              color: c.color,
            })),
          ];

          const { data: newCategories } = await supabase
            .from('categories')
            .insert(defaultCategories)
            .select();

          if (newCategories) {
            setCategories(newCategories as Category[]);
          }
        }

        // Get transactions (last 100)
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*, account:accounts!transactions_account_id_fkey(*), to_account:accounts!transactions_to_account_id_fkey(*), category:categories(*)')
          .order('transaction_date', { ascending: false })
          .limit(100);

        if (transactions) {
          setTransactions(transactions as Transaction[]);
        }

        // Get budgets
        const { data: budgets } = await supabase
          .from('budgets')
          .select('*, category:categories(*)')
          .order('created_at', { ascending: false });

        if (budgets) {
          setBudgets(budgets as Budget[]);
        }

        // Get goals
        const { data: goals } = await supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: false });

        if (goals) {
          setGoals(goals as Goal[]);
        }

        // Get subscriptions
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('*, category:categories(*), account:accounts(*)')
          .order('next_billing_date');

        if (subscriptions) {
          setSubscriptions(subscriptions as Subscription[]);
        }

        // Check if user is new (no accounts) and hasn't completed onboarding
        const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
        if (!hasCompletedOnboarding && (!accounts || accounts.length === 0)) {
          setIsNewUser(true);
          setShowOnboarding(true);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [setUser, setAccounts, setCategories, setTransactions, setBudgets, setGoals, setSubscriptions]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingClose = () => {
    // Allow closing but don't mark as completed
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
      
      {/* Guided Tour for new users */}
      <GuidedTour
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
