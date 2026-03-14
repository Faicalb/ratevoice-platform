'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminBusinessApi, Business } from '@/lib/api/admin/businesses';
import { 
  RefreshCw, Search, Building2, MapPin, MoreHorizontal, 
  CheckCircle2, XCircle, AlertTriangle, Trash2, 
  ShieldCheck, ShieldAlert, Shield, Activity, 
  Wallet, Star, Lock, Mail, ExternalLink, Download, FileText, Settings2, RotateCcw, AlertOctagon, DownloadIcon, CheckIcon, Plus, Phone, Image as ImageIcon
} from 'lucide-react';
import { CreateBusinessModal } from '@/components/admin/create-business-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatsCard } from '@/components/stats-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { globalDataApi, DiscoveredBusiness } from '@/lib/api/admin/global-data';
import { reviewImportApi } from '@/lib/api/admin/review-import';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Database, CloudDownload, Loader2 } from 'lucide-react';

const CooperationBadge = ({ level, score }: { level: string, score: number }) => {
  const color = 
    level === 'excellent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
    level === 'average' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
    'bg-rose-500/10 text-rose-500 border-rose-500/20';
    
  const icon = 
    level === 'excellent' ? <ShieldCheck className="h-3 w-3 mr-1" /> :
    level === 'average' ? <Shield className="h-3 w-3 mr-1" /> :
    <ShieldAlert className="h-3 w-3 mr-1" />;

  return (
    <Badge variant="outline" className={cn("uppercase text-[9px] tracking-widest pl-2 pr-2.5 py-0.5", color)}>
      {icon} {level} • {score}%
    </Badge>
  );
};

