"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with Service Role Access
const getAdminClient = () => {
    return createServerClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        cookies: {
            getAll: () => [],
            setAll: () => {},
        },
    });
};

export async function getUsersList() {
    const supabase = getAdminClient();
    
    // Get all profiles first (public data)
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    // We can't easily list ALL auth users without using the admin API pagination
    // But since we have profiles for every user (ideally), we can map them.
    // For now, let's return profiles.
    
    // To get "Banned" status or specific Auth data (last_sign_in_at is in auth.users),
    // we need to query auth.users. 
    // This requires: await supabase.auth.admin.listUsers()

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (authError) throw authError;

    // Merge data
    const mergedUsers = users.map(user => {
        const profile = profiles.find(p => p.id === user.id);
        return {
            ...user,
            full_name: profile?.full_name || user.user_metadata?.full_name || 'Unknown',
            avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
            currency: profile?.currency,
        };
    });

    return mergedUsers;
}

export async function deleteUser(userId: string) {
    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { success: true };
}

export async function banUser(userId: string, banDurationHours: number = 24 * 365 * 10) {
    const supabase = getAdminClient();
    const banUntil = new Date();
    banUntil.setHours(banUntil.getHours() + banDurationHours);

    const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: `${banDurationHours}h` // Supabase expects duration string like "24h"
    });
    
    // Note: Supabase implementation of ban might vary. 
    // Ideally we just confirm the update works.
    
    if (error) throw error;
    return { success: true, banned_until: banUntil.toISOString() };
}

export async function unbanUser(userId: string) {
    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "0s" // Remove ban
    });
    if (error) throw error;
    return { success: true };
}

export async function getUserDetails(userId: string) {
    const supabase = getAdminClient();
    
    // Fetch Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    // Fetch Accounts
    const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId);
    
    // Fetch Transaction Stats (Count, Last Tx)
    const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    
    // Fetch Total Balance (Sum of accounts)
    const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

    return {
        profile,
        accounts,
        txCount,
        totalBalance
    };
}
