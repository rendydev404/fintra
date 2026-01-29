"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/app-store";

export function UserPresenceTracker() {
  const { user } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    
    // Channel name 'online-users' is public
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      // We don't need to do anything here on client side for the tracker itself
      // The admin dashboard will listen to this.
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const presenceState = {
          user_id: user.id,
          email: user.email,
          full_name: user?.full_name || 'User',
          avatar_url: user?.avatar_url,
          online_at: new Date().toISOString(),
        };
        
        await channel.track(presenceState);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
