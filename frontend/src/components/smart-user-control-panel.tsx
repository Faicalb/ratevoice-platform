'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Bell, 
  MessageSquare, 
  HelpCircle, 
  Shield, 
  Wallet, 
  Key, 
  FileText, 
  Users, 
  Briefcase,
  Smartphone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartUserControlPanelProps {
  userRole?: 'Owner' | 'Manager' | 'Staff' | 'Admin';
}

export function SmartUserControlPanel({ userRole = 'Owner' }: SmartUserControlPanelProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const displayName = user?.fullName || 'User';
  const displayEmail = user?.email || '';
  const businessName = 'RateVoice Business'; // In real app, this would come from context
  
  // Dynamic role color
  const roleColor = userRole === 'Admin' ? 'text-rose-500 bg-rose-500/10' : 
                   userRole === 'Owner' ? 'text-emerald-500 bg-emerald-500/10' : 
                   'text-blue-500 bg-blue-500/10';

  return (
    <DropdownMenu id="user-control-panel-menu" open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="outline-none" id="user-control-panel-trigger">
        <div 
          className="relative cursor-pointer group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            animate={{ 
              scale: isHovered ? 1.05 : 1,
              boxShadow: isHovered ? "0 0 15px rgba(var(--primary), 0.3)" : "none"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all p-0.5"
          >
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          {/* Online Indicator */}
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-[320px] p-0 overflow-hidden border-border/50 shadow-xl bg-background/95 backdrop-blur-md rounded-2xl" 
        align="end"
        sideOffset={8}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* User Info Section */}
          <div className="p-4 bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{displayName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-5 font-bold uppercase tracking-wider border-0", roleColor)}>
                    {userRole}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {businessName}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" /> Secure
              </span>
              <span>{displayEmail}</span>
            </div>
          </div>

          <div className="p-2 space-y-1">
            {/* Quick Actions */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5 font-bold">
                Quick Access
              </DropdownMenuLabel>
              <div className="grid grid-cols-3 gap-1 px-1 mb-2">
                <QuickActionButton icon={User} label="Profile" onClick={() => router.push('/business/settings/profile')} />
                <QuickActionButton icon={LayoutDashboard} label="Dashboard" onClick={() => router.push('/business/dashboard')} />
                <QuickActionButton icon={Bell} label="Notifs" badge="3" onClick={() => router.push('/business/settings/notifications')} />
              </div>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-border/50" />

            {/* System Status */}
            <div className="px-3 py-2 bg-muted/20 rounded-lg mx-1 my-1 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Account Status
                </span>
                <span className="font-medium text-emerald-500">Active</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Smartphone className="h-3 w-3" /> Devices
                </span>
                <span className="font-medium">2 Connected</span>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-border/50" />

            {/* Logout */}
            <DropdownMenuItem 
              className="text-rose-500 focus:text-rose-600 focus:bg-rose-500/10 cursor-pointer"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
              <span className="ml-auto text-[10px] opacity-60">Shift+Q</span>
            </DropdownMenuItem>
          </div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuickActionButton({ icon: Icon, label, onClick, badge }: any) {
  return (
    <Button 
      variant="ghost" 
      className="flex flex-col items-center justify-center h-16 w-full gap-1 hover:bg-muted/50 relative"
      onClick={onClick}
    >
      <div className="relative">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-background">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </Button>
  );
}
