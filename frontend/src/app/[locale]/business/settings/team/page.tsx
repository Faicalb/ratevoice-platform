'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Mail, Shield, User, Lock, Link as LinkIcon } from 'lucide-react';
import api from '@/lib/api/api';
import { addMember, getSettings, TeamMember, defaultPermissions } from '@/lib/api/business/settings';
import { toast } from 'sonner';

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Member Form State
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    role: 'Manager',
    status: 'Invited',
    accessScope: 'Limited Access',
    permissions: { ...defaultPermissions },
    security: {
      require2FA: false,
      forcePasswordReset: true,
      sessionTimeout: true,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        setMembers(settings.team || []);
      } catch {}
    })();
  }, []);

  const handleRemoveMember = async (id: string) => {
    try {
      await api.delete(`/business/employees/${id}`);
      setMembers(members.filter((m) => m.id !== id));
      toast.success('Member removed');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Name and Email are required');
      return;
    }

    setLoading(true);
    try {
      // Type assertion because we're sure these fields exist from initial state
      const addedMember = await addMember(newMember as any);
      setMembers([...members, addedMember]);
      toast.success(`Invitation sent to ${newMember.email}`);
      setIsAddOpen(false);
      // Reset form
      setNewMember({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        department: '',
        role: 'Manager',
        status: 'Invited',
        accessScope: 'Limited Access',
        permissions: { ...defaultPermissions },
        security: {
          require2FA: false,
          forcePasswordReset: true,
          sessionTimeout: true,
        },
      });
    } catch (error) {
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (key: keyof typeof defaultPermissions, value: boolean) => {
    setNewMember((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions!,
        [key]: value,
      },
    }));
  };

  const updateSecurity = (key: keyof typeof newMember.security, value: boolean) => {
    setNewMember((prev) => ({
      ...prev,
      security: {
        ...prev.security!,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Team Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their permissions.
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Invite a new member to your team and set their permissions.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="role">Role & Permissions</TabsTrigger>
                <TabsTrigger value="security">Security & Invite</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={newMember.name} 
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={newMember.email} 
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} 
                      placeholder="john@example.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={newMember.phone} 
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} 
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job">Job Title</Label>
                    <Input 
                      id="job" 
                      value={newMember.jobTitle} 
                      onChange={(e) => setNewMember({ ...newMember, jobTitle: e.target.value })} 
                      placeholder="Marketing Specialist" 
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="dept">Department</Label>
                    <Input 
                      id="dept" 
                      value={newMember.department} 
                      onChange={(e) => setNewMember({ ...newMember, department: e.target.value })} 
                      placeholder="Marketing" 
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Role & Permissions Tab */}
              <TabsContent value="role" className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select 
                      value={newMember.role} 
                      onValueChange={(val: any) => setNewMember({ ...newMember, role: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Reply Manager">Reply Manager</SelectItem>
                        <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                        <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                        <SelectItem value="Customer Support">Customer Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Access Scope</Label>
                    <Select 
                      value={newMember.accessScope} 
                      onValueChange={(val: any) => setNewMember({ ...newMember, accessScope: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Access">Full Access</SelectItem>
                        <SelectItem value="Limited Access">Limited Access</SelectItem>
                        <SelectItem value="Read Only">Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Custom Permissions</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-reviews" className="cursor-pointer">View Reviews</Label>
                      <Switch 
                        id="perm-reviews" 
                        checked={newMember.permissions?.viewReviews}
                        onCheckedChange={(checked) => updatePermission('viewReviews', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-reply" className="cursor-pointer">Reply to Reviews</Label>
                      <Switch 
                        id="perm-reply" 
                        checked={newMember.permissions?.replyReviews}
                        onCheckedChange={(checked) => updatePermission('replyReviews', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-bookings" className="cursor-pointer">Manage Bookings</Label>
                      <Switch 
                        id="perm-bookings" 
                        checked={newMember.permissions?.manageBookings}
                        onCheckedChange={(checked) => updatePermission('manageBookings', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-analytics" className="cursor-pointer">Access Analytics</Label>
                      <Switch 
                        id="perm-analytics" 
                        checked={newMember.permissions?.accessAnalytics}
                        onCheckedChange={(checked) => updatePermission('accessAnalytics', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-ads" className="cursor-pointer">Manage Ads</Label>
                      <Switch 
                        id="perm-ads" 
                        checked={newMember.permissions?.manageAds}
                        onCheckedChange={(checked) => updatePermission('manageAds', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-wallet" className="cursor-pointer">Access Wallet</Label>
                      <Switch 
                        id="perm-wallet" 
                        checked={newMember.permissions?.accessWallet}
                        onCheckedChange={(checked) => updatePermission('accessWallet', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-rewards" className="cursor-pointer">Send Points Rewards</Label>
                      <Switch 
                        id="perm-rewards" 
                        checked={newMember.permissions?.sendRewards}
                        onCheckedChange={(checked) => updatePermission('sendRewards', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-reports" className="cursor-pointer">Access Reports</Label>
                      <Switch 
                        id="perm-reports" 
                        checked={newMember.permissions?.accessReports}
                        onCheckedChange={(checked) => updatePermission('accessReports', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                      <Label htmlFor="perm-staff" className="cursor-pointer">Manage Staff</Label>
                      <Switch 
                        id="perm-staff" 
                        checked={newMember.permissions?.manageStaff}
                        onCheckedChange={(checked) => updatePermission('manageStaff', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Security & Invite Tab */}
              <TabsContent value="security" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Security Options
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require 2FA</Label>
                        <p className="text-xs text-muted-foreground">Force two-factor authentication for this user</p>
                      </div>
                      <Switch 
                        checked={newMember.security?.require2FA}
                        onCheckedChange={(checked) => updateSecurity('require2FA', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Force Password Reset</Label>
                        <p className="text-xs text-muted-foreground">User must change password on first login</p>
                      </div>
                      <Switch 
                        checked={newMember.security?.forcePasswordReset}
                        onCheckedChange={(checked) => updateSecurity('forcePasswordReset', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Session Timeout</Label>
                        <p className="text-xs text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
                      </div>
                      <Switch 
                        checked={newMember.security?.sessionTimeout}
                        onCheckedChange={(checked) => updateSecurity('sessionTimeout', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Invitation Method
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary">
                      <Mail className="h-6 w-6" />
                      <span>Send Email Invitation</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary">
                      <LinkIcon className="h-6 w-6" />
                      <span>Generate Invite Link</span>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMember} disabled={loading}>
                {loading ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            People with access to this business account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between space-x-4 rounded-md border p-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`/avatars/${(member.id.charCodeAt(0) % 5) + 1}.png`} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-5">{member.role}</Badge>
                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] h-5">
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                      <DropdownMenuItem>View Activity</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
