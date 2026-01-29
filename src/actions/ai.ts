"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addDays, addMonths, addYears, format, startOfMonth, endOfMonth } from "date-fns";

export async function createBudgetAction(data: { name: string; amount: number; category?: string; period?: string }) {
  const supabase = await createClient(); 
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Find or Create Category
    let categoryId = null;
    if (data.category) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', `%${data.category}%`)
        .eq('user_id', user.id)
        .limit(1);
      
      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      }
    }

    if (!categoryId) {
       const { data: firstCat } = await supabase.from('categories').select('id').eq('user_id', user.id).limit(1);
       if (firstCat && firstCat.length > 0) categoryId = firstCat[0].id;
       else return { success: false, error: "No categories found. Please create a category first." };
    }

    const now = new Date();
    const period = data.period === 'weekly' ? 'weekly' : data.period === 'yearly' ? 'yearly' : 'monthly';
    
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      category_id: categoryId,
      amount: data.amount,
      spent: 0,
      period: period,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      rollover: false
    });

    if (error) throw error;

    revalidatePath('/budgets');
    revalidatePath('/dashboard');
    return { success: true };

  } catch (error: any) {
    console.error("Create Budget Error:", error);
    return { success: false, error: error.message };
  }
}

export async function createGoalAction(data: { name: string; amount: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      name: data.name,
      target_amount: data.amount,
      current_amount: 0,
      deadline: null, 
      icon: 'target',
      color: '#8b5cf6', 
      status: 'active'
    });

    if (error) throw error;

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSubscriptionAction(data: { name: string; amount: number; category?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const { error } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      name: data.name,
      amount: data.amount,
      billing_cycle: 'monthly', 
      next_billing_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      is_active: true,
      notes: 'Created by AI Assistant'
    });

    if (error) throw error;

    revalidatePath('/subscriptions');
    revalidatePath('/dashboard');
    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
