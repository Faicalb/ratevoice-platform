'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PrivacySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);

  const handleExportData = () => {
    toast.info('Your data export has started. We will email you when it is ready.');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion initiated');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy & Data</h3>
        <p className="text-sm text-muted-foreground">
          Manage your data privacy and account deletion.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Data Sharing</CardTitle>
          <CardDescription>
            Control how your data is shared with third parties.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Share usage data</Label>
            <p className="text-sm text-muted-foreground">
              Help us improve our services by sharing anonymous usage data.
            </p>
          </div>
          <Switch checked={dataSharing} onCheckedChange={setDataSharing} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download a copy of your personal data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Download Archive</Label>
              <p className="text-sm text-muted-foreground">
                Your data will be exported in JSON format.
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-600">Delete Account</CardTitle>
          <CardDescription className="text-red-600/80">
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-transparent border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action is irreversible. Please be certain.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
