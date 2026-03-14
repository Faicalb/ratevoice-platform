'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminEliteApi, EliteMember } from '@/lib/api/admin/elite';
import { RefreshCw, Search, Crown, DollarSign, Star, MoreHorizontal, ArrowUpCircle, Ban, CheckCircle2 } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function EliteLevelManagementPage() {
  const [members, setMembers] = useState<EliteMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const data = await adminEliteApi.getMembers();
      setMembers(data);
    } catch (error) {
      toast.error("Failed to load elite members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleLevelChange = async (id: string, level: string) => {
    try {
      await adminEliteApi.updateLevel(id, level);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, level: level as any } : m));
      toast.success(`Member upgraded to ${level}`);
    } catch (error) {
      toast.error("Level update failed");
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
    try {
      await adminEliteApi.updateStatus(id, status);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m));
      toast.success(`Member ${status}`);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const filteredData = members.filter(m => 
    m.name.toLowerCase().includes(filter.toLowerCase()) || 
    m.email.toLowerCase().includes(filter.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Diamond': return 'text-cyan-400';
      case 'Titanium': return 'text-slate-400';
      case 'Platinum': return 'text-indigo-400';
      case 'Gold': return 'text-amber-400';
      default: return 'text-muted-foreground';
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
          <h1 className="text-3xl font-black uppercase tracking-tight">Elite Level Management</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manage VIP tiers and membership benefits.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchMembers} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
         <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">Diamond Members</p>
                    <p className="text-2xl font-black">{members.filter(m => m.level === 'Diamond').length}</p>
                </div>
                <Crown className="h-8 w-8 text-cyan-500" />
            </CardContent>
         </Card>
         <Card className="bg-gradient-to-br from-slate-500/10 to-transparent border-slate-500/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Titanium Members</p>
                    <p className="text-2xl font-black">{members.filter(m => m.level === 'Titanium').length}</p>
                </div>
                <Crown className="h-8 w-8 text-slate-500" />
            </CardContent>
         </Card>
         <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Platinum Members</p>
                    <p className="text-2xl font-black">{members.filter(m => m.level === 'Platinum').length}</p>
                </div>
                <Crown className="h-8 w-8 text-indigo-500" />
            </CardContent>
         </Card>
         <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Gold Members</p>
                    <p className="text-2xl font-black">{members.filter(m => m.level === 'Gold').length}</p>
                </div>
                <Crown className="h-8 w-8 text-amber-500" />
            </CardContent>
         </Card>
      </div>

      <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search members..." 
                  className="pl-9 h-10"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
              />
          </div>
      </div>

      <Card className="border-border/50 shadow-lg">
         <CardContent className="p-0">
            <DataTable 
               title=""
               columns={[
                   { key: 'name', header: 'Member', cell: (row: any) => (
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
                   { key: 'level', header: 'Tier', cell: (row: any) => (
                       <div className="flex items-center gap-2">
                           <Crown className={`h-3 w-3 ${getLevelColor(row.level)}`} />
                           <span className={`text-xs font-bold ${getLevelColor(row.level)}`}>{row.level}</span>
                       </div>
                   )},
                   { key: 'points', header: 'Points', cell: (row: any) => (
                       <div className="flex items-center gap-1 text-xs font-mono">
                           <Star className="h-3 w-3 text-amber-500" />
                           {row.points.toLocaleString()}
                       </div>
                   )},
                   { key: 'totalSpent', header: 'Lifetime Value', cell: (row: any) => (
                       <div className="flex items-center gap-1 text-xs font-mono text-emerald-500 font-bold">
                           <DollarSign className="h-3 w-3" />
                           {row.totalSpent.toLocaleString()}
                       </div>
                   )},
                   { key: 'status', header: 'Status', cell: (row: any) => (
                       <Badge variant={
                           row.status === 'active' ? 'default' : 'destructive'
                       } className="uppercase text-[9px] tracking-widest">
                           {row.status}
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
                                   <DropdownMenuSub>
                                       <DropdownMenuSubTrigger>
                                           <ArrowUpCircle className="mr-2 h-4 w-4" /> Change Tier
                                       </DropdownMenuSubTrigger>
                                       <DropdownMenuSubContent>
                                           <DropdownMenuRadioGroup value={row.level} onValueChange={(val) => handleLevelChange(row.id, val)}>
                                               <DropdownMenuRadioItem value="Diamond">Diamond</DropdownMenuRadioItem>
                                               <DropdownMenuRadioItem value="Titanium">Titanium</DropdownMenuRadioItem>
                                               <DropdownMenuRadioItem value="Platinum">Platinum</DropdownMenuRadioItem>
                                               <DropdownMenuRadioItem value="Gold">Gold</DropdownMenuRadioItem>
                                               <DropdownMenuRadioItem value="Silver">Silver</DropdownMenuRadioItem>
                                           </DropdownMenuRadioGroup>
                                       </DropdownMenuSubContent>
                                   </DropdownMenuSub>
                                   <DropdownMenuSeparator />
                                   {row.status === 'active' ? (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'suspended')} className="text-amber-500">
                                           <Ban className="mr-2 h-4 w-4" /> Suspend
                                       </DropdownMenuItem>
                                   ) : (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'active')} className="text-emerald-500">
                                           <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                                       </DropdownMenuItem>
                                   )}
                               </DropdownMenuGroup>
                           </DropdownMenuContent>
                       </DropdownMenu>
                   )},
               ]}
               data={filteredData}
            />
         </CardContent>
      </Card>
    </div>
  );
}
