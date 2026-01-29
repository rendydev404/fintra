"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUsersList, deleteUser, banUser, unbanUser } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, Search, Trash, Ban, CheckCircle, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  last_sign_in_at?: string;
  created_at: string;
  banned_until?: string;
  // Realtime added prop
  isOnline?: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Load params
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter logic
  useEffect(() => {
    if (!users) return;
    const lower = search.toLowerCase();
    const filtered = users.filter(u => 
      u.email?.toLowerCase().includes(lower) || 
      u.full_name?.toLowerCase().includes(lower)
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  // Realtime Presence Logic
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('online-users');

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      
      // State is like: { userId: [ { user_id, ... } ] }
      const onlineIds = new Set<string>();
      
      Object.keys(state).forEach(key => {
        // The key is often the userId if we set it as tracking key, 
        // but let's iterate the values to be safe
        const presences = state[key] as any[];
        presences.forEach(p => {
            if (p.user_id) onlineIds.add(p.user_id);
        });
      });

      setUsers(prevUsers => 
        prevUsers.map(u => ({
          ...u,
          isOnline: onlineIds.has(u.id)
        }))
      );
    })
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsersList();
      // Map supabase auth user format to our simplified User type
      const mapped = data.map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        banned_until: u.banned_until,
        isOnline: false
      }));
      setUsers(mapped);
      setFilteredUsers(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat users.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async (id: string) => {
    if (!confirm("Ban user ini selamanya?")) return;
    try {
      await banUser(id); // Default forever
      toast.success("User dibanned.");
      loadUsers();
    } catch (e) {
      toast.error("Gagal ban user.");
    }
  };

  const handleUnban = async (id: string) => {
    try {
      await unbanUser(id);
      toast.success("User di-unban.");
      loadUsers();
    } catch (e) {
      toast.error("Gagal unban.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("HAPUS user ini permanen? Data tidak bisa kembali.")) return;
    try {
      await deleteUser(id);
      toast.success("User dihapus.");
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      toast.error("Gagal hapus user.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">{users.length} Registered Users</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder="Search users..." 
                    className="pl-8 w-[250px]" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button onClick={loadUsers} variant="outline" size="icon">
                <CheckCircle className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">User</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Joined</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Last Login</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                    <tr><td colSpan={5} className="p-4 text-center">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center">No users found used.</td></tr>
                ) : (
                    filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar_url || ""} />
                                            <AvatarFallback>{user.full_name?.slice(0,2).toUpperCase() || "U"}</AvatarFallback>
                                        </Avatar>
                                        {user.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.full_name || "No Name"}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                {user.banned_until ? (
                                    <Badge variant="destructive">Banned</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                                )}
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}
                            </td>
                            <td className="p-4 align-middle text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/developer/users/${user.id}`}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {user.banned_until ? (
                                            <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Unban User
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleBan(user.id)} className="text-red-600">
                                                <Ban className="mr-2 h-4 w-4" /> Ban User
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
                                            <Trash className="mr-2 h-4 w-4" /> Delete User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
