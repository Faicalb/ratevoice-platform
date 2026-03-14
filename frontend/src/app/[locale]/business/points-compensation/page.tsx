'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { walletApi, WalletData } from '@/lib/api/wallet';
import { RefreshCw, Wallet, Gift, ArrowUpRight, ArrowDownRight, History, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function PointsCompensationPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Form state
  const [customerId, setCustomerId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await walletApi.getWalletData();
      setData(result);
    } catch (error) {
      toast.error("Failed to load wallet data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompensate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !points || !reason) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      await walletApi.compensate(customerId, Number(points), reason);
      toast.success(`Successfully sent ${points} points to customer`);
      setCustomerId('');
      setPoints('');
      setReason('');
      fetchData(); // Refresh balance
    } catch (error) {
      toast.error("Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Points & Compensation</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manage loyalty points and customer compensation.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-border/50 shadow-lg bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" />
                Current Balance
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0">
                Active
            </Badge>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-black tracking-tight mb-1">
                ${data?.balance.toFixed(2)}
             </div>
             <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="text-amber-500 font-bold">${data?.pendingBalance.toFixed(2)}</span> pending
             </p>
             <div className="mt-6 flex gap-3">
                <Button className="w-full h-9 text-xs uppercase font-bold tracking-widest bg-emerald-600 hover:bg-emerald-700">
                    Add Funds
                </Button>
             </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50 shadow-lg">
           <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 <Gift className="h-4 w-4 text-primary" />
                 Send Compensation
              </CardTitle>
              <CardDescription className="text-xs">
                 Instantly reward customers to resolve issues or build loyalty.
              </CardDescription>
           </CardHeader>
           <CardContent>
              <form onSubmit={handleCompensate} className="flex flex-col md:flex-row gap-4 items-end">
                 <div className="space-y-2 flex-1 w-full">
                    <Label htmlFor="customer" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer ID / Email</Label>
                    <Input 
                        id="customer" 
                        placeholder="e.g. customer@email.com" 
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2 w-full md:w-32">
                    <Label htmlFor="points" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Points Amount</Label>
                    <Input 
                        id="points" 
                        type="number" 
                        placeholder="100" 
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2 flex-1 w-full">
                    <Label htmlFor="reason" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reason</Label>
                    <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="service_issue">Service Issue</SelectItem>
                            <SelectItem value="long_wait">Long Wait Time</SelectItem>
                            <SelectItem value="loyalty_bonus">Loyalty Bonus</SelectItem>
                            <SelectItem value="special_occasion">Special Occasion</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <Button type="submit" disabled={isSending} className="w-full md:w-auto h-10 uppercase font-bold tracking-widest text-xs min-w-[100px]">
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                 </Button>
              </form>
           </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
         <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Transaction History</h3>
         </div>
         
         <DataTable 
            title="Recent Transactions"
            columns={[
                { key: 'date', header: 'Date', cell: (row: any) => new Date(row.date).toLocaleDateString() },
                { key: 'description', header: 'Description' },
                { key: 'recipient', header: 'Recipient', cell: (row: any) => row.recipient || '-' },
                { key: 'amount', header: 'Amount', cell: (row: any) => (
                    <span className={`font-bold ${row.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {row.type === 'credit' ? '+' : '-'}${row.amount}
                    </span>
                )},
                { key: 'status', header: 'Status', cell: (row: any) => (
                    <Badge variant={row.status === 'completed' ? 'outline' : 'secondary'} className="uppercase text-[10px]">
                        {row.status}
                    </Badge>
                )},
            ]}
            data={data?.history || []}
         />
      </div>
    </div>
  );
}
