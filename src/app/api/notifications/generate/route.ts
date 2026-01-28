import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

// Currency symbol mapping
const currencySymbols: Record<string, string> = {
  'IDR': 'Rp',
  'USD': '$',
  'EUR': '€',
  'SGD': 'S$',
  'MYR': 'RM',
};

const currencyLocales: Record<string, string> = {
  'IDR': 'id-ID',
  'USD': 'en-US',
  'EUR': 'de-DE',
  'SGD': 'en-SG',
  'MYR': 'ms-MY',
};

// Create notifications based on user data (budget alerts, subscription reminders, etc.)
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's currency preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('currency')
      .eq('id', user.id)
      .single();
    
    const userCurrency = profile?.currency || 'IDR';
    const currencySymbol = currencySymbols[userCurrency] || userCurrency;
    const locale = currencyLocales[userCurrency] || 'en-US';
    
    // Helper function to format amount with user's currency
    const formatAmount = (amount: number) => formatCurrency(amount, userCurrency, locale);

    const notifications: Array<{
      user_id: string;
      type: string;
      title: string;
      message: string;
    }> = [];

    // Check if welcome notification already exists
    const { data: existingWelcome } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'system')
      .ilike('title', '%Selamat Datang%')
      .limit(1);

    if (!existingWelcome || existingWelcome.length === 0) {
      // Create welcome notification for new users
      notifications.push({
        user_id: user.id,
        type: 'system',
        title: '👋 Selamat Datang!',
        message: 'Terima kasih telah menggunakan Finance Tracking. Notifikasi akan muncul di sini saat ada anggaran yang hampir habis, tagihan jatuh tempo, atau target tercapai.',
      });
    }

    // Check for budget alerts
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .eq('user_id', user.id);

    if (budgets) {
      for (const budget of budgets) {
        const percentUsed = (budget.spent / budget.amount) * 100;
        if (percentUsed >= 80) {
          // Check if similar notification already exists today
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'budget_alert')
            .gte('created_at', new Date().toISOString().split('T')[0])
            .ilike('message', `%${budget.categories?.name || 'Kategori'}%`)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: user.id,
              type: 'budget_alert',
              title: percentUsed >= 100 ? '⚠️ Anggaran Terlampaui!' : '⚡ Anggaran Hampir Habis',
              message: `${budget.categories?.name || 'Kategori'}: ${Math.round(percentUsed)}% digunakan (${formatAmount(budget.spent)} / ${formatAmount(budget.amount)})`,
            });
          }
        }
      }
    }

    // Check for subscription reminders (3 days before due)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_billing_date', threeDaysFromNow.toISOString().split('T')[0]);

    if (subscriptions) {
      for (const sub of subscriptions) {
        // Check if similar notification already exists today
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'subscription_due')
          .gte('created_at', new Date().toISOString().split('T')[0])
          .ilike('message', `%${sub.name}%`)
          .limit(1);

        if (!existing || existing.length === 0) {
          const dueDate = new Date(sub.next_billing_date);
          const today = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          notifications.push({
            user_id: user.id,
            type: 'subscription_due',
            title: '💳 Tagihan Akan Jatuh Tempo',
            message: `${sub.name}: ${formatAmount(sub.amount)} dalam ${daysUntilDue} hari`,
          });
        }
      }
    }

    // Check for goal reminders
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (goals) {
      for (const goal of goals) {
        const percentComplete = (goal.current_amount / goal.target_amount) * 100;
        
        // Notify if goal is 50%, 75%, or 90% complete (milestone notifications)
        if (percentComplete >= 50 && percentComplete < 100) {
          const milestone = percentComplete >= 90 ? 90 : percentComplete >= 75 ? 75 : 50;
          
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'goal_reminder')
            .ilike('message', `%${goal.name}%${milestone}%`)
            .limit(1);

          if (!existing || existing.length === 0) {
            notifications.push({
              user_id: user.id,
              type: 'goal_reminder',
              title: '🎯 Target Keuangan',
              message: `${goal.name}: ${milestone}% tercapai! (${formatAmount(goal.current_amount)} dari ${formatAmount(goal.target_amount)})`,
            });
          }
        }
      }
    }

    // Insert all new notifications
    if (notifications.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error inserting notifications:', error);
        return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      created: notifications.length,
      notifications 
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
