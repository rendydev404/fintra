"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Notification = {
  id: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  expires_at: string | null;
};

export function GlobalNotifications() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const fetchNotification = async () => {
      const { data } = await supabase
        .from("global_notifications")
        .select("*")
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        // Check if user has already dismissed this specific notification ID
        const dismissed = localStorage.getItem(`dismissed_notification_${data.id}`);
        if (!dismissed) {
          setNotification(data);
          setIsVisible(true);
        }
      }
    };

    fetchNotification();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("global_notifications_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "global_notifications",
          filter: "is_active=eq.true",
        },
        (payload: any) => {
          const newNotif = payload.new as Notification;
          setNotification(newNotif);
          setIsVisible(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismiss = () => {
    if (notification) {
      setIsVisible(false);
      localStorage.setItem(`dismissed_notification_${notification.id}`, "true");
    }
  };

  if (!notification || !isVisible) return null;

  const getColors = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-500 border-yellow-600 text-white";
      case "error":
        return "bg-red-500 border-red-600 text-white";
      case "success":
        return "bg-green-500 border-green-600 text-white";
      default:
        return "bg-blue-600 border-blue-700 text-white";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md pointer-events-none"
      >
        <div className={`pointer-events-auto shadow-lg rounded-xl p-4 border flex items-start gap-3 backdrop-blur-md bg-opacity-95 ${getColors(notification.type)}`}>
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {notification.message}
          </div>
          <button
            onClick={dismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
