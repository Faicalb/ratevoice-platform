'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ambassador, adminAmbassadorApi, WithdrawalRequest, AmbassadorActivityLog } from '@/lib/api/admin/ambassadors';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AmbassadorProfileSheetProps {
  ambassador: Ambassador | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AmbassadorProfileSheet({ ambassador, open, onOpenChange }: AmbassadorProfileSheetProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [logs, setLogs] = useState<AmbassadorActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (ambassador && open) {
      loadData();
    }
  }, [ambassador, open]);

  const loadData = async () => {
    if (!ambassador) return;
    try {
      const [wData, lData] = await Promise.all([
        adminAmbassadorApi.getWithdrawals(ambassador.id),
        adminAmbassadorApi.getLogs(ambassador.id)
      ]);
      setWithdrawals(wData);
      setLogs(lData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    if (!ambassador) return;
    try {
      await adminAmbassadorApi.approveWithdrawal(ambassador.id, id, `TX-${Date.now()}`);
      toast.success('Withdrawal Approved');
      loadData();
    } catch (e) {
      toast.error('Failed to approve');
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!ambassador) return;
    try {
      await adminAmbassadorApi.rejectWithdrawal(ambassador.id, id, 'Admin rejected');
      toast.success('Withdrawal Rejected');
      loadData();
    } catch (e) {
      toast.error('Failed to reject');
    }
  };

  if (!ambassador) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] w-full overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{ambassador.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl">{ambassador.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{ambassador.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{ambassador.level}</Badge>
                <Badge variant={ambassador.status === 'active' ? 'default' : 'secondary'}>
                  {ambassador.status}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Earnings</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">${ambassador.earnings.toFixed(2)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Wallet Balance</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-emerald-500">${ambassador.walletBalance.toFixed(2)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Referrals</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{ambassador.referrals}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Conversion Rate</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">4.2%</div></CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Phone:</div><div>{ambassador.phone || 'N/A'}</div>
                <div className="text-muted-foreground">Location:</div><div>{ambassador.city}, {ambassador.country}</div>
                <div className="text-muted-foreground">Joined:</div><div>{new Date(ambassador.joinedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {ambassador.services.map((service, i) => (
                  <Card key={i}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-bold">{service}</CardTitle>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {ambassador.services.length === 0 && <p className="text-center text-muted-foreground py-8">No services listed.</p>}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="finance" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" /> Withdrawal Requests
              </h3>
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-bold">${w.amount.toFixed(2)} via {w.method}</div>
                        <div className="text-xs text-muted-foreground">{new Date(w.requestedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {w.status === 'PENDING' ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleApproveWithdrawal(w.id)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => handleRejectWithdrawal(w.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant={w.status === 'APPROVED' ? 'default' : 'destructive'}>{w.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {withdrawals.length === 0 && <p className="text-center text-muted-foreground py-4">No withdrawals found.</p>}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                {logs.map((log) => (
                  <div key={log.id} className="relative pb-4">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary" />
                    <div className="text-sm font-medium">{log.action}</div>
                    <div className="text-xs text-muted-foreground">{log.details}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-center text-muted-foreground">No activity logs.</p>}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