export default function BusinessManagementPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // --- Discovery State ---
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveredBusiness[]>([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState<string[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [searchType, setSearchType] = useState('hotel');
  const [searchLimit, setSearchLimit] = useState(20);

  const handleDiscover = async () => {
    if (!searchCity || !searchCountry) {
        toast.error("Please enter city and country");
        return;
    }
    setDiscoveryLoading(true);
    setDiscoveryResults([]);
    try {
        const results = await globalDataApi.discover(searchCity, searchCountry, searchType, searchLimit);
        setDiscoveryResults(results);
        if (results.length === 0) toast.info("No businesses found");
    } catch (error) {
        toast.error("Discovery failed");
    } finally {
        setDiscoveryLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedDiscovery.length === 0) {
        toast.error("Select businesses to import");
        return;
    }
    const toImport = discoveryResults.filter(b => selectedDiscovery.includes(b.externalId));
    if (!confirm(`Import ${toImport.length} businesses? This may take a while.`)) return;

    setDiscoveryLoading(true);
    try {
        const result: any = await globalDataApi.import(toImport);
        toast.success(`Imported: ${result.imported}, Skipped: ${result.skipped}, Failed: ${result.failed}`);
        setSelectedDiscovery([]);
        fetchBusinesses(); // Refresh registered list
    } catch (error) {
        toast.error("Import failed");
    } finally {
        setDiscoveryLoading(false);
    }
  };


  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const data = await adminBusinessApi.getBusinesses();
      setBusinesses(data);
    } catch (error) {
      toast.error("Failed to load businesses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleViewDetails = (business: Business) => {
    setSelectedBusiness(business);
    setIsDetailOpen(true);
  };

  const handleVerify = async (id: string) => {
    try {
      await adminBusinessApi.verifyBusiness(id);
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, verificationStatus: 'verified' } : b));
      toast.success("Business verified successfully");
    } catch (error) {
      toast.error("Verification failed");
    }
  };

  const handleImportReviews = async (businessId: string) => {
    try {
      toast.info("Importing external reviews...");
      const result = await reviewImportApi.importForBusiness(businessId);
      if (result.status === 'SUCCESS') {
        toast.success(`Imported ${result.imported} reviews out of ${result.total_available} available.`);
      } else {
        toast.warning(`Import skipped: ${result.reason}`);
      }
    } catch (error) {
      toast.error("Failed to import reviews");
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
    try {
      await adminBusinessApi.updateStatus(id, status);
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Business ${status}`);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const handleCooperationChange = async (id: string, level: 'excellent' | 'average' | 'poor' | 'reset') => {
    try {
      await adminBusinessApi.updateCooperationLevel(id, level);
      
      const newScore = level === 'excellent' ? 90 : level === 'average' ? 65 : 30;
      const override = level !== 'reset';

      setBusinesses(prev => prev.map(b => {
        if (b.id === id) {
          if (level === 'reset') {
             // Mock reset to original random value
             return { ...b, cooperationLevel: 'average', cooperationScore: 72, cooperationOverride: false };
          }
          return { ...b, cooperationLevel: level, cooperationScore: newScore, cooperationOverride: true };
        }
        return b;
      }));
      
      if (level === 'reset') {
        toast.success("Cooperation level reset to AI calculation");
      } else {
        toast.success(`Cooperation level set to ${level}`);
      }
    } catch (error) {
      toast.error("Failed to update cooperation level");
    }
  };

  const handleQuickCooperationSwitch = async (level: 'excellent' | 'average' | 'poor' | 'reset') => {
    if (!selectedBusiness) return;
    
    // Optimistic UI update
    const newScore = level === 'excellent' ? 90 : level === 'average' ? 65 : level === 'poor' ? 30 : 72; // Default reset
    const newLevel = level === 'reset' ? 'average' : level;
    const override = level !== 'reset';

    setSelectedBusiness({
        ...selectedBusiness,
        cooperationLevel: newLevel,
        cooperationScore: newScore,
        cooperationOverride: override
    });

    await handleCooperationChange(selectedBusiness.id, level);
  };

  const handleCertificateAction = (action: string) => {
      toast.success(`${action} initiated for ${selectedBusiness?.name}`);
  };

  const handleFindEmail = async (id: string) => {
    try {
      toast.info("Searching for owner email...");
      const result = await adminBusinessApi.findOwnerEmail(id);
      if (result.success && result.email) {
        toast.success(`Email found: ${result.email}`);
        setBusinesses(prev => prev.map(b => b.id === id ? { 
            ...b, 
            ownerEmailFound: true, 
            discoveredEmail: result.email,
            emailConfidenceScore: (result.confidence || 0) * 100,
            emailSource: result.source
        } : b));
      } else {
        toast.warning("No email found for this business.");
      }
    } catch (error) {
      toast.error("Failed to find email");
    }
  };

  const handleBulkFindEmail = async () => {
    if (!confirm("This will scan all unclaimed businesses for owner emails. This process may take some time. Continue?")) return;
    try {
      toast.info("Starting bulk email discovery...");
      const result = await adminBusinessApi.bulkFindEmail();
      toast.success(`Discovery complete. Processed: ${result.processed}, Found: ${result.found}`);
      fetchBusinesses(); // Refresh list
    } catch (error) {
      toast.error("Bulk discovery failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business? This action cannot be undone.")) return;
    try {
      await adminBusinessApi.deleteBusiness(id);
      setBusinesses(prev => prev.filter(b => b.id !== id));
      toast.success("Business deleted");
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const filteredData = businesses.filter(b => 
    b.name.toLowerCase().includes(filter.toLowerCase()) || 
    b.owner.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    total: businesses.length,
    verified: businesses.filter(b => b.verificationStatus === 'verified').length,
    pending: businesses.filter(b => b.verificationStatus === 'unverified').length,
    suspended: businesses.filter(b => b.status === 'suspended').length,
    highRisk: businesses.filter(b => b.cooperationLevel === 'poor').length
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
          <h1 className="text-3xl font-black uppercase tracking-tight">Business Management</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Oversee and manage registered establishments.
          </p>
        </div>
      </div>

      <Tabs defaultValue="registered" className="w-full">
         <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
             <TabsTrigger value="registered" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground">Registered Businesses</TabsTrigger>
             <TabsTrigger value="discovery" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground">Global Data Engine</TabsTrigger>
         </TabsList>
         
         <TabsContent value="registered" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-end gap-3">
               <Button variant="outline" size="sm" onClick={fetchBusinesses} className="h-9 text-xs uppercase font-bold tracking-widest">
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
              </Button>
              <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20" onClick={handleBulkFindEmail}>
                 <Mail className="h-3.5 w-3.5 mr-2" /> Find Emails
              </Button>
              <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground" onClick={() => setIsCreateOpen(true)}>
                 <Plus className="h-3.5 w-3.5 mr-2" /> Add Business
              </Button>
              <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-muted text-muted-foreground hover:text-foreground">
                 <Download className="h-3.5 w-3.5 mr-2" /> Export Data
              </Button>
            </div>

            <CreateBusinessModal 
                open={isCreateOpen} 
                onOpenChange={setIsCreateOpen} 
                onSuccess={fetchBusinesses} 
            />

            {/* Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <StatsCard title="Total Businesses" value={stats.total} icon={Building2} description="Registered establishments" />
                <StatsCard title="Verified" value={stats.verified} icon={CheckCircle2} description="Identity confirmed" />
                <StatsCard title="Pending" value={stats.pending} icon={Activity} description="Awaiting verification" />
                <StatsCard title="Suspended" value={stats.suspended} icon={XCircle} description="Access revoked" />
                <StatsCard title="High Risk" value={stats.highRisk} icon={ShieldAlert} description="Poor cooperation" />
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, owner, or ID..." 
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
                   { key: 'name', header: 'Establishment', cell: (row: any) => (
                       <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleViewDetails(row)}>
                           <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold border transition-all
                             ${row.cooperationLevel === 'excellent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/50' : 
                               row.cooperationLevel === 'average' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 group-hover:border-orange-500/50' : 
                               'bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:border-rose-500/50'}`}>
                               {row.name.charAt(0)}
                           </div>
                           <div>
                               <p className="font-bold text-sm group-hover:text-primary transition-colors">{row.name}</p>
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-muted-foreground">{row.type}</span>
                                 <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">{row.id}</span>
                               </div>
                           </div>
                       </div>
                   )},
                   { key: 'cooperationLevel', header: 'Cooperation', cell: (row: any) => (
                       <div className="flex flex-col gap-1 group/coop relative">
                         <div className="flex items-center gap-2">
                            <CooperationBadge level={row.cooperationLevel} score={row.cooperationScore} />
                            {row.cooperationOverride && (
                               <span className="h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-background" title="Manually Overridden" />
                            )}
                         </div>
                         
                         <DropdownMenu>
                            <DropdownMenuTrigger className={cn(
                               "absolute -right-8 top-0 opacity-0 group-hover/coop:opacity-100 transition-opacity",
                               buttonVariants({ variant: "ghost", size: "icon", className: "h-6 w-6" })
                            )}>
                               <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                               <DropdownMenuLabel>Manual Override</DropdownMenuLabel>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem onClick={() => handleCooperationChange(row.id, 'excellent')}>
                                   <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" /> Set Excellent
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleCooperationChange(row.id, 'average')}>
                                   <Shield className="mr-2 h-4 w-4 text-orange-500" /> Set Average
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleCooperationChange(row.id, 'poor')}>
                                   <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" /> Set Poor
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem onClick={() => handleCooperationChange(row.id, 'reset')}>
                                   <RotateCcw className="mr-2 h-4 w-4" /> Reset to AI
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                   )},
                   { key: 'owner', header: 'Owner', cell: (row: any) => (
                       <div className="flex flex-col">
                           <span className="text-sm font-medium">{row.owner}</span>
                           <span className="text-[10px] text-muted-foreground">{row.email}</span>
                       </div>
                   )},
                   { key: 'ownerEmailFound', header: 'Email Found', cell: (row: any) => (
                       <div className="flex flex-col items-start gap-1">
                           {row.ownerEmailFound ? (
                               <>
                                 <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Found
                                 </Badge>
                                 <span className="text-[10px] text-muted-foreground">{row.discoveredEmail}</span>
                                 <span className="text-[9px] font-mono bg-muted px-1 rounded text-muted-foreground">Score: {row.emailConfidenceScore}%</span>
                               </>
                           ) : (
                               <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-muted text-muted-foreground border-border px-2">
                                  Not Found
                               </Badge>
                           )}
                       </div>
                   )},
                   { key: 'verificationStatus', header: 'Verification', cell: (row: any) => (
                       <Badge variant={
                           row.verificationStatus === 'verified' ? 'outline' : 
                           row.verificationStatus === 'pending' ? 'secondary' : 'destructive'
                       } className="uppercase text-[9px] tracking-widest border-emerald-500/20 text-emerald-500 bg-emerald-500/10">
                           {row.verificationStatus === 'verified' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                           {row.verificationStatus}
                       </Badge>
                   )},
                   { key: 'status', header: 'Status', cell: (row: any) => (
                       <Badge variant={
                           row.status === 'active' ? 'default' : 
                           row.status === 'suspended' ? 'destructive' : 'secondary'
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
                                 <DropdownMenuItem onClick={() => handleFindEmail(row.id)}>
                                     <Mail className="mr-2 h-4 w-4 text-blue-500" /> Find Owner Email
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleImportReviews(row.id)}>
                                     <DownloadIcon className="mr-2 h-4 w-4 text-orange-500" /> Import Reviews
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleViewDetails(row)}>
                                     <FileText className="mr-2 h-4 w-4" /> View Details
                                 </DropdownMenuItem>
                                 {row.verificationStatus !== 'verified' && (
                                     <DropdownMenuItem onClick={() => handleVerify(row.id)}>
                                         <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Verify
                                     </DropdownMenuItem>
                                 )}
                                 {row.status === 'active' ? (
                                     <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'suspended')}>
                                         <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /> Suspend
                                     </DropdownMenuItem>
                                 ) : (
                                     <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'active')}>
                                         <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Activate
                                     </DropdownMenuItem>
                                 )}
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={() => handleDelete(row.id)} className="text-rose-500">
                                     <Trash2 className="mr-2 h-4 w-4" /> Delete Account
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
      </TabsContent>

      <TabsContent value="discovery" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <Card className="border-border/50 shadow-lg">
               <CardHeader>
                   <CardTitle className="flex items-center gap-2 text-lg">
                       <Globe className="h-5 w-5 text-primary" /> Global Business Discovery
                   </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-muted/20 p-4 rounded-lg border border-border/50">
                       <div className="space-y-2">
                           <Label>Country</Label>
                           <Input 
                               value={searchCountry} 
                               onChange={e => setSearchCountry(e.target.value)} 
                               placeholder="e.g. Morocco" 
                           />
                       </div>
                       <div className="space-y-2">
                           <Label>City</Label>
                           <Input 
                               value={searchCity} 
                               onChange={e => setSearchCity(e.target.value)} 
                               placeholder="e.g. Marrakech" 
                           />
                       </div>
                       <div className="space-y-2">
                           <Label>Business Type</Label>
                           <Select value={searchType} onValueChange={setSearchType}>
                               <SelectTrigger>
                                   <SelectValue placeholder="Select type" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="hotel">Hotels</SelectItem>
                                   <SelectItem value="restaurant">Restaurants</SelectItem>
                                   <SelectItem value="cafe">Cafes</SelectItem>
                                   <SelectItem value="tourist_attraction">Attractions</SelectItem>
                                   <SelectItem value="spa">Spas</SelectItem>
                                   <SelectItem value="gym">Gyms</SelectItem>
                               </SelectContent>
                           </Select>
                       </div>
                       <div className="space-y-2">
                           <Label>Limit</Label>
                           <Select value={searchLimit.toString()} onValueChange={(v: string) => setSearchLimit(Number(v))}>
                               <SelectTrigger>
                                   <SelectValue placeholder="Limit" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="20">20</SelectItem>
                                   <SelectItem value="50">50</SelectItem>
                                   <SelectItem value="100">100</SelectItem>
                                   <SelectItem value="200">200</SelectItem>
                               </SelectContent>
                           </Select>
                       </div>
                       <div className="col-span-1 md:col-span-2 lg:col-span-1">
                           <Button onClick={handleDiscover} disabled={discoveryLoading} className="w-full bg-primary font-bold uppercase tracking-widest">
                               {discoveryLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                               Discover
                           </Button>
                       </div>
                   </div>

                   {discoveryResults.length > 0 && (
                       <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                               <div className="flex items-center gap-2">
                                   <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                   <span className="font-bold text-emerald-700 dark:text-emerald-400">{discoveryResults.length} Businesses Found</span>
                               </div>
                               <div className="flex items-center gap-3">
                                   <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">
                                       {selectedDiscovery.length} selected
                                   </span>
                                   <Button 
                                       onClick={handleImport} 
                                       disabled={selectedDiscovery.length === 0 || discoveryLoading}
                                       size="sm"
                                       className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest"
                                   >
                                       {discoveryLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CloudDownload className="mr-2 h-4 w-4" />}
                                       Import Selected
                                   </Button>
                               </div>
                           </div>
                           
                           <div className="border rounded-md overflow-hidden">
                               <table className="w-full text-sm">
                                   <thead className="bg-muted/50 border-b">
                                       <tr>
                                           <th className="p-3 w-10">
                                               <Checkbox 
                                                   checked={selectedDiscovery.length === discoveryResults.length}
                                                   onCheckedChange={(checked) => {
                                                       if (checked) setSelectedDiscovery(discoveryResults.map(r => r.externalId));
                                                       else setSelectedDiscovery([]);
                                                   }}
                                               />
                                           </th>
                                           <th className="p-3 text-left font-bold text-muted-foreground uppercase text-xs tracking-wider">Business</th>
                                           <th className="p-3 text-left font-bold text-muted-foreground uppercase text-xs tracking-wider">Contact</th>
                                           <th className="p-3 text-left font-bold text-muted-foreground uppercase text-xs tracking-wider">Rating</th>
                                           <th className="p-3 text-left font-bold text-muted-foreground uppercase text-xs tracking-wider">Source</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y">
                                       {discoveryResults.map((row) => (
                                           <tr key={row.externalId} className="hover:bg-muted/10 transition-colors">
                                               <td className="p-3">
                                                   <Checkbox 
                                                       checked={selectedDiscovery.includes(row.externalId)}
                                                       onCheckedChange={(checked) => {
                                                           if (checked) setSelectedDiscovery([...selectedDiscovery, row.externalId]);
                                                           else setSelectedDiscovery(selectedDiscovery.filter(id => id !== row.externalId));
                                                       }}
                                                   />
                                               </td>
                                               <td className="p-3">
                                                   <div className="font-bold">{row.name}</div>
                                                   <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                       <MapPin className="h-3 w-3" /> {row.address}
                                                   </div>
                                               </td>
                                               <td className="p-3 space-y-1">
                                                   {row.website && (
                                                       <a href={row.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                                           <Globe className="h-3 w-3" /> Website
                                                       </a>
                                                   )}
                                                   {row.phone && (
                                                       <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                           <Phone className="h-3 w-3" /> {row.phone}
                                                       </div>
                                                   )}
                                               </td>
                                               <td className="p-3">
                                                   <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded w-fit">
                                                       <Star className="h-3 w-3 fill-current" />
                                                       <span className="font-bold text-xs">{row.rating || 'N/A'}</span>
                                                   </div>
                                               </td>
                                               <td className="p-3">
                                                   <div className="flex items-center gap-1">
                                                       {row.source === 'GOOGLE_PLACES' && <span className="text-xs font-mono bg-blue-100 text-blue-800 px-1 rounded">Google</span>}
                                                       {row.photos && row.photos.length > 0 && (
                                                           <span className="text-xs font-mono bg-purple-100 text-purple-800 px-1 rounded flex items-center gap-1">
                                                               <ImageIcon className="h-3 w-3" /> {row.photos.length}
                                                           </span>
                                                       )}
                                                   </div>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                   )}
               </CardContent>
           </Card>
       </TabsContent>
    </Tabs>

      {/* Business Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedBusiness && (
            <>
              <div className={`p-6 border-b border-border flex items-start justify-between
                ${selectedBusiness.cooperationLevel === 'excellent' ? 'bg-emerald-500/5' : 
                  selectedBusiness.cooperationLevel === 'average' ? 'bg-orange-500/5' : 'bg-rose-500/5'}`}>
                 <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-black border-2 shadow-lg
                      ${selectedBusiness.cooperationLevel === 'excellent' ? 'bg-background text-emerald-500 border-emerald-500/20' : 
                        selectedBusiness.cooperationLevel === 'average' ? 'bg-background text-orange-500 border-orange-500/20' : 
                        'bg-background text-rose-500 border-rose-500/20'}`}>
                        {selectedBusiness.name.charAt(0)}
                    </div>
                    <div>
                       <h2 className="text-xl font-bold">{selectedBusiness.name}</h2>
                       <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{selectedBusiness.type}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {selectedBusiness.location}
                          </span>
                       </div>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <CooperationBadge level={selectedBusiness.cooperationLevel} score={selectedBusiness.cooperationScore} />
                    
                    {/* Quick Cooperation Switch */}
                    <div className="flex items-center gap-1.5 mt-1 bg-muted/30 p-1 rounded-full border border-border/50">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={() => handleQuickCooperationSwitch('excellent')}
                                        className={cn("h-3 w-3 rounded-full bg-emerald-500 hover:ring-2 hover:ring-emerald-500/50 hover:scale-110 transition-all shadow-sm", 
                                            selectedBusiness.cooperationLevel === 'excellent' && "ring-2 ring-emerald-500/50 scale-110")} 
                                    />
                                </TooltipTrigger>
                                <TooltipContent><p>Set Excellent (90%)</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={() => handleQuickCooperationSwitch('average')}
                                        className={cn("h-3 w-3 rounded-full bg-orange-500 hover:ring-2 hover:ring-orange-500/50 hover:scale-110 transition-all shadow-sm",
                                            selectedBusiness.cooperationLevel === 'average' && "ring-2 ring-orange-500/50 scale-110")} 
                                    />
                                </TooltipTrigger>
                                <TooltipContent><p>Set Average (65%)</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={() => handleQuickCooperationSwitch('poor')}
                                        className={cn("h-3 w-3 rounded-full bg-rose-500 hover:ring-2 hover:ring-rose-500/50 hover:scale-110 transition-all shadow-sm",
                                            selectedBusiness.cooperationLevel === 'poor' && "ring-2 ring-rose-500/50 scale-110")} 
                                    />
                                </TooltipTrigger>
                                <TooltipContent><p>Set Poor (30%)</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="w-px h-3 bg-border mx-0.5" />
                        
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={() => handleQuickCooperationSwitch('reset')}
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent><p>Reset to AI Calculation</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground mt-1">ID: {selectedBusiness.id}</span>
                 </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                 <div className="grid gap-6 md:grid-cols-2">
                    {/* Wallet & Financials */}
                    <Card className="border-border/50 shadow-sm col-span-2">
                       <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                             <Wallet className="h-4 w-4 text-primary" /> Wallet & Financials
                          </CardTitle>
                       </CardHeader>
                       <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                             <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Balance</span>
                                <p className="text-xl font-black text-foreground mt-1">${selectedBusiness.walletBalance.toLocaleString()}</p>
                             </div>
                             <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Ad Spend</span>
                                <p className="text-xl font-black text-foreground mt-1">$1,240.00</p>
                             </div>
                             <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Points Dist.</span>
                                <p className="text-xl font-black text-foreground mt-1">45,200</p>
                             </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                             <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold">Add Balance</Button>
                             <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold text-rose-500 hover:text-rose-600">Freeze Wallet</Button>
                          </div>
                       </CardContent>
                    </Card>

                    {/* Owner Info */}
                    <Card className="border-border/50 shadow-sm">
                       <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                             <Shield className="h-4 w-4" /> Owner Information
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Full Name</span>
                             <span className="font-medium">{selectedBusiness.owner}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Email</span>
                             <span className="font-medium flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {selectedBusiness.email}
                             </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Registered</span>
                             <span className="font-medium">{new Date(selectedBusiness.registeredAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Last Login</span>
                             <span className="font-medium">{new Date(selectedBusiness.lastLogin).toLocaleString()}</span>
                          </div>
                          <Button size="sm" variant="secondary" className="w-full mt-2 h-8 text-xs">
                             Reset Password
                          </Button>
                       </CardContent>
                    </Card>

                    {/* Security & System */}
                    <Card className="border-border/50 shadow-sm">
                       <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                             <Lock className="h-4 w-4" /> Security & System
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">System Token</span>
                             <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                                {selectedBusiness.systemToken.substring(0, 12)}...
                             </code>
                          </div>
                          
                          {/* Certificate Management Section */}
                          <div className="bg-muted/30 rounded-lg p-3 border border-border/50 space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                                      <ShieldCheck className="h-3 w-3" /> Certificate Status
                                  </span>
                                  <Badge variant={selectedBusiness.certificateStatus === 'valid' ? 'outline' : 'destructive'} 
                                    className={cn("text-[9px] uppercase h-5", 
                                        selectedBusiness.certificateStatus === 'valid' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/10" : "")}>
                                      {selectedBusiness.certificateStatus === 'valid' ? 'Valid' : 
                                       selectedBusiness.certificateStatus === 'expired' ? 'Expired' : 'Not Installed'}
                                  </Badge>
                              </div>
                              
                              {selectedBusiness.certificateStatus !== 'valid' && (
                                  <Alert variant="destructive" className="py-2 px-3 border-destructive/20 bg-destructive/5">
                                      <AlertOctagon className="h-4 w-4" />
                                      <AlertTitle className="text-xs font-bold ml-2">Access Restricted</AlertTitle>
                                      <AlertDescription className="text-[10px] ml-2 mt-0.5 text-destructive/80">
                                          This establishment dashboard cannot be accessed until the certificate is installed.
                                      </AlertDescription>
                                  </Alert>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground">Certificate ID</span>
                                      <span className="font-mono">CRT-{selectedBusiness.id.split('-')[1]}-2024</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground">Device</span>
                                      <span>Windows / Chrome</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground">Issued</span>
                                      <span>{new Date(selectedBusiness.registeredAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground">Expires</span>
                                      <span>2025-12-31</span>
                                  </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => handleCertificateAction('Download')}>
                                      <DownloadIcon className="h-3 w-3 mr-1.5" /> Download
                                  </Button>
                                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]" onClick={() => handleCertificateAction('Verify')}>
                                      <CheckIcon className="h-3 w-3 mr-1.5" /> Verify
                                  </Button>
                              </div>
                              <Button size="sm" variant="ghost" className="w-full h-6 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10" onClick={() => handleCertificateAction('Revoke')}>
                                  Revoke Certificate
                              </Button>
                          </div>

                          <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                             <span className="text-muted-foreground">Active Sessions</span>
                             <span className="font-medium">{selectedBusiness.activeSessions}</span>
                          </div>
                          <div className="flex gap-2">
                             <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] uppercase font-bold">Regenerate Token</Button>
                             <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] uppercase font-bold text-rose-500">Force Logout</Button>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-2">
                 <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
                 <Button variant="destructive">Suspend Account</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
