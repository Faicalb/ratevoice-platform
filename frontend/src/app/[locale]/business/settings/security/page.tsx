'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api/api';
import { getSettings, updateSettings } from '@/lib/api/business/settings';
import { toast } from 'sonner';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginHistory, setLoginHistory] = useState<Array<{ date: string; ip: string; device: string }>>([]);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        setTwoFactor(!!settings.security?.twoFactorEnabled);
        setLoginHistory(settings.security?.loginHistory || []);
      } catch {}
    })();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: password, newPassword });
      toast.success('Password updated successfully');
      setPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async (checked: boolean) => {
    try {
      await updateSettings('security', { twoFactorEnabled: checked });
      setTwoFactor(checked);
      toast.success(`Two-factor authentication ${checked ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update two-factor settings');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account Security</h3>
        <p className="text-sm text-muted-foreground">
          Manage your password and security settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password regularly to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Enable 2FA</Label>
            <p className="text-sm text-muted-foreground">
              Protect your account with an authenticator app.
            </p>
          </div>
          <Switch checked={twoFactor} onCheckedChange={handleTwoFactorToggle} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>
            Review recent login activity on your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {loginHistory.map((login, index) => (
              <li key={index} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{login.device}</p>
                  <p className="text-muted-foreground">{login.ip}</p>
                </div>
                <span className="text-muted-foreground">{login.date}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
