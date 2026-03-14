'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeesApi, Employee, RoleType, ActivityLog } from '@/lib/api/employees';
import { RefreshCw, UserPlus, Shield, Users, Loader2, MoreHorizontal, Mail, CheckCircle2, XCircle, Phone, Lock, Activity, Eye, EyeOff, Search, Key } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'email' | 'whatsapp'>('email');
  
  // Temporary Password State
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPass, setShowTempPass] = useState(false);
  const [manualPassword, setManualPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    email: '',
    phone: '',
    role: 'Customer Support',
    department: '',
    permissions: employeesApi.getPermissionsForRole('Customer Support')
  });

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const [empData, logData] = await Promise.all([
        employeesApi.getEmployees(),
        employeesApi.getActivityLogs()
      ]);
      setEmployees(empData);
      setLogs(logData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsCreating(true);
    try {
      // Pass manual password if set
      const result = await employeesApi.createEmployee({
        ...formData,
        password: manualPassword || undefined
      }, inviteMethod);

      if (!manualPassword) {
        setTempPassword(result.tempPass);
        setShowTempPass(true);
      } else {
        toast.success(`Staff account created for ${formData.email}`);
        setShowInviteDialog(false);
      }
      
      if (!manualPassword) toast.success(`Invitation sent via ${inviteMethod}`);
      
      // Reset form
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        role: 'Customer Support', 
        department: '',
        permissions: employeesApi.getPermissionsForRole('Customer Support')
      });
      setManualPassword('');
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to invite employee");
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = (id: string, email: string) => {
    // In a real app, this would send a reset email or generate a new temp password
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Generating password reset link...',
        success: `Password reset instructions sent to ${email}`,
        error: 'Failed to send reset link'
      }
    );
  };

  const handleStatusChange = async (id: string, newStatus: Employee['status']) => {
    try {
      await employeesApi.updateEmployee(id, { status: newStatus });
      setEmployees(employees.map(e => e.id === id ? { ...e, status: newStatus } : e));
      toast.success(`Employee status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handlePermissionToggle = (permId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions?.map(p => p.id === permId ? { ...p, enabled: checked } : p)
    }));
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
          <h1 className="text-3xl font-black uppercase tracking-tight">Employee Management</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Manage staff accounts, roles, and permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchEmployees} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setShowInviteDialog(true)} className="h-9 text-xs uppercase font-bold tracking-widest">
            <UserPlus className="h-3.5 w-3.5 mr-2" /> Invite Staff
          </Button>
        </div>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList>
          <TabsTrigger value="staff">Staff List</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <Card className="border-border/50 shadow-lg">
             <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <Users className="h-4 w-4 text-blue-500" />
                   Active Employees
                </CardTitle>
             </CardHeader>
             <CardContent>
                <DataTable 
                   title=""
                   columns={[
                       { key: 'name', header: 'Employee', cell: (row: Employee) => (
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
                       { key: 'role', header: 'Role', cell: (row: Employee) => (
                           <div className="flex items-center gap-2">
                               <Shield className="h-3 w-3 text-primary" />
                               <span className="text-xs font-medium">{row.role}</span>
                           </div>
                       )},
                       { key: 'department', header: 'Dept', cell: (row: Employee) => (
                          <span className="text-xs text-muted-foreground">{row.department}</span>
                       )},
                       { key: 'status', header: 'Status', cell: (row: Employee) => (
                           <Badge variant={row.status === 'active' ? 'default' : row.status === 'suspended' ? 'destructive' : 'secondary'} className="uppercase text-[10px] tracking-widest">
                               {row.status}
                           </Badge>
                       )},
                       { key: 'lastActive', header: 'Last Active', className: 'text-right' },
                       { key: 'actions', header: '', className: 'w-[50px]', cell: (row: Employee) => (
                           <DropdownMenu>
                               <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}>
                                   <MoreHorizontal className="h-4 w-4" />
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                   <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleResetPassword(row.id, row.email)}>
                                     Reset Password
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   {row.status === 'active' ? (
                                     <DropdownMenuItem className="text-amber-500" onClick={() => handleStatusChange(row.id, 'suspended')}>
                                         Suspend Account
                                     </DropdownMenuItem>
                                   ) : (
                                     <DropdownMenuItem className="text-green-500" onClick={() => handleStatusChange(row.id, 'active')}>
                                         Activate Account
                                     </DropdownMenuItem>
                                   )}
                                   <DropdownMenuItem className="text-rose-500" onClick={() => handleStatusChange(row.id, 'removed')}>
                                       <XCircle className="mr-2 h-4 w-4" /> Remove
                                   </DropdownMenuItem>
                               </DropdownMenuContent>
                           </DropdownMenu>
                       )},
                   ]}
                   data={employees}
                />
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <div className="flex justify-end mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by user, action or details..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Card className="border-border/50 shadow-lg">
             <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <Activity className="h-4 w-4 text-orange-500" />
                   Audit Log
                </CardTitle>
             </CardHeader>
             <CardContent>
                <DataTable 
                   title=""
                   columns={[
                       { key: 'timestamp', header: 'Time', cell: (row: ActivityLog) => new Date(row.timestamp).toLocaleString() },
                       { key: 'employeeName', header: 'User' },
                       { key: 'action', header: 'Action', cell: (row: ActivityLog) => <Badge variant="outline">{row.action}</Badge> },
                       { key: 'details', header: 'Details' },
                       { key: 'ipAddress', header: 'IP Address', cell: (row: ActivityLog) => <span className="font-mono text-xs">{row.ipAddress}</span> },
                   ]}
                   data={logs.filter(log => 
                     log.employeeName.toLowerCase().includes(logSearch.toLowerCase()) ||
                     log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                     log.details.toLowerCase().includes(logSearch.toLowerCase())
                   )}
                />
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Staff Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite New Staff Member</DialogTitle>
            <DialogDescription>
              Create a new account and set permissions.
            </DialogDescription>
          </DialogHeader>

          {!showTempPass ? (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(val: any) => setFormData({
                    ...formData, 
                    role: val,
                    permissions: employeesApi.getPermissionsForRole(val)
                  })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                      <SelectItem value="Review Manager">Review Manager</SelectItem>
                      <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                      <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                      <SelectItem value="Reservation Manager">Reservation Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number (WhatsApp)</Label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Sales, Support" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="manual-pass" className="text-xs text-muted-foreground font-normal">Set Manually</Label>
                    <Switch id="manual-pass" checked={showPasswordInput} onCheckedChange={setShowPasswordInput} />
                  </div>
                </div>
                {showPasswordInput ? (
                  <div className="relative">
                    <Input 
                      type="text" 
                      value={manualPassword} 
                      onChange={e => setManualPassword(e.target.value)} 
                      placeholder="Enter secure password" 
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded border text-sm text-muted-foreground">
                    <span>System will generate a secure temporary password</span>
                    <Key className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="space-y-3 border rounded-md p-4 bg-muted/20">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Permissions</Label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.permissions?.map(perm => (
                    <div key={perm.id} className="flex items-center justify-between space-x-2">
                      <Label htmlFor={perm.id} className="text-sm cursor-pointer">{perm.name}</Label>
                      <Switch id={perm.id} checked={perm.enabled} onCheckedChange={(checked) => handlePermissionToggle(perm.id, checked)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Invitation Method</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={inviteMethod === 'email' ? 'default' : 'outline'} 
                    className="flex-1"
                    onClick={() => setInviteMethod('email')}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Email Invite
                  </Button>
                  <Button 
                    variant={inviteMethod === 'whatsapp' ? 'default' : 'outline'} 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setInviteMethod('whatsapp')}
                  >
                    <Phone className="mr-2 h-4 w-4" /> WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold">Invitation Sent!</h3>
              <p className="text-sm text-muted-foreground">
                A temporary password has been generated for {formData.email}.
              </p>
              <div className="bg-muted p-4 rounded-md max-w-sm mx-auto flex items-center justify-between">
                <code className="text-lg font-mono font-bold">{tempPassword}</code>
                <Button variant="ghost" size="sm" onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  toast.success("Password copied");
                }}>
                  Copy
                </Button>
              </div>
              <p className="text-xs text-red-500">
                * This password will expire in 24 hours.
              </p>
            </div>
          )}

          <DialogFooter>
            {!showTempPass ? (
              <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {isCreating ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            ) : (
              <Button onClick={() => {
                setShowTempPass(false);
                setShowInviteDialog(false);
              }} className="w-full">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
