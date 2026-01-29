'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function resetDataAction(deleteAllData: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Reset Account Balances to 0
    const { error: accountError } = await supabase
      .from('accounts')
      .update({ balance: 0 })
      .eq('user_id', user.id);

    if (accountError) throw accountError;

    // 2. Delete related data if requested
    if (deleteAllData) {
      // Delete Transactions
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);
      if (txError) throw txError;

      // Delete Budgets
      const { error: budgetError } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id);
      if (budgetError) throw budgetError;

      // Delete Goals
      const { error: goalError } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', user.id);
      if (goalError) throw goalError;

      // Delete Subscriptions
      const { error: subError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);
      if (subError) throw subError;
    }

    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    revalidatePath('/budgets');
    revalidatePath('/goals');
    revalidatePath('/subscriptions');
    revalidatePath('/settings');

    return { success: true };
  } catch (error: any) {
    console.error('Reset Data Error:', error);
    return { success: false, error: error.message };
  }
}
