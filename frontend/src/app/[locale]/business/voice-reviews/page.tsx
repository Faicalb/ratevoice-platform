'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { reviewsApi, VoiceReview } from '@/lib/api/reviews';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Pause, 
  MessageSquare, 
  Gift, 
  MoreHorizontal, 
  Share2, 
  Flag, 
  RefreshCw,
  Star,
  Quote,
  Mic,
  MicOff,
  Send,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle2,
  Mail,
  Smartphone,
  Users,
  Eye,
  Bookmark,
  Edit,
  Pin,
  Trash2,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceReviewsPage() {
  const [reviews, setReviews] = useState<VoiceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // New Feature States
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  // Reward Form State
  const [rewardType, setRewardType] = useState<'cash' | 'points'>('points');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardMessage, setRewardMessage] = useState('');

  // Share Form State
  const [shareType, setShareType] = useState('internal');
  const [shareEmail, setShareEmail] = useState('');

  // Note Form State
  const [internalNote, setInternalNote] = useState('');

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await reviewsApi.getReviews();
      setReviews(data);
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handlePlay = (id: string) => {
    if (activeAudio === id) {
      setActiveAudio(null);
    } else {
      setActiveAudio(id);
      toast.info("Playing audio preview...");
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    // In a real app, MediaRecorder API would be initialized here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Simulate blob creation
    setAudioBlob(new Blob(['mock-audio'], { type: 'audio/webm' }));
    toast.success("Voice reply recorded");
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim() && !audioBlob) return;
    setIsSending(true);
    try {
      if (audioBlob) {
        await reviewsApi.replyVoice(id, audioBlob);
      } else {
        await reviewsApi.reply(id, replyText);
      }
      toast.success("Reply sent successfully");
      setReplyingTo(null);
      setReplyText('');
      setAudioBlob(null);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'replied' } : r));
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleRewardSubmit = async () => {
    if (!selectedReviewId || !rewardAmount) return;
    try {
      await reviewsApi.reward(selectedReviewId, rewardType, Number(rewardAmount), rewardMessage);
      toast.success(`Sent ${rewardAmount} ${rewardType === 'cash' ? '$' : 'points'} reward!`);
      setRewardOpen(false);
      setRewardAmount('');
      setRewardMessage('');
    } catch (error) {
      toast.error("Failed to send reward");
    }
  };

  const handleShareSubmit = async () => {
    if (!selectedReviewId) return;
    try {
      if (shareType === 'whatsapp') {
        const res = await reviewsApi.shareWhatsapp(selectedReviewId);
        window.open(res.link, '_blank');
      } else if (shareType === 'email') {
        await reviewsApi.shareEmail(selectedReviewId, shareEmail, "Review Share", "Check this review");
        toast.success("Email sent");
      } else {
        await reviewsApi.shareInternal(selectedReviewId, "emp_123");
        toast.success("Shared with team");
      }
      setShareOpen(false);
    } catch (error) {
      toast.error("Failed to share review");
    }
  };

  const handleExport = async () => {
    toast.promise(reviewsApi.exportReviews({}), {
      loading: 'Generating export...',
      success: 'Export downloaded successfully',
      error: 'Export failed'
    });
    setExportOpen(false);
  };

  // Review Management Handlers
  const handleChangeStatus = async (id: string, status: string) => {
    try {
      await reviewsApi.updateStatus(id, status);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAddNote = async () => {
    if (!selectedReviewId || !internalNote) return;
    try {
      await reviewsApi.addNote(selectedReviewId, internalNote);
      toast.success("Internal note added");
      setNoteOpen(false);
      setInternalNote('');
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleAssignStaff = async (id: string, staffId: string) => {
    try {
      await reviewsApi.assignStaff(id, staffId);
      toast.success("Review assigned to staff");
    } catch (error) {
      toast.error("Failed to assign staff");
    }
  };

  const handlePinReview = async (id: string, currentPinned: boolean) => {
    try {
      await reviewsApi.pinReview(id, !currentPinned);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, pinned: !currentPinned } : r));
      toast.success(currentPinned ? "Review unpinned" : "Review pinned");
    } catch (error) {
      toast.error("Failed to pin review");
    }
  };

  const handleFlagReview = async (id: string) => {
    try {
      await reviewsApi.flagReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'flagged' } : r));
      toast.success("Review flagged for moderation");
    } catch (error) {
      toast.error("Failed to flag review");
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReviewId) return;
    try {
      await reviewsApi.deleteReview(selectedReviewId);
      setReviews(prev => prev.filter(r => r.id !== selectedReviewId));
      toast.success("Review deleted");
      setDeleteOpen(false);
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Voice Reviews</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Listen, analyze, and respond to your customers' voice feedback.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchReviews} className="h-9 text-xs uppercase font-bold tracking-widest">
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          
          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 text-xs uppercase font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                Export All
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Reviews</DialogTitle>
                <DialogDescription>Select format and filters for your export.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center gap-2 text-center" onClick={handleExport}>
                    <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                    <span className="text-sm font-medium">Excel (.xlsx)</span>
                  </div>
                  <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center gap-2 text-center" onClick={handleExport}>
                    <FileText className="h-8 w-8 text-red-500" />
                    <span className="text-sm font-medium">PDF Document</span>
                  </div>
                  <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center gap-2 text-center" onClick={handleExport}>
                    <FileText className="h-8 w-8 text-blue-500" />
                    <span className="text-sm font-medium">CSV File</span>
                  </div>
                  <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center gap-2 text-center" onClick={handleExport}>
                    <FileJson className="h-8 w-8 text-orange-500" />
                    <span className="text-sm font-medium">JSON Data</span>
                  </div>
                </div>
                <div className="space-y-2">
                   <Label>Filter by Rating</Label>
                   <Select defaultValue="all">
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">All Ratings</SelectItem>
                       <SelectItem value="5">5 Stars</SelectItem>
                       <SelectItem value="4">4 Stars & Up</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {reviews.map((review) => (
          <Card key={review.id} className="border-border/50 shadow-lg overflow-hidden group hover:border-primary/20 transition-all relative">
            {review.pinned && (
              <div className="absolute top-0 right-0 p-2 bg-primary/10 rounded-bl-xl border-b border-l border-primary/20 z-10">
                <Pin className="h-3.5 w-3.5 text-primary fill-primary" />
              </div>
            )}
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Left: Player & Info */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.customerName}`} />
                        <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-sm">{review.customerName}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(review.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted/30'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      review.sentiment === 'positive' ? 'default' : 
                      review.sentiment === 'neutral' ? 'secondary' : 'destructive'
                    } className="uppercase text-[10px] tracking-widest font-bold">
                      {review.sentiment}
                    </Badge>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-4 border border-border/50">
                    <Button 
                      size="icon" 
                      className="h-10 w-10 rounded-full shrink-0 shadow-lg shadow-primary/20"
                      onClick={() => handlePlay(review.id)}
                    >
                      {activeAudio === review.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </Button>
                    <div className="flex-1 space-y-1">
                       <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: activeAudio === review.id ? "100%" : "30%" }}
                            transition={{ duration: activeAudio === review.id ? 10 : 0, ease: "linear" }}
                          />
                       </div>
                       <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                          <span>0:00</span>
                          <span>0:45</span>
                       </div>
                    </div>
                  </div>

                  <div className="relative pl-8 pt-2">
                    <Quote className="absolute left-0 top-2 h-4 w-4 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{review.transcript}"
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {review.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px] text-muted-foreground bg-background">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="w-full md:w-64 bg-muted/10 border-t md:border-t-0 md:border-l border-border/50 p-6 flex flex-col justify-between gap-4">
                   <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2 text-xs font-bold uppercase tracking-wide"
                        onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Reply to Customer
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => { setSelectedReviewId(review.id); setRewardOpen(true); }}
                      >
                        <Gift className="h-3.5 w-3.5" />
                        Send Reward
                      </Button>

                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                        onClick={() => { setSelectedReviewId(review.id); setShareOpen(true); }}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share Internally
                      </Button>
                   </div>
                   
                   <div className="flex justify-between items-center pt-4 border-t border-border/50">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        Status: <Badge variant="outline" className="text-[9px]">{review.status.replace('_', ' ')}</Badge>
                      </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Review Options</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleChangeStatus(review.id, 'resolved')}>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeStatus(review.id, 'flagged')}>
                              <Bookmark className="mr-2 h-4 w-4" /> Mark as Important
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuGroup>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <RefreshCw className="mr-2 h-4 w-4" /> Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleChangeStatus(review.id, 'new')}>New</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeStatus(review.id, 'in_progress')}>In Progress</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeStatus(review.id, 'responded')}>Responded</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeStatus(review.id, 'resolved')}>Resolved</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeStatus(review.id, 'archived')}>Archived</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <UserPlus className="mr-2 h-4 w-4" /> Assign to Staff
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleAssignStaff(review.id, 'emp_1')}>John Manager</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAssignStaff(review.id, 'emp_2')}>Sarah Support</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuItem onClick={() => { setSelectedReviewId(review.id); setNoteOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" /> Add Internal Note
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => handlePinReview(review.id, !!review.pinned)}>
                              <Pin className="mr-2 h-4 w-4" /> {review.pinned ? 'Unpin Review' : 'Pin Review'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFlagReview(review.id)}>
                              <Flag className="mr-2 h-4 w-4" /> Flag for Moderation
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setSelectedReviewId(review.id); setDeleteOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Review
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                </div>
              </div>

              {/* Reply Area */}
              <AnimatePresence>
                {replyingTo === review.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/50 bg-muted/20 p-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            Drafting Reply
                         </h4>
                         <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 p-0 rounded-full">
                            <span className="sr-only">Close</span>
                            &times;
                         </Button>
                      </div>
                      
                      <div className="relative">
                        <Textarea 
                          placeholder="Write your response here..." 
                          className="min-h-[100px] bg-background resize-none pr-12"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3">
                           <Button 
                             size="icon" 
                             variant={isRecording ? "destructive" : "secondary"} 
                             className={`h-8 w-8 rounded-full transition-all ${isRecording ? 'animate-pulse' : ''}`}
                             onClick={isRecording ? stopRecording : startRecording}
                           >
                             {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                           </Button>
                        </div>
                      </div>
                      
                      {isRecording && (
                        <div className="flex items-center gap-2 text-xs text-red-500 font-mono animate-pulse">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          Recording: {formatTime(recordingTime)}
                        </div>
                      )}

                      {audioBlob && (
                        <div className="flex items-center gap-2 p-2 bg-background border rounded-md">
                           <Button size="icon" variant="ghost" className="h-6 w-6"><Play className="h-3 w-3" /></Button>
                           <span className="text-xs font-mono flex-1">Voice Reply Recorded</span>
                           <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-red-500" onClick={() => setAudioBlob(null)}>&times;</Button>
                        </div>
                      )}

                      <div className="flex justify-end gap-3">
                         <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
                         <Button size="sm" onClick={() => handleReply(review.id)} disabled={isSending}>
                            {isSending ? "Sending..." : (
                               <span className="flex items-center gap-2">
                                 <Send className="h-3.5 w-3.5" /> 
                                 {audioBlob ? 'Send Voice Reply' : 'Send Text Reply'}
                               </span>
                            )}
                         </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* REWARD MODAL */}
      <Dialog open={rewardOpen} onOpenChange={setRewardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Customer Reward</DialogTitle>
            <DialogDescription>Transfer points or cash to customer wallet.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="points" onValueChange={(v) => setRewardType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="cash">Cash Balance</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input 
                type="number" 
                placeholder={rewardType === 'cash' ? "0.00" : "0"} 
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Textarea 
                placeholder="Thank you for your feedback!" 
                value={rewardMessage}
                onChange={(e) => setRewardMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRewardSubmit}>Send Reward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHARE MODAL */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Review</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="internal" onValueChange={setShareType}>
             <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="internal">Internal</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
             </TabsList>
             
             <TabsContent value="internal" className="space-y-4">
                <div className="space-y-2">
                   <Label>Select Team Member</Label>
                   <Select>
                     <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="emp_1">John Manager</SelectItem>
                       <SelectItem value="emp_2">Sarah Support</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
             </TabsContent>

             <TabsContent value="whatsapp" className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm text-center">
                   <Smartphone className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                   <p>A WhatsApp link will be generated with the review details.</p>
                </div>
             </TabsContent>

             <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                   <Label>Recipient Email</Label>
                   <Input 
                      placeholder="colleague@example.com" 
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                   />
                </div>
             </TabsContent>

             <DialogFooter className="mt-4">
                <Button onClick={handleShareSubmit} className="w-full">
                   <Share2 className="h-4 w-4 mr-2" /> Share Now
                </Button>
             </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* INTERNAL NOTE MODAL */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
            <DialogDescription>Notes are only visible to staff members.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="e.g. VIP Customer, visit often..." 
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteReview}>Delete Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
