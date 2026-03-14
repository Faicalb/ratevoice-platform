'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminReportsApi, SystemReport } from '@/lib/api/admin/reports';
import { RefreshCw, FileText, Download, ShieldCheck, Activity, DollarSign, History, Loader2, Plus } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await adminReportsApi.getSystemReports();
      setReports(data);
    } catch (error) {
      toast.error("Failed to load system reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (type: string) => {
    setIsGenerating(true);
    try {
      await adminReportsApi.generateReport(type);
      toast.success(`${type} report generation started`);
      fetchReports();
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
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
          <h1 className="text-3xl font-black uppercase tracking-tight">System Reports</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Access global platform audits and performance logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchReports} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button size="sm" disabled={isGenerating} className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                      {isGenerating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-2" />}
                      Generate Report
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Select Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleGenerate('Security')}>
                      <ShieldCheck className="mr-2 h-4 w-4" /> Security Audit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGenerate('Performance')}>
                      <Activity className="mr-2 h-4 w-4" /> System Health
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGenerate('Financial')}>
                      <DollarSign className="mr-2 h-4 w-4" /> Revenue Logs
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-black">{reports.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disk Usage</p>
                    <p className="text-2xl font-black">2.4 GB</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Downloads</p>
                    <p className="text-2xl font-black">1,450</p>
                </div>
                <Download className="h-8 w-8 text-emerald-500/20" />
            </CardContent>
         </Card>
         <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Auto-Archive</p>
                    <p className="text-2xl font-black text-amber-500">On</p>
                </div>
                <History className="h-8 w-8 text-amber-500/20" />
            </CardContent>
         </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
         <CardContent className="p-0">
            <DataTable 
               title=""
               columns={[
                   { key: 'name', header: 'Report Name', cell: (row: any) => (
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-muted rounded-lg">
                               <FileText className="h-4 w-4 text-muted-foreground" />
                           </div>
                           <div>
                               <p className="font-bold text-sm">{row.name}</p>
                               <p className="text-[10px] font-mono text-muted-foreground">{row.id}</p>
                           </div>
                       </div>
                   )},
                   { key: 'type', header: 'Type', cell: (row: any) => (
                       <Badge variant="outline" className="uppercase text-[9px] tracking-widest">
                           {row.type}
                       </Badge>
                   )},
                   { key: 'generatedAt', header: 'Generated', cell: (row: any) => new Date(row.generatedAt).toLocaleDateString() },
                   { key: 'size', header: 'Size', className: 'font-mono text-xs text-muted-foreground' },
                   { key: 'status', header: 'Status', cell: (row: any) => (
                       <Badge variant={row.status === 'ready' ? 'default' : 'secondary'} className="uppercase text-[9px] tracking-widest">
                           {row.status}
                       </Badge>
                   )},
                   { key: 'actions', header: '', className: 'w-[100px] text-right', cell: (row: any) => (
                       <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs uppercase font-bold tracking-widest">
                           <Download className="h-3.5 w-3.5" /> Get
                       </Button>
                   )},
               ]}
               data={reports}
            />
         </CardContent>
      </Card>
    </div>
  );
}
