'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  User,
  Shield,
  Bell,
  Globe,
  Users,
  Wallet,
  CreditCard,
  Puzzle,
  Lock,
  ChevronRight,
  Palette
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/business/settings/profile',
    icon: User,
  },
  {
    title: 'Brand Identity',
    href: '/business/settings/branding',
    icon: Palette,
  },
  {
    title: 'Security',
    href: '/business/settings/security',
    icon: Shield,
  },
  {
    title: 'Notifications',
    href: '/business/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Preferences',
    href: '/business/settings/preferences',
    icon: Globe,
  },
  {
    title: 'Team',
    href: '/business/settings/team',
    icon: Users,
  },
  {
    title: 'Wallet & Payouts',
    href: '/business/settings/wallet',
    icon: Wallet,
  },
  {
    title: 'Subscription',
    href: '/business/settings/subscription',
    icon: CreditCard,
  },
  {
    title: 'Integrations',
    href: '/business/settings/integrations',
    icon: Puzzle,
  },
  {
    title: 'Privacy',
    href: '/business/settings/privacy',
    icon: Lock,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                  pathname === item.href ? 'bg-accent text-accent-foreground' : 'transparent',
                  'justify-start'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
                {pathname === item.href && (
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                )}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
