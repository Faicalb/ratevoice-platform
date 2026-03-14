'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminWalletApi, AdminFinancialLog, PaymentSetting, PaymentProviderKey, WalletTransaction } from '@/lib/api/admin/wallet';
import { RefreshCw, Search, Wallet, AlertTriangle, ArrowUpRight, ArrowDownRight, ShieldCheck, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export default function WalletControlPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustment, setAdjustment] = useState({ userId: '', amount: '', reason: '' });

  const [stats, setStats] = useState({ totalVolume: 0, pendingAmount: 0, flaggedCount: 0 });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [logs, setLogs] = useState<AdminFinancialLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        adminWalletApi.getTransactions(),
        adminWalletApi.getStats()
      ]);
      setTransactions(data);
      setStats(statsData);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    setSettingsLoading(true);
    try {
      const settings = await adminWalletApi.getPaymentSettings();
      setPaymentSettings(settings);
    } catch (error) {
      toast.error('Failed to load payment settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await adminWalletApi.getFinancialLogs();
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchTransactions(), fetchPaymentSettings(), fetchLogs()]);
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminWalletApi.updateTransactionStatus(id, status);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
      toast.success(`Transaction ${status}`);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const handleAdjustBalance = async () => {
    if (!adjustment.userId || !adjustment.amount) return;
    try {
      await adminWalletApi.adjustBalance(adjustment.userId, Number(adjustment.amount), adjustment.reason);
      toast.success("Balance adjusted successfully");
      setAdjustOpen(false);
      setAdjustment({ userId: '', amount: '', reason: '' });
      fetchTransactions();
    } catch (error) {
      toast.error("Adjustment failed");
    }
  };

  const filteredData = transactions.filter(t => 
    t.user.toLowerCase().includes(filter.toLowerCase()) || 
    t.id.toLowerCase().includes(filter.toLowerCase())
  );

  const getSetting = (provider: PaymentProviderKey): PaymentSetting => {
    const found = paymentSettings.find((s) => s.provider === provider);
    return (
      found || {
        provider,
        enabled: false,
        priority: 100,
        config: {}
      }
    );
  };

  const updateSetting = (provider: PaymentProviderKey, patch: Partial<PaymentSetting>) => {
    setPaymentSettings((prev) => {
      const current = prev.find((s) => s.provider === provider);
      const next = { ...(current || { provider, enabled: false, priority: 100, config: {} }), ...patch } as PaymentSetting;
      const without = prev.filter((s) => s.provider !== provider);
      return [...without, next].sort((a, b) => a.priority - b.priority);
    });
  };

  const saveSettings = async () => {
    try {
      await adminWalletApi.savePaymentSettings(
        paymentSettings.map((s) => ({
          provider: s.provider,
          enabled: s.enabled,
          priority: Number(s.priority || 100),
          config: s.config || {}
        }))
      );
      toast.success('Payment settings saved');
      fetchPaymentSettings();
    } catch (error) {
      toast.error('Failed to save payment settings');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Wallet Control</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Monitor system-wide wallet transactions and balances.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={() => Promise.all([fetchTransactions(), fetchPaymentSettings(), fetchLogs()])} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
              <DialogTrigger className={buttonVariants({ size: "sm", className: "h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90" })}>
                  <Wallet className="h-3.5 w-3.5 mr-2" /> Adjust Balance
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Manual Balance Adjustment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <div className="space-y-2">
                          <Label>User ID / Email</Label>
                          <Input 
                              value={adjustment.userId}
                              onChange={(e) => setAdjustment({...adjustment, userId: e.target.value})}
                              placeholder="user@example.com"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Amount (+/-)</Label>
                          <Input 
                              type="number"
                              value={adjustment.amount}
                              onChange={(e) => setAdjustment({...adjustment, amount: e.target.value})}
                              placeholder="100.00"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Reason</Label>
                          <Textarea 
                              value={adjustment.reason}
                              onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
                              placeholder="Refund / Bonus / Correction"
                          />
                      </div>
                      <Button onClick={handleAdjustBalance} className="w-full">Confirm Adjustment</Button>
                  </div>
              </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="providers">Payment Providers</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/50 shadow-sm bg-muted/20">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-black">${stats.totalVolume.toLocaleString()}</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-emerald-500/20" />
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm bg-muted/20">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending</p>
                  <p className="text-2xl font-black text-amber-500">${stats.pendingAmount.toLocaleString()}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-amber-500/20" />
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm bg-muted/20">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Flagged Risk</p>
                  <p className="text-2xl font-black text-rose-500">{stats.flaggedCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-rose-500/20" />
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 h-10"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              title="Wallet Transactions"
              description="System-wide wallet activity with risk monitoring."
              data={filteredData}
              columns={[
                { key: 'id', header: 'ID', className: 'font-mono text-xs' },
                { key: 'user', header: 'User', className: 'font-medium' },
                { key: 'type', header: 'Type', cell: (row: WalletTransaction) => <Badge variant="outline" className="uppercase text-[9px] tracking-widest">{row.type}</Badge> },
                { key: 'provider', header: 'Provider', cell: (row: WalletTransaction) => <Badge variant="secondary" className="uppercase text-[9px] tracking-widest">{(row.provider || '—').toString()}</Badge> },
                { key: 'amount', header: 'Amount', cell: (row: WalletTransaction) => <span className="font-mono font-bold">${(row.amount || 0).toFixed(2)}</span> },
                {
                  key: 'riskScore',
                  header: 'Risk',
                  cell: (row: WalletTransaction) => {
                    const score = row.riskScore || 0;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`${score > 70 ? 'bg-rose-500' : score > 30 ? 'bg-amber-500' : 'bg-emerald-500'} h-full`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono">{score}</span>
                      </div>
                    );
                  }
                },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (row: WalletTransaction) => (
                    <Badge
                      variant={
                        row.status === 'COMPLETED' ? 'default' : row.status === 'FLAGGED' || row.status === 'FAILED' ? 'destructive' : 'secondary'
                      }
                      className="uppercase text-[9px] tracking-widest"
                    >
                      {row.status}
                    </Badge>
                  )
                },
                {
                  key: 'actions',
                  header: '',
                  className: 'w-[50px]',
                  cell: (row: WalletTransaction) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(row.status === 'PENDING' || row.status === 'FLAGGED') && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'COMPLETED')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'FAILED')}>
                                <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {row.status !== 'FLAGGED' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'FLAGGED')}>
                              <ShieldCheck className="mr-2 h-4 w-4 text-amber-500" /> Flag
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }
              ]}
            />
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Provider Configuration</h2>
              <p className="text-sm text-muted-foreground">All credentials are stored in the database and can be prioritized.</p>
            </div>
            <Button onClick={saveSettings} disabled={settingsLoading}>
              Save Settings
            </Button>
          </div>

          {settingsLoading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {(['STRIPE', 'PAYPAL', 'CMI', 'BANK_TRANSFER'] as PaymentProviderKey[]).map((provider) => {
                const setting = getSetting(provider);
                return (
                  <Card key={provider} className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{provider}</span>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-muted-foreground">Enabled</div>
                          <Switch checked={setting.enabled} onCheckedChange={(v) => updateSetting(provider, { enabled: !!v })} />
                        </div>
                      </CardTitle>
                      <CardDescription>Priority determines fallback order (lower runs first).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Input
                          type="number"
                          value={String(setting.priority ?? 100)}
                          onChange={(e) => updateSetting(provider, { priority: Number(e.target.value || 100) })}
                        />
                      </div>

                      {provider === 'STRIPE' && (
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <Label>Publishable Key</Label>
                            <Input value={setting.config.publishableKey || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, publishableKey: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <Input type="password" value={setting.config.secretKey || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, secretKey: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Webhook Secret</Label>
                            <Input type="password" value={setting.config.webhookSecret || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, webhookSecret: e.target.value } })} />
                          </div>
                        </div>
                      )}

                      {provider === 'PAYPAL' && (
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <Label>Client ID</Label>
                            <Input value={setting.config.clientId || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, clientId: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Secret</Label>
                            <Input type="password" value={setting.config.secret || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, secret: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Mode (sandbox/live)</Label>
                            <Input value={setting.config.mode || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, mode: e.target.value } })} />
                          </div>
                        </div>
                      )}

                      {provider === 'CMI' && (
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <Label>Gateway URL</Label>
                            <Input value={setting.config.gatewayUrl || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, gatewayUrl: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>ClientId</Label>
                            <Input value={setting.config.clientId || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, clientId: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>StoreKey</Label>
                            <Input type="password" value={setting.config.storeKey || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, storeKey: e.target.value } })} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Currency</Label>
                              <Input value={setting.config.currency || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, currency: e.target.value } })} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Success URL</Label>
                            <Input value={setting.config.successUrl || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, successUrl: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Fail URL</Label>
                            <Input value={setting.config.failUrl || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, failUrl: e.target.value } })} />
                          </div>
                        </div>
                      )}

                      {provider === 'BANK_TRANSFER' && (
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input value={setting.config.bankName || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, bankName: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Account Holder</Label>
                            <Input value={setting.config.accountHolder || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, accountHolder: e.target.value } })} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>IBAN</Label>
                              <Input value={setting.config.iban || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, iban: e.target.value } })} />
                            </div>
                            <div className="space-y-2">
                              <Label>SWIFT</Label>
                              <Input value={setting.config.swift || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, swift: e.target.value } })} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Textarea value={setting.config.instructions || ''} onChange={(e) => updateSetting(provider, { config: { ...setting.config, instructions: e.target.value } })} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Admin Financial Audit</h2>
              <p className="text-sm text-muted-foreground">All admin actions that affect wallets are recorded here.</p>
            </div>
            <Button variant="outline" onClick={fetchLogs} disabled={logsLoading}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Logs
            </Button>
          </div>

          <DataTable
            title="Audit Logs"
            description="Administrative financial actions."
            isLoading={logsLoading}
            data={logs}
            columns={[
              { key: 'createdAt', header: 'Date', cell: (row: AdminFinancialLog) => new Date(row.createdAt).toLocaleString() },
              { key: 'adminId', header: 'Admin ID', cell: (row: AdminFinancialLog) => <span className="font-mono text-xs">{row.adminId}</span> },
              { key: 'actionType', header: 'Action', cell: (row: AdminFinancialLog) => <Badge variant="outline" className="uppercase text-[9px] tracking-widest">{row.actionType}</Badge> },
              { key: 'targetUserId', header: 'Target User', cell: (row: AdminFinancialLog) => <span className="font-mono text-xs">{row.targetUserId || '—'}</span> },
              { key: 'amount', header: 'Amount', cell: (row: AdminFinancialLog) => <span className="font-mono text-xs">{row.amount == null ? '—' : row.amount.toFixed(2)}</span> },
              { key: 'currency', header: 'Currency', cell: (row: AdminFinancialLog) => row.currency || '—' },
              { key: 'transactionId', header: 'Transaction', cell: (row: AdminFinancialLog) => <span className="font-mono text-xs">{row.transactionId || '—'}</span> }
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
