"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, CheckCircle, Info, XCircle, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  expires_at: string | null;
};

export function GlobalNotifications() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
          setIsOpen(true);
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
          setIsOpen(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDismiss = () => {
    if (notification) {
      setIsOpen(false);
      localStorage.setItem(`dismissed_notification_${notification.id}`, "true");
    }
  };

  if (!notification) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "warning":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-500 animate-pulse" />,
          titleColor: "text-amber-500",
          borderColor: "border-amber-500/20",
          glowColor: "shadow-amber-500/10",
        };
      case "error":
        return {
          icon: <XCircle className="h-12 w-12 text-red-500 animate-bounce" />,
          titleColor: "text-red-500",
          borderColor: "border-red-500/20",
          glowColor: "shadow-red-500/10",
        };
      case "success":
        return {
          icon: <CheckCircle className="h-12 w-12 text-emerald-500 animate-bounce" />,
          titleColor: "text-emerald-500",
          borderColor: "border-emerald-500/20",
          glowColor: "shadow-emerald-500/10",
        };
      default:
        return {
          icon: <Info className="h-12 w-12 text-blue-500 animate-pulse" />,
          titleColor: "text-blue-500",
          borderColor: "border-blue-500/20",
          glowColor: "shadow-blue-500/10",
        };
    }
  };

  const styles = getTypeStyles(notification.type);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`sm:max-w-md border-2 ${styles.borderColor} shadow-2xl ${styles.glowColor} backdrop-blur-3xl`}>
        <DialogHeader className="space-y-4 items-center text-center">
          <div className="rounded-full bg-background/50 p-4 ring-1 ring-border shadow-sm">
            {styles.icon}
          </div>
          <div className="space-y-2">
            <DialogTitle className={`text-2xl font-bold flex items-center justify-center gap-2`}>
               <Terminal className="h-5 w-5 opacity-70" />
               Developer Message
            </DialogTitle>
            <DialogDescription className="text-base text-foreground font-medium pt-2 leading-relaxed">
              {notification.message}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-6">
          <Button 
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold" 
            size="lg"
            onClick={handleDismiss}
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
