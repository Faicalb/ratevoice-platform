'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAmbassadorApi, Ambassador } from '@/lib/api/admin/ambassadors';
import { 
  RefreshCw, Search, Flag, DollarSign, Users, MoreHorizontal, CheckCircle2, XCircle, 
  Briefcase, Plus, Star, MapPin, Shield, TrendingUp, AlertTriangle, MessageSquare, Download,
  Wallet, Trophy, Globe, Filter, Eye, AlertOctagon, Activity
} from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// New Components
import { AddAmbassadorModal } from '@/components/admin/ambassador/add-ambassador-modal';
import { AmbassadorProfileSheet } from '@/components/admin/ambassador/ambassador-profile-sheet';

export default function AmbassadorManagementPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [viewAmbassador, setViewAmbassador] = useState<Ambassador | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newServices, setNewServices] = useState('');

  const fetchAmbassadors = async () => {
    setIsLoading(true);
    try {
      const data = await adminAmbassadorApi.getAmbassadors();
      setAmbassadors(data.sort((a, b) => (b.earnings || 0) - (a.earnings || 0)));
    } catch (error) {
      toast.error("Failed to load ambassadors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const handleStatusChange = async (id: string, status: 'active' | 'pending' | 'suspended') => {
    try {
      await adminAmbassadorApi.updateStatus(id, status);
      setAmbassadors(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (viewAmbassador?.id === id) {
        setViewAmbassador(prev => prev ? { ...prev, status } : null);
      }
      toast.success(`Ambassador status updated to ${status}`);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const handleServiceUpdate = async () => {
    if (!selectedAmbassador) return;
    const servicesList = newServices.split(',').map(s => s.trim()).filter(s => s);
    try {
      await adminAmbassadorApi.updateServices(selectedAmbassador.id, servicesList);
      setAmbassadors(prev => prev.map(a => a.id === selectedAmbassador.id ? { ...a, services: servicesList } : a));
      if (viewAmbassador?.id === selectedAmbassador.id) {
        setViewAmbassador(prev => prev ? { ...prev, services: servicesList } : null);
      }
      toast.success("Services updated");
      setSelectedAmbassador(null);
    } catch (error) {
      toast.error("Failed to update services");
    }
  };

  const filteredData = ambassadors.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(filter.toLowerCase()) || 
                          a.email.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = ambassadors.filter(a => a.status === 'active').length;
  const pendingCount = ambassadors.filter(a => a.status === 'pending').length;
  const totalEarnings = ambassadors.reduce((acc, curr) => acc + (curr.earnings || 0), 0);
  const totalReferrals = ambassadors.reduce((acc, curr) => acc + (curr.referrals || 0), 0);

  const earningsData = [
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 19000 },
    { month: 'Mar', value: 15000 },
    { month: 'Apr', value: 22000 },
    { month: 'May', value: 28000 },
    { month: 'Jun', value: 35000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Ambassador Control Center</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manage global ambassadors, track earnings, and monitor performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <AddAmbassadorModal onSuccess={fetchAmbassadors} />
           <Button variant="outline" size="sm" onClick={fetchAmbassadors} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <StatsCard title="Total Ambassadors" value={ambassadors.length} icon={Users} description="Registered partners" />
         <StatsCard title="Total Earnings" value={`$${totalEarnings.toLocaleString()}`} icon={Wallet} description="Platform payouts" />
         <StatsCard title="High Risk Accounts" value={ambassadors.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length} icon={AlertOctagon} description="Requires attention" />
         <StatsCard title="Active Services" value="1,240" icon={Briefcase} description="Services offered" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         {/* Earnings Chart */}
         <Card className="md:col-span-2 border-border/50 shadow-lg">
            <CardHeader>
               <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Earnings Growth
               </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsData}>
                     <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                     <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                     />
                     <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>

         {/* Top Performers */}
         <Card className="border-border/50 shadow-lg">
             <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                     <Trophy className="h-4 w-4 text-amber-500" /> Top Ambassadors
                 </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                 {ambassadors.slice(0, 3).map((amb, i) => (
                     <div key={amb.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                         <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                             {i + 1}
                         </div>
                         <Avatar className="h-8 w-8">
                             <AvatarFallback>{amb.name.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 min-w-0">
                             <p className="text-xs font-bold truncate">{amb.name}</p>
                             <p className="text-[10px] text-muted-foreground">${(amb.earnings || 0).toLocaleString()}</p>
                         </div>
                         <Badge variant="secondary" className="text-[9px] h-5">{amb.level}</Badge>
                         <Badge variant="outline" className={cn("text-[9px] h-5 ml-2", 
                             amb.riskLevel === 'CRITICAL' && "bg-red-500/10 text-red-500 border-red-500/20",
                             amb.riskLevel === 'SAFE' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                         )}>
                             {amb.riskScore || 0}
                         </Badge>
                     </div>
                 ))}
             </CardContent>
         </Card>
      </div>

      <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search ambassadors..." 
                  className="pl-9 h-10"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
              />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-10">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <Card className="border-border/50 shadow-lg">
         <CardContent className="p-0">
            <DataTable 
               title=""
               columns={[
                   { key: 'name', header: 'Ambassador', cell: (row: any) => (
                       <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                               <AvatarFallback>{row.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div>
                               <p className="font-bold text-sm">{row.name}</p>
                               <p className="text-[10px] text-muted-foreground">{row.email}</p>
                           </div>
                       </div>
                   )},
                   { key: 'referrals', header: 'Referrals', cell: (row: any) => (
                       <div className="flex items-center gap-2">
                           <Users className="h-3 w-3 text-muted-foreground" />
                           <span className="font-bold">{row.referrals}</span>
                       </div>
                   )},
                   { key: 'earnings', header: 'Earnings', cell: (row: any) => (
                       <div className="flex items-center gap-1 text-emerald-500 font-mono font-bold">
                           <DollarSign className="h-3 w-3" />
                           {(row.earnings || 0).toFixed(2)}
                       </div>
                   )},
                   { key: 'services', header: 'Services', cell: (row: any) => (
                       <div className="flex flex-wrap gap-1">
                           {row.services.slice(0, 2).map((s: string) => (
                               <Badge key={s} variant="secondary" className="text-[9px] uppercase tracking-widest">
                                   {s}
                               </Badge>
                           ))}
                           {row.services.length > 2 && <Badge variant="outline" className="text-[9px]">+{row.services.length - 2}</Badge>}
                       </div>
                   )},
                   { key: 'status', header: 'Status', cell: (row: any) => (
                       <Badge variant={
                           row.status === 'active' ? 'default' : 
                           row.status === 'pending' ? 'secondary' : 
                           row.status === 'suspended' ? 'destructive' : 'outline'
                       } className="uppercase text-[9px] tracking-widest">
                           {row.status}
                       </Badge>
                   )},
                   { key: 'level', header: 'Level', cell: (row: any) => (
                       <Badge variant="outline" className={cn("uppercase text-[9px] tracking-widest", 
                           row.level === 'global' ? "border-purple-500/50 text-purple-500 bg-purple-500/10" :
                           row.level === 'premium' ? "border-amber-500/50 text-amber-500 bg-amber-500/10" : ""
                       )}>
                           {row.level === 'global' && <Globe className="h-3 w-3 mr-1" />}
                           {row.level === 'premium' && <Star className="h-3 w-3 mr-1" />}
                           {row.level}
                       </Badge>
                   )},
                   { key: 'riskScore', header: 'Risk Score', cell: (row: any) => (
                       <Badge variant={
                         row.riskLevel === 'CRITICAL' ? 'destructive' :
                         row.riskLevel === 'HIGH' ? 'destructive' :
                         row.riskLevel === 'MEDIUM' ? 'secondary' : 'outline'
                       } className={cn("uppercase text-[9px] tracking-widest",
                         row.riskLevel === 'CRITICAL' && "animate-pulse bg-red-600",
                         row.riskLevel === 'HIGH' && "bg-orange-500 hover:bg-orange-600",
                         row.riskLevel === 'MEDIUM' && "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30",
                         row.riskLevel === 'SAFE' && "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                       )}>
                         {row.riskLevel || 'SAFE'} ({row.riskScore || 0})
                       </Badge>
                   )},
                   { key: 'actions', header: '', className: 'w-[50px]', cell: (row: any) => (
                       <DropdownMenu>
                           <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}>
                               <MoreHorizontal className="h-4 w-4" />
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                               <DropdownMenuGroup>
                                 <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={() => {
                                     setViewAmbassador(row);
                                     setIsProfileOpen(true);
                                 }}>
                                     <Eye className="mr-2 h-4 w-4" /> View Profile
                                 </DropdownMenuItem>
                                 {row.status !== 'active' && (
                                     <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'active')}>
                                         <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Activate
                                     </DropdownMenuItem>
                                 )}
                                 {row.status === 'active' && (
                                     <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'suspended')}>
                                         <XCircle className="mr-2 h-4 w-4 text-rose-500" /> Suspend
                                     </DropdownMenuItem>
                                 )}
                                 <DropdownMenuItem onClick={() => {
                                     setSelectedAmbassador(row);
                                     setNewServices(row.services.join(', '));
                                 }}>
                                     <Briefcase className="mr-2 h-4 w-4" /> Edit Services
                                 </DropdownMenuItem>
                               </DropdownMenuGroup>
                           </DropdownMenuContent>
                       </DropdownMenu>
                   )},
               ]}
               data={filteredData}
            />
         </CardContent>
      </Card>

      <Dialog open={!!selectedAmbassador} onOpenChange={(open) => !open && setSelectedAmbassador(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Services</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label>Services (comma separated)</Label>
                      <Textarea 
                          value={newServices}
                          onChange={(e) => setNewServices(e.target.value)}
                          placeholder="Onboarding, Support, Marketing..."
                      />
                  </div>
                  <Button onClick={handleServiceUpdate} className="w-full">Update Services</Button>
              </div>
          </DialogContent>
      </Dialog>

      <AmbassadorProfileSheet 
        ambassador={viewAmbassador} 
        open={isProfileOpen} 
        onOpenChange={setIsProfileOpen} 
      />
    </div>
  );
}
