'use client';

import React, { useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  BarChart2,
  MessageSquare,
  Users,
  Wallet,
  Settings,
  Megaphone,
  BrainCircuit,
  Maximize2,
  Menu,
  X,
  Star,
  Gift,
  Calendar,
  Video,
  Radio,
  Newspaper,
  Search,
  Briefcase,
  FileText,
  Zap,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommandPalette } from '@/components/command-palette';
import { LanguageSwitcher } from '@/components/language-switcher';
import { SmartUserControlPanel } from '@/components/smart-user-control-panel';
import { BusinessHeaderBranding } from '@/components/business/header-branding';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('Dashboard'); // Assuming existing translations work
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Define navigation items based on the user's list
  const navItems = [
    { href: "/business/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/business/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/business/voice-reviews", icon: MessageSquare, label: "Voice Reviews" },
    { href: "/business/ai-comment-analysis", icon: BrainCircuit, label: "AI Analysis" },
    { href: "/business/reputation-score", icon: Star, label: "Reputation" },
    { href: "/business/points-compensation", icon: Gift, label: "Compensation" },
    { href: "/business/bookings", icon: Calendar, label: "Bookings" },
    { href: "/business/ads-management", icon: Megaphone, label: "Ads Manager" },
    { href: "/business/stories-video-ads", icon: Video, label: "Video Ads" },
    { href: "/business/live-stories", icon: Radio, label: "Live Stories" },
    { href: "/business/news-events", icon: Newspaper, label: "News & Events" },
    { href: "/business/business-seo", icon: Search, label: "SEO" },
    { href: "/business/competitor-analysis", icon: Users, label: "Competitors" },
    { href: "/business/ai-market-search", icon: Zap, label: "Market Search" },
    { href: "/business/employee-management", icon: Briefcase, label: "Employees" },
    { href: "/business/subscription-plan", icon: Wallet, label: "Subscription" },
    { href: "/business/smart-reports", icon: FileText, label: "Smart Reports" },
    { href: "/business/ai-engine", icon: BrainCircuit, label: "AI Engine" },
    { href: "/business/reports", icon: FileText, label: "Reports" },
    { href: "/business/business-registration", icon: FileText, label: "Registration" },
    { href: "/business/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      <CommandPalette />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="flex h-20 items-center px-6 gap-3 border-b border-sidebar-border/50">
          <BusinessHeaderBranding collapsed={!isSidebarOpen} />
          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <Maximize2 className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4" id="business-sidebar-scroll">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
                collapsed={!isSidebarOpen}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border/50">
           <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer group">
            <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
              <AvatarImage src="https://i.pravatar.cc/150?u=business" />
              <AvatarFallback>BZ</AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold text-sidebar-foreground truncate">My Business</span>
                <span className="text-[10px] text-muted-foreground truncate">Premium Plan</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
            <BusinessHeaderBranding collapsed={false} />
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href || pathname.startsWith(item.href + '/')}
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
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-sm truncate hidden sm:inline">Search platform...</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <SmartUserControlPanel userRole="Owner" />
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

function NavItem({ href, icon: Icon, label, active, collapsed, onSelect }: any) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group relative ${
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
      {!collapsed && <span className="text-xs font-medium">{label}</span>}
      {active && !collapsed && (
        <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
      )}
    </Link>
  );
}
