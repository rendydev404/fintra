"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Send } from "lucide-react";

type Notification = {
  id: string;
  message: string;
  type: string;
  created_at: string;
  is_active: boolean;
  expires_at: string;
};

export default function NotificationsPage() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [duration, setDuration] = useState("1"); // In hours
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("global_notifications")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setNotifications(data);
  };

  const handleSend = async () => {
    if (!message) return;
    setIsLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(duration));

      const { error } = await supabase.from("global_notifications").insert({
        message,
        type,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      if (error) throw error;

      toast.success("Notifikasi global berhasil dikirim!");
      setMessage("");
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengirim notifikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("global_notifications").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus.");
    } else {
      toast.success("Dihapus.");
      fetchNotifications();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Notifications</h1>
        <p className="text-muted-foreground">Broadcast messages to all active users immediately.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>Create a new popup message.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Ex: System maintenance in 10 minutes..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (Blue)</SelectItem>
                    <SelectItem value="warning">Warning (Yellow)</SelectItem>
                    <SelectItem value="error">Error (Red)</SelectItem>
                    <SelectItem value="success">Success (Green)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (Hours)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="168">1 Week</SelectItem>
                    <SelectItem value="8760">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSend} disabled={isLoading} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Broadcast Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Recent notifications sent.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        notif.type === 'error' ? 'bg-red-500' : 
                        notif.type === 'warning' ? 'bg-yellow-500' : 
                        notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      {notif.type.toUpperCase()}
                    </div>
                    <p className="text-sm mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Expires: {new Date(notif.expires_at).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(notif.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
