'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  Download, 
  RefreshCw, 
  Plus, 
  DollarSign,
  Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '@/lib/api/api';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { loadStripe } from '@stripe/stripe-js';
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';

type WalletTransactionRow = {
  id: string;
  createdAt: string;
  amount: string | number;
  currency: string;
  provider: string | null;
  status: string;
  referenceId: string | null;
  providerRefId: string | null;
  type: string;
};

type WalletResponse = {
  id: string;
  userId: string;
  balance: string | number;
  currency: string;
  transactions: WalletTransactionRow[];
  points?: number;
};

type PaymentOptions = {
  card: { enabled: boolean; providers: string[] };
  bankTransfer: { enabled: boolean; bankName?: string; accountHolder?: string; iban?: string; swift?: string; instructions?: string };
};

type DepositInitResponse =
  | { transactionId: string; provider: 'STRIPE'; providerRefId: string; clientSecret: string; publishableKey: string; currency: string }
  | { transactionId: string; provider: 'PAYPAL'; providerRefId: string; approvalUrl: string; currency: string }
  | { transactionId: string; provider: 'CMI'; providerRefId: string; gatewayUrl: string; formFields: Record<string, string>; currency: string };

const toNumber = (v: any) => (typeof v === 'number' ? v : Number(v || 0));
const formatMoney = (currency: string, amount: number) => `${currency} ${amount.toFixed(2)}`;
const formatStatus = (s: string) => (s || '').toLowerCase();
const formatProvider = (p: string | null) => (p || '—').toUpperCase();
const formatType = (t: string) => (t || '').replace(/_/g, ' ').toLowerCase();

function StripeCheckoutForm({
  clientSecret,
  onSuccess,
  disabled
}: {
  clientSecret: string;
  onSuccess: () => void;
  disabled: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardNumberElement);
    if (!card) return;

    setSubmitting(true);
    try {
      const res = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name: cardholderName || undefined }
        }
      });

      if (res.error) {
        toast.error(res.error.message || 'Payment failed');
        return;
      }

      if (res.paymentIntent?.status === 'succeeded' || res.paymentIntent?.status === 'processing') {
        toast.success('Payment submitted');
        onSuccess();
        return;
      }

      toast.error('Payment not completed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="font-medium">Checkout</div>
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Cardholder Name</Label>
          <Input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="Name on card" />
        </div>
        <div className="space-y-2">
          <Label>Card Number</Label>
          <div className="h-10 rounded-md border bg-background px-3 flex items-center">
            <CardNumberElement options={{ style: { base: { fontSize: '14px' } } }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <div className="h-10 rounded-md border bg-background px-3 flex items-center">
              <CardExpiryElement options={{ style: { base: { fontSize: '14px' } } }} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>CVV</Label>
            <div className="h-10 rounded-md border bg-background px-3 flex items-center">
              <CardCvcElement options={{ style: { base: { fontSize: '14px' } } }} />
            </div>
          </div>
        </div>
        <Button onClick={confirm} disabled={disabled || submitting || !stripe || !elements}>
          {submitting ? 'Confirming...' : 'Pay'}
        </Button>
      </div>
    </div>
  );
}

