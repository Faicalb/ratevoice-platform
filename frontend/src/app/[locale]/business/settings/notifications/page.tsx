'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getSettings, updateSettings } from '@/lib/api/business/settings';
import { toast } from 'sonner';

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState({ marketing: false, security: true, updates: true });
  const [push, setPush] = useState({ newReview: true, newBooking: true, mentions: false });

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        setEmail(settings.notifications?.email || { marketing: false, security: true, updates: true });
        setPush(settings.notifications?.push || { newReview: true, newBooking: true, mentions: false });
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings('notifications', { email, push });
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Choose what you want to be notified about.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Manage your email preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="marketing" className="flex flex-col space-y-1">
              <span>Marketing emails</span>
              <span className="font-normal text-xs text-muted-foreground">Receive emails about new products, features, and more.</span>
            </Label>
            <Switch
              id="marketing"
              checked={email.marketing}
              onCheckedChange={(checked) => setEmail({ ...email, marketing: checked })}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="security" className="flex flex-col space-y-1">
              <span>Security emails</span>
              <span className="font-normal text-xs text-muted-foreground">Receive emails about your account security.</span>
            </Label>
            <Switch
              id="security"
              checked={email.security}
              onCheckedChange={(checked) => setEmail({ ...email, security: checked })}
              disabled
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="updates" className="flex flex-col space-y-1">
              <span>Product updates</span>
              <span className="font-normal text-xs text-muted-foreground">Receive emails about product updates and changes.</span>
            </Label>
            <Switch
              id="updates"
              checked={email.updates}
              onCheckedChange={(checked) => setEmail({ ...email, updates: checked })}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Manage your push notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="new-review" className="flex flex-col space-y-1">
              <span>New Reviews</span>
              <span className="font-normal text-xs text-muted-foreground">Get notified when you receive a new review.</span>
            </Label>
            <Switch
              id="new-review"
              checked={push.newReview}
              onCheckedChange={(checked) => setPush({ ...push, newReview: checked })}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="new-booking" className="flex flex-col space-y-1">
              <span>New Bookings</span>
              <span className="font-normal text-xs text-muted-foreground">Get notified when you receive a new booking.</span>
            </Label>
            <Switch
              id="new-booking"
              checked={push.newBooking}
              onCheckedChange={(checked) => setPush({ ...push, newBooking: checked })}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="mentions" className="flex flex-col space-y-1">
              <span>Mentions</span>
              <span className="font-normal text-xs text-muted-foreground">Get notified when you are mentioned.</span>
            </Label>
            <Switch
              id="mentions"
              checked={push.mentions}
              onCheckedChange={(checked) => setPush({ ...push, mentions: checked })}
            />
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
