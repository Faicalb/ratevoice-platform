'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSettings, updateSettings, Preferences } from '@/lib/api/business/settings';
import { toast } from 'sonner';
import { Check, Palette, Sparkles, Layout, Monitor, Moon, Sun, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'light', name: 'Light Mode', color: '#ffffff', border: '#e5e7eb' },
  { id: 'dark', name: 'Dark Mode', color: '#09090b', border: '#27272a' },
  { id: 'midnight', name: 'Midnight Blue', color: 'oklch(0.4 0.15 250)', border: 'oklch(0.4 0.15 250)' },
  { id: 'royal', name: 'Royal Purple', color: 'oklch(0.6 0.2 280)', border: 'oklch(0.6 0.2 280)' },
  { id: 'emerald', name: 'Emerald Green', color: 'oklch(0.6 0.15 150)', border: 'oklch(0.6 0.15 150)' },
  { id: 'sunset', name: 'Sunset Orange', color: 'oklch(0.65 0.2 40)', border: 'oklch(0.65 0.2 40)' },
];

export default function BrandingSettingsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTheme, setAutoTheme] = useState(false);
  const [customColor, setCustomColor] = useState('#7c3aed');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setPreferences(data.preferences);
        setAutoTheme(data.preferences.autoTheme || false);
        if (data.preferences.brandColor) {
          setCustomColor(data.preferences.brandColor);
        }
      } catch (error) {
        toast.error('Failed to load branding settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleThemeSelect = async (themeId: string) => {
    if (!preferences) return;
    
    // Update local state for instant preview
    setPreferences({ ...preferences, dashboardTheme: themeId });
    setAutoTheme(false); // Disable auto theme when manual selection happens

    // Apply CSS variables instantly
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
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
        // Colored themes logic
        root.style.setProperty('--primary', theme.color);
        root.style.setProperty('--sidebar-primary', theme.color);
        root.style.setProperty('--ring', theme.border);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings('preferences', {
        ...preferences,
        autoTheme,
        brandColor: customColor
      });
      toast.success('Branding settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const detectThemeFromLogo = () => {
    // Simulation of logo color analysis
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Analyzing logo colors...',
        success: () => {
          setAutoTheme(true);
          handleThemeSelect('royal'); // Simulated result
          return 'Theme auto-detected: Royal Purple';
        },
        error: 'Failed to analyze logo'
      }
    );
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Brand Identity</h3>
        <p className="text-sm text-muted-foreground">
          Customize your workspace look and feel to match your brand.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Smart Theme Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Smart Theme Detection
                </CardTitle>
                <CardDescription>
                  Automatically adapt the dashboard colors based on your business logo.
                </CardDescription>
              </div>
              <Switch 
                checked={autoTheme}
                onCheckedChange={(checked) => {
                  setAutoTheme(checked);
                  if (checked) detectThemeFromLogo();
                }}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Manual Theme Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dashboard Theme</CardTitle>
            <CardDescription>Select a preset theme for your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
                    preferences?.dashboardTheme === theme.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/20"
                  )}
                >
                  <div 
                    className="h-12 w-full rounded-lg shadow-sm" 
                    style={{ backgroundColor: theme.id === 'light' ? '#f3f4f6' : theme.color }}
                  />
                  <span className="text-xs font-medium">{theme.name}</span>
                  {preferences?.dashboardTheme === theme.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Brand Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brand Customization</CardTitle>
            <CardDescription>Fine-tune colors and styles manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label>Brand Accent Color</Label>
                <div className="flex gap-3">
                  <Input 
                    type="color" 
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-10 w-20 p-1 cursor-pointer"
                  />
                  <Input 
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="font-mono uppercase"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for buttons, links, and active states.
                </p>
              </div>

              <div className="space-y-4">
                <Label>Interface Style</Label>
                <RadioGroup 
                  defaultValue={preferences?.brandStyle || 'soft'} 
                  className="grid grid-cols-3 gap-4"
                  onValueChange={(val) => setPreferences(prev => prev ? { ...prev, brandStyle: val as any } : null)}
                >
                  <div>
                    <RadioGroupItem value="soft" id="soft" className="peer sr-only" />
                    <Label
                      htmlFor="soft"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Layout className="mb-3 h-6 w-6" />
                      Soft
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="flat" id="flat" className="peer sr-only" />
                    <Label
                      htmlFor="flat"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Monitor className="mb-3 h-6 w-6" />
                      Flat
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="glass" id="glass" className="peer sr-only" />
                    <Label
                      htmlFor="glass"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Wand2 className="mb-3 h-6 w-6" />
                      Glass
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-muted-foreground">
                Changes will be visible to all team members.
              </span>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Branding'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
