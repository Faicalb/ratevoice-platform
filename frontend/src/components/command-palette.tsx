'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Command as CommandIcon, 
  LayoutDashboard, 
  Star, 
  Users, 
  BrainCircuit, 
  Settings,
  Bell,
  X
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const items = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview", group: "Dashboard" },
    { href: "/dashboard/reviews", icon: Star, label: "Reviews", group: "Dashboard" },
    { href: "/dashboard/bookings", icon: Users, label: "Bookings", group: "Dashboard" },
    { href: "/dashboard/ai-center", icon: BrainCircuit, label: "AI Center", group: "Dashboard" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings", group: "Account" },
    { href: "/admin", icon: CommandIcon, label: "Admin Panel", group: "System" },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.group.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl">
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input 
            autoFocus
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 h-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 ml-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 border-slate-200 dark:border-slate-700">Esc</Badge>
          </div>
        </div>
        
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-4">
            {filteredItems.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                No results found for "{query}"
              </div>
            ) : (
              <div>
                {/* We could group them here if we wanted */}
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-left group"
                    >
                      <item.icon className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.group}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><CommandIcon className="h-3 w-3" /> + K to open</span>
                <span>↑↓ to navigate</span>
                <span>Enter to select</span>
            </div>
            <div className="text-blue-500">RateVoice Intelligence</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
            {children}
        </span>
    );
}

function ScrollArea({ children, className }: any) {
    return (
        <div className={`overflow-y-auto ${className}`}>
            {children}
        </div>
    );
}
