'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  BarChart,
  MessageSquare,
  CreditCard,
  Puzzle,
  Key,
  Shield,
  Activity,
  Code,
  Globe,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  ArrowLeftRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  Clock,
  Play,
  Loader2,
  Server,
  Link
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { integrationsApi, Channel, ICalImport, ExternalApi, SyncLog } from '@/lib/api/business/integrations';

export default function IntegrationsSettingsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [icals, setIcals] = useState<ICalImport[]>([]);
  const [apis, setApis] = useState<ExternalApi[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportUrl, setExportUrl] = useState('');

  // Forms State
  const [isAddApiOpen, setIsAddApiOpen] = useState(false);
  const [isAddICalOpen, setIsAddICalOpen] = useState(false);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  
  // Channel Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedChannelType, setSelectedChannelType] = useState<string | null>(null);
  const [channelForm, setChannelForm] = useState({
    name: '',
    type: 'ota',
    connectionMethod: 'api',
    apiKey: '',
    apiSecret: '',
    icalUrl: '',
    syncFrequency: '1hour',
    autoImport: true,
    autoUpdate: true
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // New API Form
  const [apiForm, setApiForm] = useState({
    name: '',
    provider: '',
    key: '',
    endpoint: '',
    environment: 'production'
  });

  // New iCal Form
  const [icalForm, setIcalForm] = useState({
    name: '',
    url: '',
    frequency: '1hour'
  });

  const fetchData = async () => {
    try {
      const [channelsData, icalsData, apisData, logsData, url] = await Promise.all([
        integrationsApi.getChannels(),
        integrationsApi.getICals(),
        integrationsApi.getExternalApis(),
        integrationsApi.getSyncLogs(),
        integrationsApi.getExportUrl()
      ]);
      setChannels(channelsData);
      setIcals(icalsData);
      setApis(apisData);
      setLogs(logsData);
      setExportUrl(url);
    } catch (error) {
      toast.error('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleChannel = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    try {
      await integrationsApi.toggleChannel(id, newStatus);
      setChannels(channels.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
      toast.success(`Channel ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update channel status');
    }
  };

  const handleSyncChannel = async (id: string) => {
    toast.promise(integrationsApi.triggerSync(id), {
      loading: 'Syncing channel...',
      success: (data) => `Synced ${data.imported} reservations`,
      error: 'Sync failed'
    });
  };

  const handleAddApi = async () => {
    if (!apiForm.name || !apiForm.key) return;
    try {
      await integrationsApi.addExternalApi(apiForm as any);
      toast.success('API Integration added');
      setIsAddApiOpen(false);
      setApiForm({ name: '', provider: '', key: '', endpoint: '', environment: 'production' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add API');
    }
  };

  const handleAddICal = async () => {
    if (!icalForm.name || !icalForm.url) return;
    try {
      await integrationsApi.addICal(icalForm as any);
      toast.success('Calendar import added');
      setIsAddICalOpen(false);
      setIcalForm({ name: '', url: '', frequency: '1hour' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add calendar');
    }
  };

  // Channel Wizard Handlers
  const handleSelectChannelType = (type: string, name: string) => {
    setSelectedChannelType(type);
    setChannelForm(prev => ({ ...prev, name, type }));
    setWizardStep(2);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    try {
      await integrationsApi.testConnection({ 
        key: channelForm.apiKey, 
        url: channelForm.icalUrl 
      });
      setConnectionStatus('success');
      toast.success('Connection successful');
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Connection failed: Invalid credentials');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveChannel = async () => {
    try {
      await integrationsApi.addChannel(channelForm);
      toast.success('Channel connected successfully');
      setIsAddChannelOpen(false);
      setWizardStep(1);
      setChannelForm({
        name: '',
        type: 'ota',
        connectionMethod: 'api',
        apiKey: '',
        apiSecret: '',
        icalUrl: '',
        syncFrequency: '1hour',
        autoImport: true,
        autoUpdate: true
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to save channel');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'success':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'syncing':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'error':
      case 'failed':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Channel Manager & API Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect external booking platforms, channel managers, and APIs to automatically synchronize reservations.
        </p>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="h-auto p-1 bg-muted/50">
          <TabsTrigger value="channels" className="h-9">Connected Channels</TabsTrigger>
          <TabsTrigger value="ical-import" className="h-9">iCal Import</TabsTrigger>
          <TabsTrigger value="ical-export" className="h-9">iCal Export</TabsTrigger>
          <TabsTrigger value="api-integrations" className="h-9">API Integrations</TabsTrigger>
          <TabsTrigger value="logs" className="h-9">Sync Logs</TabsTrigger>
          <TabsTrigger value="automation" className="h-9">Automation</TabsTrigger>
        </TabsList>

        {/* 1. CONNECTED CHANNELS */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <Card key={channel.id} className="border-border/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Avatar className="h-12 w-12 rounded-lg border bg-white p-1">
                      <AvatarImage src={channel.logo} className="object-contain" />
                      <AvatarFallback>{channel.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <Badge variant="outline" className={`capitalize ${getStatusColor(channel.status)}`}>
                      {channel.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-base">{channel.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {channel.type === 'ota' ? 'Online Travel Agency' : 'Calendar System'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Last Sync</p>
                      <p className="font-medium">{new Date(channel.lastSync).toLocaleTimeString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Reservations</p>
                      <p className="font-medium">{channel.importedReservations}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  {channel.status === 'connected' ? (
                    <>
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleSyncChannel(channel.id)}>
                        <RefreshCw className="mr-2 h-3 w-3" /> Sync
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleToggleChannel(channel.id, channel.status)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full text-xs" 
                      size="sm"
                      onClick={() => handleToggleChannel(channel.id, channel.status)}
                    >
                      Connect
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
            
            <Dialog open={isAddChannelOpen} onOpenChange={setIsAddChannelOpen}>
              <DialogTrigger asChild>
                <Card className="border-dashed border-2 shadow-none flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-muted/50 transition-colors min-h-[250px]">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Connect New Channel</h4>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    Add Booking.com, Airbnb, Expedia or other OTA
                  </p>
                  <Button variant="secondary" size="sm">Browse Directory</Button>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Booking Channel</DialogTitle>
                  <DialogDescription>
                    Connect a new OTA, Channel Manager, or Calendar to sync reservations.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  {/* STEP 1: SELECT CHANNEL TYPE */}
                  {wizardStep === 1 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { id: 'booking', name: 'Booking.com', type: 'ota', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Booking.com_logo.svg' },
                        { id: 'airbnb', name: 'Airbnb', type: 'ota', icon: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg' },
                        { id: 'expedia', name: 'Expedia', type: 'ota', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Expedia_logo_2024.svg' },
                        { id: 'google', name: 'Google Calendar', type: 'calendar', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' },
                        { id: 'cloudbeds', name: 'Cloudbeds', type: 'pms', icon: Globe },
                        { id: 'custom', name: 'Custom iCal', type: 'calendar', icon: Calendar },
                      ].map((channel) => (
                        <div 
                          key={channel.id}
                          className="border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 text-center"
                          onClick={() => handleSelectChannelType(channel.type, channel.name)}
                        >
                          {typeof channel.icon === 'string' ? (
                            <img src={channel.icon} alt={channel.name} className="h-10 w-10 object-contain" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <channel.icon className="h-5 w-5" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{channel.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STEP 2: CONFIGURE CONNECTION */}
                  {wizardStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b pb-4">
                        <div>
                          <h4 className="font-medium">{channelForm.name} Connection</h4>
                          <p className="text-xs text-muted-foreground capitalize">{channelForm.type} Integration</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setWizardStep(1)}>Change Channel</Button>
                      </div>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Connection Method</Label>
                          <Select 
                            value={channelForm.connectionMethod} 
                            onValueChange={(v) => setChannelForm({...channelForm, connectionMethod: v})}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="api">API / XML Connection (Recommended)</SelectItem>
                              <SelectItem value="ical">iCal Calendar Sync</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {channelForm.connectionMethod === 'api' ? (
                          <>
                            <div className="space-y-2">
                              <Label>API Key / Hotel ID</Label>
                              <Input 
                                type="password"
                                value={channelForm.apiKey}
                                onChange={(e) => setChannelForm({...channelForm, apiKey: e.target.value})}
                                placeholder="Enter API Key provided by channel"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>API Secret / Password (Optional)</Label>
                              <Input 
                                type="password"
                                value={channelForm.apiSecret}
                                onChange={(e) => setChannelForm({...channelForm, apiSecret: e.target.value})}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <Label>Calendar URL (iCal)</Label>
                            <Input 
                              value={channelForm.icalUrl}
                              onChange={(e) => setChannelForm({...channelForm, icalUrl: e.target.value})}
                              placeholder="https://..."
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Sync Frequency</Label>
                          <Select 
                            value={channelForm.syncFrequency} 
                            onValueChange={(v) => setChannelForm({...channelForm, syncFrequency: v})}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15min">Every 15 minutes</SelectItem>
                              <SelectItem value="30min">Every 30 minutes</SelectItem>
                              <SelectItem value="1hour">Every hour</SelectItem>
                              <SelectItem value="6hours">Every 6 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between border p-3 rounded-md">
                          <div className="space-y-0.5">
                            <Label>Auto-Import Reservations</Label>
                            <p className="text-xs text-muted-foreground">Automatically create bookings in RateVoice</p>
                          </div>
                          <Switch 
                            checked={channelForm.autoImport}
                            onCheckedChange={(c) => setChannelForm({...channelForm, autoImport: c})}
                          />
                        </div>
                      </div>

                      {/* Connection Status Indicator */}
                      {connectionStatus !== 'idle' && (
                        <div className={`flex items-center gap-2 p-3 rounded-md ${
                          connectionStatus === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {connectionStatus === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          <span className="text-sm font-medium">
                            {connectionStatus === 'success' ? 'Connection Successful!' : 'Connection Failed. Check credentials.'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="flex justify-between items-center sm:justify-between">
                  {wizardStep === 2 && (
                    <Button variant="outline" onClick={handleTestConnection} disabled={isTestingConnection}>
                      {isTestingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                      Test Connection
                    </Button>
                  )}
                  {wizardStep === 2 ? (
                    <Button onClick={handleSaveChannel} disabled={connectionStatus !== 'success'}>
                      Connect Channel
                    </Button>
                  ) : (
                    <div />
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* 2. ICAL IMPORT */}
        <TabsContent value="ical-import" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Calendar Imports</h4>
              <p className="text-sm text-muted-foreground">Sync reservations from external iCal feeds.</p>
            </div>
            <Dialog open={isAddICalOpen} onOpenChange={setIsAddICalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Import Calendar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import iCal Feed</DialogTitle>
                  <DialogDescription>Paste the iCal link from Airbnb, Booking.com or Google Calendar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input 
                      placeholder="e.g. Villa Airbnb" 
                      value={icalForm.name}
                      onChange={e => setIcalForm({...icalForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>iCal URL</Label>
                    <Input 
                      placeholder="https://..." 
                      value={icalForm.url}
                      onChange={e => setIcalForm({...icalForm, url: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sync Frequency</Label>
                    <Select value={icalForm.frequency} onValueChange={v => setIcalForm({...icalForm, frequency: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15min">Every 15 minutes</SelectItem>
                        <SelectItem value="30min">Every 30 minutes</SelectItem>
                        <SelectItem value="1hour">Every hour</SelectItem>
                        <SelectItem value="6hours">Every 6 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddICal}>Import Calendar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {icals.map((ical) => (
              <div key={ical.id} className="flex items-center justify-between border p-4 rounded-lg bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{ical.name}</h4>
                      <Badge variant="outline" className={getStatusColor(ical.status)}>{ical.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[300px] truncate">{ical.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Sync Frequency</p>
                    <p className="font-medium">{ical.frequency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Last Sync</p>
                    <p className="font-medium">{new Date(ical.lastSync).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Events</p>
                    <p className="font-medium">{ical.totalEvents}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><RefreshCw className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 3. ICAL EXPORT */}
        <TabsContent value="ical-export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Calendar</CardTitle>
              <CardDescription>
                Share your RateVoice availability with external platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your RateVoice iCal URL</Label>
                <div className="flex gap-2">
                  <Input value={exportUrl} readOnly className="font-mono text-xs bg-muted" />
                  <Button variant="outline" onClick={() => copyToClipboard(exportUrl)}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste this link into Booking.com, Airbnb, or Google Calendar to sync your RateVoice bookings to them.
                </p>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Export Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Include Blocked Dates</Label>
                      <p className="text-xs text-muted-foreground">Sync manual blocks as unavailable dates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Include Tentative Bookings</Label>
                      <p className="text-xs text-muted-foreground">Sync unconfirmed inquiries as unavailable</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Anonymize Guest Data</Label>
                      <p className="text-xs text-muted-foreground">Hide guest names in the exported calendar events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. API INTEGRATIONS */}
        <TabsContent value="api-integrations" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium">External API Manager</h4>
              <p className="text-sm text-muted-foreground">Connect third-party services and manage API keys securely.</p>
            </div>
            <Dialog open={isAddApiOpen} onOpenChange={setIsAddApiOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Connect API
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect External API</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input 
                      placeholder="e.g. Stripe Payments" 
                      value={apiForm.name}
                      onChange={e => setApiForm({...apiForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Input 
                      placeholder="e.g. Stripe, SendGrid, Twilio" 
                      value={apiForm.provider}
                      onChange={e => setApiForm({...apiForm, provider: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input 
                      type="password"
                      placeholder="sk_..." 
                      value={apiForm.key}
                      onChange={e => setApiForm({...apiForm, key: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endpoint URL (Optional)</Label>
                    <Input 
                      placeholder="https://api.example.com" 
                      value={apiForm.endpoint}
                      onChange={e => setApiForm({...apiForm, endpoint: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select value={apiForm.environment} onValueChange={v => setApiForm({...apiForm, environment: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddApi}>Save Integration</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable 
             columns={[
                 { key: 'name', header: 'Service', cell: (row: ExternalApi) => (
                     <div>
                         <div className="font-medium">{row.name}</div>
                         <div className="text-xs text-muted-foreground">{row.provider}</div>
                     </div>
                 )},
                 { key: 'environment', header: 'Env', cell: (row: ExternalApi) => <Badge variant="outline" className="text-[10px]">{row.environment}</Badge> },
                 { key: 'endpoint', header: 'Endpoint', cell: (row: ExternalApi) => <code className="text-xs bg-muted px-1 rounded">{row.endpoint || 'Default'}</code> },
                 { key: 'status', header: 'Status', cell: (row: ExternalApi) => <Badge variant="outline" className={getStatusColor(row.status)}>{row.status}</Badge> },
                 { key: 'actions', header: '', className: 'text-right', cell: (row: ExternalApi) => (
                     <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="sm">Edit</Button>
                         <Button variant="ghost" size="sm" className="text-red-500">Remove</Button>
                     </div>
                 )},
             ]}
             data={apis}
          />
        </TabsContent>

        {/* 5. SYNC LOGS */}
        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sync Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">98.5%</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Imported</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,240</div>
                <p className="text-xs text-muted-foreground">Reservations this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">450ms</div>
                <p className="text-xs text-muted-foreground">Per sync operation</p>
              </CardContent>
            </Card>
          </div>

          <DataTable 
             columns={[
                 { key: 'timestamp', header: 'Time', cell: (row: SyncLog) => new Date(row.timestamp).toLocaleString() },
                 { key: 'platform', header: 'Platform' },
                 { key: 'status', header: 'Status', cell: (row: SyncLog) => (
                     <div className="flex items-center gap-2">
                         {row.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                         <span className="capitalize text-sm">{row.status}</span>
                     </div>
                 )},
                 { key: 'imported', header: 'Imported' },
                 { key: 'latency', header: 'Latency', cell: (row: SyncLog) => `${row.latency}ms` },
             ]}
             data={logs}
          />
        </TabsContent>

        {/* 6. AUTOMATION */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Automation Rules</CardTitle>
              <CardDescription>Configure automatic actions when sync events occur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: 'New Reservation Notification', desc: 'Send email when a new booking is imported', icon: MessageSquare },
                { title: 'Auto-Block Dates', desc: 'Automatically block calendar dates when external booking is confirmed', icon: Calendar },
                { title: 'Sync Error Alert', desc: 'Notify admin immediately if channel sync fails', icon: AlertTriangle },
              ].map((rule, i) => (
                <div key={i} className="flex items-center justify-between border p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-md">
                      <rule.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{rule.title}</h4>
                      <p className="text-xs text-muted-foreground">{rule.desc}</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