export default function WalletSettingsPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [history, setHistory] = useState<WalletTransactionRow[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'BANK_TRANSFER'>('CARD');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [depositInit, setDepositInit] = useState<DepositInitResponse | null>(null);
  const [bankTransferTxId, setBankTransferTxId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const [walletRes, historyRes, optionsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/history'),
        api.get('/wallet/payment-options')
      ]);
      setWallet(walletRes.data);
      setHistory(historyRes.data || []);
      setPaymentOptions(optionsRes.data);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paypal = params.get('paypal');
    const orderId = params.get('token');
    const tx = params.get('tx');
    if (paypal === 'success' && orderId && tx) {
      api
        .post('/wallet/paypal/capture', { walletTransactionId: tx, orderId })
        .then(() => {
          toast.success('Payment confirmed');
          fetchData();
        })
        .catch(() => toast.error('Unable to confirm PayPal payment'));
    }
  }, []);

  const handleDeposit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    setDepositInit(null);
    setBankTransferTxId(null);
    setProofFile(null);

    try {
      if (selectedMethod === 'BANK_TRANSFER') {
        const res = await api.post('/wallet/deposit/bank-transfer', { amount: amt });
        setBankTransferTxId(res.data.transactionId);
        toast.success('Bank transfer request created');
        fetchData();
        return;
      }

      const res = await api.post('/wallet/deposit', { amount: amt });
      const init = res.data as DepositInitResponse;
      setDepositInit(init);
      if (init.provider === 'PAYPAL') {
        window.location.href = init.approvalUrl;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Deposit failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadProof = async () => {
    if (!bankTransferTxId || !proofFile) {
      toast.error('Please select a file');
      return;
    }

    setProcessing(true);
    try {
      const form = new FormData();
      form.append('file', proofFile);
      await api.post(`/wallet/deposit/bank-transfer/${encodeURIComponent(bankTransferTxId)}/proof`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Proof uploaded');
      setIsDepositOpen(false);
      setAmount('');
      setDepositInit(null);
      setBankTransferTxId(null);
      setProofFile(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Upload failed');
    } finally {
      setProcessing(false);
    }
  };

  const transactions = history || [];
  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map(t => ({
      name: new Date(t.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
      amount: toNumber(t.amount),
      type: t.type
    }));

  if (loading) {
    return <div className="flex justify-center p-8"><RefreshCw className="animate-spin" /></div>;
  }

  const currency = wallet?.currency || 'USD';
  const balance = toNumber(wallet?.balance);
  const completedCredits = transactions.filter((t) => t.status === 'COMPLETED' && toNumber(t.amount) > 0).reduce((sum, t) => sum + toNumber(t.amount), 0);
  const completedDebits = transactions.filter((t) => t.status === 'COMPLETED' && toNumber(t.amount) < 0).reduce((sum, t) => sum + Math.abs(toNumber(t.amount)), 0);
  const pendingBalance = transactions.filter((t) => t.status === 'PENDING' || t.status === 'PROCESSING').reduce((sum, t) => sum + Math.max(0, toNumber(t.amount)), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Wallet & Payouts</h2>
          <p className="text-muted-foreground">Monitor balance, transactions, and payment methods.</p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isDepositOpen}
            onOpenChange={(open) => {
              setIsDepositOpen(open);
              if (!open) {
                setDepositInit(null);
                setBankTransferTxId(null);
                setProofFile(null);
                setAmount('');
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Funds to Wallet</DialogTitle>
                <DialogDescription>Select payment method and amount.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as any)} className="grid gap-3">
                    <div className="flex items-center gap-3 rounded-md border p-3">
                      <RadioGroupItem value="CARD" id="pay-card" />
                      <Label htmlFor="pay-card" className="flex-1 cursor-pointer">
                        <div className="font-medium">Pay with Card</div>
                        <div className="text-xs text-muted-foreground">Visa, Mastercard, American Express, Discover</div>
                      </Label>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3 rounded-md border p-3">
                      <RadioGroupItem value="BANK_TRANSFER" id="pay-bank" />
                      <Label htmlFor="pay-bank" className="flex-1 cursor-pointer">
                        <div className="font-medium">Bank Transfer</div>
                        <div className="text-xs text-muted-foreground">Upload transfer proof for admin validation</div>
                      </Label>
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Amount ({currency})</Label>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {selectedMethod === 'CARD' && (
                  <div className="space-y-2">
                    <Label>Accepted Cards</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Visa', 'Mastercard', 'American Express', 'Discover'].map((b) => (
                        <Badge key={b} variant="secondary">
                          {b}
                        </Badge>
                      ))}
                      <Badge variant="outline">Apple Pay</Badge>
                      <Badge variant="outline">Google Pay</Badge>
                    </div>
                    {!paymentOptions?.card?.enabled && (
                      <div className="text-sm text-destructive">Card payments are currently unavailable.</div>
                    )}
                  </div>
                )}

                {selectedMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-3 rounded-md border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">Bank Transfer Details</div>
                      <Badge variant={paymentOptions?.bankTransfer?.enabled ? 'default' : 'secondary'}>
                        {paymentOptions?.bankTransfer?.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    {paymentOptions?.bankTransfer?.enabled ? (
                      <div className="text-sm space-y-2">
                        <div className="grid grid-cols-1 gap-1">
                          <div><span className="text-muted-foreground">Bank:</span> {paymentOptions.bankTransfer.bankName}</div>
                          <div><span className="text-muted-foreground">Account Holder:</span> {paymentOptions.bankTransfer.accountHolder}</div>
                          <div><span className="text-muted-foreground">IBAN:</span> {paymentOptions.bankTransfer.iban}</div>
                          <div><span className="text-muted-foreground">SWIFT:</span> {paymentOptions.bankTransfer.swift}</div>
                        </div>
                        {paymentOptions.bankTransfer.instructions && (
                          <div className="text-muted-foreground">{paymentOptions.bankTransfer.instructions}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Bank transfer is not available.</div>
                    )}

                    {bankTransferTxId && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Transaction ID:</span> {bankTransferTxId}
                        </div>
                        <div className="space-y-2">
                          <Label>Upload Proof</Label>
                          <Input type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                          <Button onClick={handleUploadProof} disabled={processing || !proofFile} className="w-full">
                            {processing ? 'Uploading...' : 'Upload Proof'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === 'CARD' && depositInit?.provider === 'STRIPE' && (
                  <Elements
                    stripe={loadStripe(depositInit.publishableKey)}
                    options={{ clientSecret: depositInit.clientSecret, appearance: { theme: 'stripe' } as any }}
                  >
                    <StripeCheckoutForm
                      clientSecret={depositInit.clientSecret}
                      disabled={processing}
                      onSuccess={() => {
                        setIsDepositOpen(false);
                        setDepositInit(null);
                        setAmount('');
                        fetchData();
                      }}
                    />
                  </Elements>
                )}

                {selectedMethod === 'CARD' && depositInit?.provider === 'CMI' && (
                  <div className="space-y-3 rounded-md border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">Continue to Payment</div>
                      <Badge variant="secondary">CMI</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      You will be redirected to the secure payment gateway.
                    </div>
                    <form method="POST" action={depositInit.gatewayUrl}>
                      {Object.entries(depositInit.formFields || {}).map(([k, v]) => (
                        <input key={k} type="hidden" name={k} value={v} />
                      ))}
                      <Button type="submit" className="w-full">
                        Continue
                      </Button>
                    </form>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDepositOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleDeposit}
                  disabled={
                    processing ||
                    !!depositInit ||
                    (selectedMethod === 'CARD' && !paymentOptions?.card?.enabled) ||
                    (selectedMethod === 'BANK_TRANSFER' && !paymentOptions?.bankTransfer?.enabled)
                  }
                >
                  {processing ? 'Processing...' : selectedMethod === 'BANK_TRANSFER' ? 'Create Transfer' : 'Continue'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>Transfer earnings to your bank account.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (Available: {formatMoney(currency, balance)})</Label>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
                <Button disabled>
                  Request Payout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Wallet Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(currency, balance)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-amber-500 font-medium mr-1">{formatMoney(currency, pendingBalance)}</span> pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(currency, completedCredits)}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed deposits and credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(currency, completedDebits)}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed payments and debits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Options</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant={paymentOptions?.card?.enabled ? 'default' : 'secondary'}>Pay with Card</Badge>
              <Badge variant={paymentOptions?.bankTransfer?.enabled ? 'default' : 'secondary'}>Bank Transfer</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Analytics Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cash Flow Analytics</CardTitle>
            <CardDescription>Recent transaction activity.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Configured methods for funding your wallet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <div className="font-medium">Pay with Card</div>
                  <div className="text-xs text-muted-foreground">Provider is auto-selected by priority</div>
                </div>
                <Badge variant={paymentOptions?.card?.enabled ? 'default' : 'secondary'}>
                  {paymentOptions?.card?.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <div className="font-medium">Bank Transfer</div>
                  <div className="text-xs text-muted-foreground">Requires admin validation</div>
                </div>
                <Badge variant={paymentOptions?.bankTransfer?.enabled ? 'default' : 'secondary'}>
                  {paymentOptions?.bankTransfer?.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="space-y-4">
          <DataTable
            title="Transaction History"
            description="Every wallet movement is recorded."
            data={transactions.map((t) => ({ ...t, id: t.id }))}
            columns={[
              { key: 'id', header: 'Transaction ID', cell: (row: WalletTransactionRow) => <span className="font-mono text-xs">{row.id}</span> },
              { key: 'createdAt', header: 'Date', cell: (row: WalletTransactionRow) => new Date(row.createdAt).toLocaleString() },
              { key: 'type', header: 'Type', cell: (row: WalletTransactionRow) => <Badge variant="outline">{formatType(row.type)}</Badge> },
              {
                key: 'amount',
                header: 'Amount',
                cell: (row: WalletTransactionRow) => {
                  const amt = toNumber(row.amount);
                  return (
                    <span className={`font-bold ${amt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {amt >= 0 ? '+' : '-'} {formatMoney(row.currency, Math.abs(amt))}
                    </span>
                  );
                }
              },
              { key: 'currency', header: 'Currency' },
              { key: 'provider', header: 'Provider', cell: (row: WalletTransactionRow) => formatProvider(row.provider) },
              { key: 'status', header: 'Status', cell: (row: WalletTransactionRow) => <Badge variant={formatStatus(row.status) === 'completed' ? 'default' : formatStatus(row.status) === 'pending' || formatStatus(row.status) === 'processing' ? 'secondary' : 'destructive'}>{formatStatus(row.status)}</Badge> },
              {
                key: 'providerRefId',
                header: 'Reference ID',
                cell: (row: WalletTransactionRow) => (
                  <span className="font-mono text-xs">{row.providerRefId || row.referenceId || '—'}</span>
                )
              }
            ]}
          />
        </TabsContent>
        <TabsContent value="deposits" className="space-y-4">
          <DataTable
            title="Deposits"
            description="Wallet deposits and top-ups."
            data={transactions.filter((t) => t.type === 'DEPOSIT')}
            columns={[
              { key: 'id', header: 'Transaction ID', cell: (row: WalletTransactionRow) => <span className="font-mono text-xs">{row.id}</span> },
              { key: 'createdAt', header: 'Date', cell: (row: WalletTransactionRow) => new Date(row.createdAt).toLocaleString() },
              { key: 'type', header: 'Type', cell: (row: WalletTransactionRow) => <Badge variant="outline">{formatType(row.type)}</Badge> },
              { key: 'provider', header: 'Provider', cell: (row: WalletTransactionRow) => formatProvider(row.provider) },
              { key: 'providerRefId', header: 'Provider Ref', cell: (row: WalletTransactionRow) => <span className="font-mono text-xs">{row.providerRefId || '—'}</span> },
              {
                key: 'amount',
                header: 'Amount',
                cell: (row: WalletTransactionRow) => <span className="font-bold text-emerald-500">+ {formatMoney(row.currency, Math.abs(toNumber(row.amount)))}</span>
              },
              { key: 'status', header: 'Status', cell: (row: WalletTransactionRow) => <Badge variant={formatStatus(row.status) === 'completed' ? 'default' : 'secondary'}>{formatStatus(row.status)}</Badge> }
            ]}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <DataTable
            title="Payments"
            description="Wallet payments, refunds, and adjustments."
            data={transactions.filter((t) => t.type !== 'DEPOSIT')}
            columns={[
              { key: 'id', header: 'Transaction ID', cell: (row: WalletTransactionRow) => <span className="font-mono text-xs">{row.id}</span> },
              { key: 'createdAt', header: 'Date', cell: (row: WalletTransactionRow) => new Date(row.createdAt).toLocaleString() },
              { key: 'type', header: 'Type', cell: (row: WalletTransactionRow) => <Badge variant="outline">{formatType(row.type)}</Badge> },
              {
                key: 'amount',
                header: 'Amount',
                cell: (row: WalletTransactionRow) => {
                  const amt = toNumber(row.amount);
                  return (
                    <span className={`font-bold ${amt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {amt >= 0 ? '+' : '-'} {formatMoney(row.currency, Math.abs(amt))}
                    </span>
                  );
                }
              },
              { key: 'provider', header: 'Provider', cell: (row: WalletTransactionRow) => formatProvider(row.provider) },
              { key: 'status', header: 'Status', cell: (row: WalletTransactionRow) => <Badge variant={formatStatus(row.status) === 'completed' ? 'default' : 'secondary'}>{formatStatus(row.status)}</Badge> },
              { key: 'referenceId', header: 'Reference ID', cell: (row: WalletTransactionRow) => <span className="font-mono text-xs">{row.referenceId || '—'}</span> }
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
