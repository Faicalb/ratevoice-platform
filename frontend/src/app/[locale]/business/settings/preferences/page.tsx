'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getSettings, updateSettings } from '@/lib/api/business/settings';
import { toast } from 'sonner';

export default function PreferencesSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        setLanguage(settings.preferences?.language || 'en');
        setCurrency(settings.preferences?.currency || 'USD');
        setTimezone(settings.preferences?.timezone || 'UTC');
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings('preferences', { language, currency, timezone });
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Language & Region</h3>
        <p className="text-sm text-muted-foreground">
          Customize your language and regional settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>
            Select your preferred language.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>
            Select your preferred currency for reports and billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>
            Set your local timezone for accurate reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="UTC-5">Eastern Time (US & Canada)</SelectItem>
                <SelectItem value="UTC-8">Pacific Time (US & Canada)</SelectItem>
                <SelectItem value="UTC+1">Central European Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
