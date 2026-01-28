import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    // First, get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Delete all user data from related tables first (cascade might not be set up)
    // Order matters - delete from tables that reference profiles first
    
    // Delete notifications
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    // Delete budgets
    await supabase
      .from('budgets')
      .delete()
      .eq('user_id', userId);

    // Delete goals
    await supabase
      .from('goals')
      .delete()
      .eq('user_id', userId);

    // Delete subscriptions
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    // Delete transactions
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    // Delete categories
    await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId);

    // Delete accounts
    await supabase
      .from('accounts')
      .delete()
      .eq('user_id', userId);

    // Delete notification settings
    await supabase
      .from('notification_settings')
      .delete()
      .eq('user_id', userId);

    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Now delete the user from Supabase Auth using service role
    const serviceClient = await createServiceClient();
    const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return NextResponse.json({ 
        error: 'Failed to delete user from authentication', 
        details: authError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
