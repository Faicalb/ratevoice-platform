'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { adminChatApi } from '@/lib/api/admin/chat';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, ShieldBan, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchChats = async () => {
    try {
      const data = await adminChatApi.getAllConversations();
      setConversations(data);
    } catch (error) {
      toast.error('Failed to load chats');
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleView = async (id: string) => {
    try {
      const msgs = await adminChatApi.getMessages(id);
      setSelectedChat(msgs);
      setIsOpen(true);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminChatApi.deleteMessage(id);
      toast.success('Message deleted');
      setIsOpen(false); // Close to refresh or just remove from state
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleBlock = async (msgId: string) => {
    try {
      await adminChatApi.blockUser(msgId);
      toast.success('User blocked');
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chat Monitor</h1>
      
      <Card>
        <CardContent className="p-0">
          <DataTable
            title="Conversations"
            description="Monitor user conversations and moderation actions."
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'participants', header: 'Participants', cell: (row: any) => (
                row.participants.map((p: any) => p.user.fullName).join(', ')
              )},
              { key: 'lastMessage', header: 'Last Message', cell: (row: any) => row.messages[0]?.content || 'No messages' },
              { key: 'actions', header: 'Actions', cell: (row: any) => (
                <Button size="sm" variant="ghost" onClick={() => handleView(row.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            ]}
            data={conversations}
          />
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Conversation</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded">
            {selectedChat.map((msg: any) => (
              <div key={msg.id} className="flex flex-col gap-1 border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-bold text-sm">{msg.sender.fullName}</span>
                  <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm">{msg.content}</p>
                <div className="flex gap-2 justify-end">
                  <Button size="xs" variant="destructive" onClick={() => handleDelete(msg.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => handleBlock(msg.id)}>
                    <ShieldBan className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
