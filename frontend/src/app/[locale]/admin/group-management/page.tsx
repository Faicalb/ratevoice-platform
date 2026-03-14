'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminGroupApi, Group } from '@/lib/api/admin/groups';
import { RefreshCw, Search, Users, MessageSquare, MoreHorizontal, ShieldAlert, CheckCircle2, Trash2, Ban } from 'lucide-react';
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export default function GroupManagementPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', owner: '' });

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const data = await adminGroupApi.getGroups();
      setGroups(data);
    } catch (error) {
      toast.error("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
    try {
      await adminGroupApi.updateStatus(id, status);
      setGroups(prev => prev.map(g => g.id === id ? { ...g, status } : g));
      toast.success(`Group ${status}`);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will permanently delete the group and all its content.")) return;
    try {
      await adminGroupApi.deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      toast.success("Group deleted");
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.owner) {
        toast.error("Please fill in all required fields");
        return;
    }

    try {
        await adminGroupApi.createGroup({
            name: newGroup.name,
            description: newGroup.description,
            owner: newGroup.owner,
            status: 'active'
        });
        
        // Mock update local state
        setGroups(prev => [{
            id: `GRP-${Math.random().toString(36).substr(2, 9)}`,
            name: newGroup.name,
            description: newGroup.description,
            owner: newGroup.owner,
            status: 'active',
            members: 0,
            posts: 0,
            createdAt: new Date().toISOString()
        }, ...prev]);

        setIsCreateOpen(false);
        setNewGroup({ name: '', description: '', owner: '' });
        toast.success("Group created successfully");
    } catch (error) {
        toast.error("Failed to create group");
    }
  };

  const filteredData = groups.filter(g => 
    g.name.toLowerCase().includes(filter.toLowerCase()) || 
    g.description.toLowerCase().includes(filter.toLowerCase())
  );

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
          <h1 className="text-3xl font-black uppercase tracking-tight">Group Management</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Moderate community groups and discussions.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
               <DialogTrigger asChild>
                   <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground">
                       <Plus className="h-3.5 w-3.5 mr-2" /> New Group
                   </Button>
               </DialogTrigger>
               <DialogContent>
                   <DialogHeader>
                       <DialogTitle>Create New Group</DialogTitle>
                       <DialogDescription>
                           Manually create a new community group.
                       </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-4 py-4">
                       <div className="space-y-2">
                           <Label htmlFor="name">Group Name</Label>
                           <Input 
                               id="name" 
                               value={newGroup.name} 
                               onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                               placeholder="e.g. Travel Enthusiasts" 
                           />
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="owner">Group Owner (Username)</Label>
                           <Input 
                               id="owner" 
                               value={newGroup.owner} 
                               onChange={(e) => setNewGroup({...newGroup, owner: e.target.value})}
                               placeholder="e.g. johndoe" 
                           />
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="description">Description</Label>
                           <Textarea 
                               id="description" 
                               value={newGroup.description} 
                               onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                               placeholder="Brief description of the group..." 
                           />
                       </div>
                   </div>
                   <DialogFooter>
                       <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                       <Button onClick={handleCreateGroup}>Create Group</Button>
                   </DialogFooter>
               </DialogContent>
           </Dialog>
           <Button variant="outline" size="sm" onClick={fetchGroups} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search groups..." 
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
                   { key: 'name', header: 'Group', cell: (row: any) => (
                       <div className="flex items-center gap-3">
                           <Avatar className="h-10 w-10 rounded-lg">
                               <AvatarFallback className="rounded-lg">{row.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div>
                               <p className="font-bold text-sm">{row.name}</p>
                               <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{row.description}</p>
                           </div>
                       </div>
                   )},
                   { key: 'owner', header: 'Owner', cell: (row: any) => (
                       <span className="text-sm">{row.owner}</span>
                   )},
                   { key: 'members', header: 'Members', cell: (row: any) => (
                       <div className="flex items-center gap-2">
                           <Users className="h-3 w-3 text-muted-foreground" />
                           <span className="font-bold">{row.members.toLocaleString()}</span>
                       </div>
                   )},
                   { key: 'posts', header: 'Posts', cell: (row: any) => (
                       <div className="flex items-center gap-2">
                           <MessageSquare className="h-3 w-3 text-muted-foreground" />
                           <span className="font-mono">{row.posts.toLocaleString()}</span>
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
                                   {row.status === 'active' ? (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'suspended')} className="text-amber-500">
                                           <Ban className="mr-2 h-4 w-4" /> Suspend Group
                                       </DropdownMenuItem>
                                   ) : (
                                       <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'active')} className="text-emerald-500">
                                           <CheckCircle2 className="mr-2 h-4 w-4" /> Activate
                                       </DropdownMenuItem>
                                   )}
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem onClick={() => handleDelete(row.id)} className="text-rose-500">
                                       <Trash2 className="mr-2 h-4 w-4" /> Delete Group
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
    </div>
  );
}
