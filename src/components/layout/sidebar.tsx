'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';
import { NAV_ITEMS, NAV_SECONDARY, APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  Repeat,
  Sparkles,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  wallet: Wallet,
  'arrow-left-right': ArrowLeftRight,
  'pie-chart': PieChart,
  target: Target,
  repeat: Repeat,
  sparkles: Sparkles,
  'file-bar-chart': FileBarChart,
  settings: Settings,
};

// Map navigation paths to tour identifiers
const tourIdMap: Record<string, string> = {
  '/dashboard': 'menu-dashboard',
  '/accounts': 'menu-accounts',
  '/transactions': 'menu-transactions',
  '/budgets': 'menu-budgets',
  '/goals': 'menu-goals',
  '/subscriptions': 'menu-subscriptions',
  '/ai-insights': 'menu-ai-insights',
  '/reports': 'menu-reports',
  '/settings': 'menu-settings',
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-card transition-all duration-300 lg:relative lg:z-0',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
          !sidebarOpen && 'overflow-hidden lg:overflow-visible'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2" data-tour="logo">
              <Image 
                src="/logo.webp" 
                alt="FinTra Logo" 
                width={32} 
                height={32} 
                className="rounded-lg h-10 w-10"
              />
              <span className="font-bold text-lg">{APP_NAME}</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('hidden lg:flex', !sidebarOpen && 'mx-auto')}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={tourIdMap[item.href]}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    !sidebarOpen && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          <nav className="space-y-1 px-2">
            {NAV_SECONDARY.map((item) => {
              const Icon = iconMap[item.icon] || Settings;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={tourIdMap[item.href]}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    !sidebarOpen && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 text-muted-foreground hover:text-destructive',
              !sidebarOpen && 'justify-center'
            )}
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>Keluar</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
