'use client';

import React, { useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  BarChart2,
  Users,
  Wallet,
  Settings,
  Shield,
  Activity,
  Key,
  Globe,
  Database,
  Terminal,
  FileText,
  AlertTriangle,
  Zap,
  Lock,
  Flag,
  Radio,
  Search,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommandPalette } from '@/components/command-palette';
import { LanguageSwitcher } from '@/components/language-switcher';
import { CurrencySwitcher } from '@/components/currency-switcher';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Define navigation items based on the user's list
  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/business-management", icon: Users, label: "Businesses" },
    { href: "/admin/reputation-control", icon: Star, label: "Reputation" },
    { href: "/admin/user-management", icon: Users, label: "Users" },
    { href: "/admin/ambassador-management", icon: Flag, label: "Ambassadors" },
    { href: "/admin/elite-level-management", icon: Shield, label: "Elite Levels" },
    { href: "/admin/group-management", icon: Users, label: "Groups" },
    { href: "/admin/wallet-control", icon: Wallet, label: "Wallet" },
    { href: "/admin/visitor-analytics", icon: BarChart2, label: "Visitor Analytics" },
    { href: "/admin/reports", icon: FileText, label: "Reports" },
    { href: "/admin/security-alerts", icon: AlertTriangle, label: "Security Alerts" },
    { href: "/admin/system-health-monitor", icon: Activity, label: "System Health" },
    { href: "/admin/api-gateway", icon: Key, label: "API Gateway" },
    { href: "/admin/ads-control", icon: Megaphone, label: "Ads Control" },
    { href: "/admin/stories-live-control", icon: Radio, label: "Stories Live" },
    { href: "/admin/seo-control", icon: Search, label: "SEO Control" },
    { href: "/admin/competitor-data-control", icon: Database, label: "Competitor Data" },
    { href: "/admin/events-news-control", icon: Newspaper, label: "News Control" },
    { href: "/admin/ai-engine-control", icon: BrainCircuit, label: "AI Control" },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      <CommandPalette />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="flex h-20 items-center px-6 gap-3 border-b border-sidebar-border/50">
          <div className="bg-destructive/10 rounded-xl p-2 shrink-0 border border-destructive/20">
            <div className="h-6 w-6 bg-destructive rounded-md flex items-center justify-center">
              <span className="text-destructive-foreground text-xs font-bold">A</span>
            </div>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground tracking-tight">RateVoice</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Super Admin</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <Maximize2 className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin')}
                collapsed={!isSidebarOpen}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border/50">
           <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer group">
            <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-destructive/20 transition-all">
              <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold text-sidebar-foreground truncate">System Admin</span>
                <span className="text-[10px] text-muted-foreground truncate">Root Access</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
            <div className="bg-destructive/10 rounded-xl p-2 shrink-0 border border-destructive/20">
              <div className="h-6 w-6 bg-destructive rounded-md flex items-center justify-center">
                <span className="text-destructive-foreground text-xs font-bold">A</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight">RateVoice</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Super Admin</span>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin')}
                  collapsed={false}
                  onSelect={() => setIsMobileNavOpen(false)}
                />
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
        <header className="h-16 border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur-md">
          <div className="app-container h-full flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileNavOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Lock className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm font-bold text-destructive truncate">Secure Environment</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
          </div>
        </header>
        <main className="flex-1 py-4 sm:py-6 lg:py-8 overflow-y-auto">
          <div className="app-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Reusing icon imports from lucide-react (Need to ensure all are imported)
import {
  Megaphone,
  BrainCircuit,
  Maximize2,
  Menu,
  Star,
  Calendar,
  Newspaper
} from 'lucide-react';

function NavItem({ href, icon: Icon, label, active, collapsed, onSelect }: any) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group relative ${
        active ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-destructive' : ''}`} />
      {!collapsed && <span className="text-xs font-medium">{label}</span>}
      {active && !collapsed && (
        <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_var(--destructive)]" />
      )}
    </Link>
  );
}
