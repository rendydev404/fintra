import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notification settings
    let { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no settings exist, create default
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          email_budget_alerts: true,
          email_weekly_report: false,
          email_goal_reminders: true,
          push_subscription_reminders: true,
        })
        .select()
        .single();
      
      if (insertError) {
        // Table might not exist yet
        return NextResponse.json({
          email_budget_alerts: true,
          email_weekly_report: false,
          email_goal_reminders: true,
          push_subscription_reminders: true,
        });
      }
      
      settings = newSettings;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      email_budget_alerts, 
      email_weekly_report, 
      email_goal_reminders, 
      push_subscription_reminders 
    } = body;

    // Upsert notification settings
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        email_budget_alerts,
        email_weekly_report,
        email_goal_reminders,
        push_subscription_reminders,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
