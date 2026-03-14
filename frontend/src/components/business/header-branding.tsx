'use client';

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Palette } from 'lucide-react';
import { getSettings, updateSettings, BusinessProfile, Preferences } from '@/lib/api/business/settings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const themes = [
  { id: 'light', name: 'Light Mode', color: '#ffffff', ring: '#e5e7eb' },
  { id: 'dark', name: 'Dark Mode', color: '#09090b', ring: '#27272a' },
  { id: 'midnight', name: 'Midnight Blue', color: 'oklch(0.4 0.15 250)', ring: 'oklch(0.4 0.15 250)' },
  { id: 'royal', name: 'Royal Purple', color: 'oklch(0.6 0.2 280)', ring: 'oklch(0.6 0.2 280)' },
  { id: 'emerald', name: 'Emerald Green', color: 'oklch(0.6 0.15 150)', ring: 'oklch(0.6 0.15 150)' },
  { id: 'sunset', name: 'Sunset Orange', color: 'oklch(0.65 0.2 40)', ring: 'oklch(0.65 0.2 40)' },
  { id: 'graphite', name: 'Graphite Black', color: 'oklch(0.3 0.05 260)', ring: 'oklch(0.3 0.05 260)' },
];

interface BusinessHeaderBrandingProps {
  collapsed?: boolean;
}

export function BusinessHeaderBranding({ collapsed = false }: BusinessHeaderBrandingProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState('royal');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settings = await getSettings();
        setProfile(settings.profile);
        if (settings.preferences.dashboardTheme) {
          applyTheme(settings.preferences.dashboardTheme);
          setActiveTheme(settings.preferences.dashboardTheme);
        }
      } catch (error) {
        console.error('Failed to load branding settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    if (themeId === 'light') {
      root.style.setProperty('--background', '0 0% 100%');
      root.style.setProperty('--foreground', '240 10% 3.9%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--sidebar-background', '#f8f9fb');
    } else if (themeId === 'dark') {
      root.style.setProperty('--background', '240 10% 3.9%');
      root.style.setProperty('--foreground', '0 0% 98%');
      root.style.setProperty('--card', '240 10% 3.9%');
      root.style.setProperty('--sidebar-background', '#09090b');
    } else {
      root.style.setProperty('--primary', theme.color);
      root.style.setProperty('--sidebar-primary', theme.color);
      root.style.setProperty('--ring', theme.ring);
      root.style.setProperty('--sidebar-ring', theme.ring);
      root.style.setProperty('--chart-1', theme.color);
    }
  };

  const handleThemeChange = async (themeId: string) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    
    try {
      await updateSettings('preferences', { dashboardTheme: themeId });
      toast.success('Theme updated');
    } catch (error) {
      toast.error('Failed to save theme preference');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        {!collapsed && (
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
        )}
      </div>
    );
  }

  const businessName = profile?.name || 'Business Dashboard';
  const initials = businessName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <Avatar className="h-10 w-10 rounded-xl border border-sidebar-border shadow-sm shrink-0">
        <AvatarImage src={profile?.logo} alt={businessName} />
        <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {!collapsed && (
        <div className="flex flex-col justify-center min-w-0">
          <span className="font-bold text-sidebar-foreground tracking-tight leading-none text-sm truncate">
            {businessName}
          </span>
          
          <Popover>
            <PopoverTrigger id="business-branding-popover-trigger" className="text-[11px] text-muted-foreground/60 hover:text-primary transition-colors font-medium tracking-wide text-left flex items-center gap-1 mt-1 group cursor-pointer w-fit">
              RateVoice
              <Palette className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </PopoverTrigger>
            <PopoverContent className="w-[min(16rem,calc(100vw-2rem))] p-3" align="start">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm leading-none">Dashboard Theme</h4>
                  <p className="text-xs text-muted-foreground">Customize your workspace accent color.</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {themes.map((theme) => (
                    <TooltipProvider key={theme.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleThemeChange(theme.id)}
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                              activeTheme === theme.id ? "border-foreground" : "border-transparent"
                            )}
                            style={{ backgroundColor: theme.id === 'light' ? '#f3f4f6' : theme.color }}
                          >
                            {activeTheme === theme.id && (
                              <Check className={`h-4 w-4 drop-shadow-md ${theme.id === 'light' ? 'text-black' : 'text-white'}`} strokeWidth={3} />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {theme.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
