'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminSecurityApi, SecurityAlert, BusinessSecurityStatus } from '@/lib/api/admin/security';
import { RefreshCw, ShieldAlert, Lock, AlertTriangle, CheckCircle2, Search, MoreHorizontal, Activity, FileKey, ShieldCheck, Key, Mail } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [businesses, setBusinesses] = useState<BusinessSecurityStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [alertData, bizData] = await Promise.all([
        adminSecurityApi.getAlerts(),
        adminSecurityApi.getBusinessSecurity()
      ]);
      setAlerts(alertData);
      setBusinesses(bizData);
    } catch (error) {
      toast.error("Failed to load security data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, status: 'investigating' | 'resolved') => {
    try {
      await adminSecurityApi.updateStatus(id, status);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success(`Alert marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleGenerateCertificate = async (id: string) => {
    try {
      const res = await adminSecurityApi.generateCertificate(id);
      if (res.success) {
        setBusinesses(prev => prev.map(b => b.id === id ? { ...b, certificateStatus: 'Generated', certificateId: res.certificateId } : b));
        toast.success("Certificate generated successfully");
      }
    } catch (error) {
      toast.error("Failed to generate certificate");
    }
  };

  const handleActivateBusiness = async (id: string) => {
    try {
      await adminSecurityApi.activateBusiness(id);
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, activationStatus: 'Activated' } : b));
      toast.success("Business activated");
    } catch (error) {
      toast.error("Failed to activate business");
    }
  };

  const handleRevokeCertificate = async (id: string) => {
    if (confirm("Are you sure? This will immediately block access for this business.")) {
      try {
        await adminSecurityApi.revokeCertificate(id);
        setBusinesses(prev => prev.map(b => b.id === id ? { ...b, certificateStatus: 'Revoked', activationStatus: 'Suspended' } : b));
        toast.error("Certificate revoked and access suspended");
      } catch (error) {
        toast.error("Failed to revoke certificate");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const verifiedDevices = businesses.filter(b => b.deviceStatus === 'Verified').length;
  const pendingCerts = businesses.filter(b => b.certificateStatus === 'Pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Security Center</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Monitor threats and manage business certificates.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchData} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card className="bg-rose-500/10 border-rose-500/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Critical Threats</p>
                    <p className="text-2xl font-black text-rose-600">{criticalCount}</p>
                </div>
                <ShieldAlert className="h-8 w-8 text-rose-500" />
            </CardContent>
         </Card>
         <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Verified Devices</p>
                    <p className="text-2xl font-black text-blue-600">{verifiedDevices}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-blue-500" />
            </CardContent>
         </Card>
         <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Pending Certs</p>
                    <p className="text-2xl font-black text-amber-600">{pendingCerts}</p>
                </div>
                <FileKey className="h-8 w-8 text-amber-500" />
            </CardContent>
         </Card>
      </div>

      <Tabs defaultValue="businesses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="businesses">Business Security</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <Card className="border-border/50 shadow-lg">
             <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <Key className="h-4 w-4 text-primary" />
                   Certificate Management
                </CardTitle>
                <CardDescription>Manage business access tokens and digital certificates.</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                <DataTable 
                   title=""
                   columns={[
                       { key: 'businessName', header: 'Business' },
                       { key: 'token', header: 'Token', cell: (row: BusinessSecurityStatus) => <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{row.token}</code> },
                       { key: 'certificateStatus', header: 'Certificate', cell: (row: BusinessSecurityStatus) => (
                           <Badge variant={
                               row.certificateStatus === 'Generated' ? 'default' : 
                               row.certificateStatus === 'Revoked' ? 'destructive' : 'secondary'
                           } className="uppercase text-[9px] tracking-widest">
                               {row.certificateStatus}
                           </Badge>
                       )},
                       { key: 'deviceStatus', header: 'Device', cell: (row: BusinessSecurityStatus) => (
                           <div className="flex items-center gap-1">
                               {row.deviceStatus === 'Verified' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                               <span className="text-xs">{row.deviceStatus}</span>
                           </div>
                       )},
                       { key: 'activationStatus', header: 'Access', cell: (row: BusinessSecurityStatus) => (
                           <Badge variant={row.activationStatus === 'Activated' ? 'outline' : 'destructive'} className="uppercase text-[9px] tracking-widest">
                               {row.activationStatus}
                           </Badge>
                       )},
                       { key: 'actions', header: '', className: 'w-[50px]', cell: (row: BusinessSecurityStatus) => (
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-8 w-8">
                                       <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                   <DropdownMenuLabel>Security Actions</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   {row.certificateStatus === 'Pending' && (
                                       <DropdownMenuItem onClick={() => handleGenerateCertificate(row.id)}>
                                           <FileKey className="mr-2 h-4 w-4 text-blue-500" /> Generate Certificate
                                       </DropdownMenuItem>
                                   )}
                                   {row.certificateStatus === 'Generated' && (
                                       <DropdownMenuItem onClick={() => toast.success("Certificate sent via email")}>
                                           <Mail className="mr-2 h-4 w-4" /> Send Certificate
                                       </DropdownMenuItem>
                                   )}
                                   {row.activationStatus === 'Pending' && (
                                       <DropdownMenuItem onClick={() => handleActivateBusiness(row.id)}>
                                           <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Activate Access
                                       </DropdownMenuItem>
                                   )}
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem className="text-rose-500" onClick={() => handleRevokeCertificate(row.id)}>
                                       <ShieldAlert className="mr-2 h-4 w-4" /> Revoke & Suspend
                                   </DropdownMenuItem>
                               </DropdownMenuContent>
                           </DropdownMenu>
                       )},
                   ]}
                   data={businesses}
                />
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="border-border/50 shadow-lg">
             <CardContent className="p-0">
                <DataTable 
                   title=""
                   columns={[
                       { key: 'severity', header: 'Severity', cell: (row: SecurityAlert) => (
                           <Badge variant={
                               row.severity === 'critical' ? 'destructive' : 
                               row.severity === 'high' ? 'outline' : 'secondary'
                           } className={`uppercase text-[9px] tracking-widest ${
                               row.severity === 'high' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : ''
                           }`}>
                               {row.severity}
                           </Badge>
                       )},
                       { key: 'type', header: 'Type', cell: (row: SecurityAlert) => (
                           <div className="flex items-center gap-2">
                               <Activity className="h-3 w-3 text-muted-foreground" />
                               <span className="text-xs font-bold uppercase tracking-wide">{row.type}</span>
                           </div>
                       )},
                       { key: 'description', header: 'Description', cell: (row: SecurityAlert) => (
                           <div className="flex flex-col">
                               <span className="text-sm font-medium">{row.description}</span>
                               <span className="text-[10px] text-muted-foreground">{row.source} • {new Date(row.timestamp).toLocaleString()}</span>
                           </div>
                       )},
                       { key: 'status', header: 'Status', cell: (row: SecurityAlert) => (
                           <Badge variant={
                               row.status === 'resolved' ? 'default' : 
                               row.status === 'investigating' ? 'secondary' : 'destructive'
                           } className="uppercase text-[9px] tracking-widest">
                               {row.status}
                           </Badge>
                       )},
                       { key: 'actions', header: '', className: 'w-[50px]', cell: (row: SecurityAlert) => (
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-8 w-8">
                                       <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                   <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   {row.status !== 'investigating' && (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'investigating')}>
                                           <Search className="mr-2 h-4 w-4" /> Investigate
                                       </DropdownMenuItem>
                                   )}
                                   {row.status !== 'resolved' && (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'resolved')}>
                                           <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Resolve
                                       </DropdownMenuItem>
                                   )}
                               </DropdownMenuContent>
                           </DropdownMenu>
                       )},
                   ]}
                   data={alerts}
                />
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
