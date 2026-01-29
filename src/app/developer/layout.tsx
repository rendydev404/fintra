import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  Settings, 
  Activity,
  Terminal,
  ShieldAlert
} from "lucide-react";

const DEVELOPER_EMAIL = "rendyakun50@gmail.com";

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== DEVELOPER_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Dev Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:block">
        <div className="p-6 border-b">
          <Link href="/developer" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Terminal className="h-6 w-6" />
            <span>DevTools</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/developer" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <Activity className="h-5 w-5" />
            Overview
          </Link>
          <Link href="/developer/users" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <Users className="h-5 w-5" />
            User Management
          </Link>
          <Link href="/developer/notifications" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <Bell className="h-5 w-5" />
            Global Notifications
          </Link>
          <Link href="/developer/playground" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md hover:bg-muted transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            UI Playground
          </Link>
          <div className="pt-4 mt-4 border-t">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors rounded-md">
              <ShieldAlert className="h-5 w-5" />
              Exit to App
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
