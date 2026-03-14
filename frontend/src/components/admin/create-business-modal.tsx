import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Search, MapPin, Building2, User, Globe, Phone, Mail, 
  Sparkles, AlertTriangle, CheckCircle2, ArrowRight, Loader2, ArrowLeft
} from 'lucide-react';
import { adminBusinessApi } from '@/lib/api/admin/businesses';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

interface CreateBusinessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, title: 'Search & Import' },
  { id: 2, title: 'Review & Edit' },
  { id: 3, title: 'Owner & Settings' }
];

export function CreateBusinessModal({ open, onOpenChange, onSuccess }: CreateBusinessModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Restaurant',
    address: '',
    city: '',
    country: '',
    latitude: 0,
    longitude: 0,
    googleMapsLink: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    
    verificationStatus: 'Verified',
    subscriptionPlan: 'Pro',
    initialWalletBalance: 0,
    allowPointsPayment: true,
    enableReservations: true,
    sendInvitation: true
  });

  const [duplicates, setDuplicates] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const results = await adminBusinessApi.searchPlaces(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error('Failed to search places');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlace = async (place: any) => {
    setSelectedPlace(place);
    setIsLoading(true);
    
    // Simulate smart parsing of address components (simplified)
    const addressParts = place.formatted_address?.split(',') || [];
    const city = addressParts.length > 2 ? addressParts[addressParts.length - 3].trim() : '';
    const country = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : '';

    setFormData(prev => ({
      ...prev,
      businessName: place.name,
      address: place.formatted_address,
      latitude: place.geometry?.location?.lat || 0,
      longitude: place.geometry?.location?.lng || 0,
      businessType: place.types?.[0] || 'Business',
      city,
      country,
      googleMapsLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
    }));

    // Check duplicates
    try {
      const dups = await adminBusinessApi.detectDuplicates(
        place.name, 
        place.geometry?.location?.lat, 
        place.geometry?.location?.lng
      );
      setDuplicates(dups);
    } catch (e) {
      console.error('Duplicate check failed');
    }

    setIsLoading(false);
    setStep(2);
  };

  const handleManualEntry = () => {
    setSelectedPlace(null);
    setSearchResults([]);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.businessName || !formData.ownerEmail) {
      toast.error('Business Name and Owner Email are required');
      return;
    }

    setIsLoading(true);
    try {
      await adminBusinessApi.createBusinessManual(formData);
      toast.success('Business created successfully!');
      onSuccess();
      onOpenChange(false);
      // Reset form
      setStep(1);
      setFormData({
        businessName: '',
        businessType: 'Restaurant',
        address: '',
        city: '',
        country: '',
        latitude: 0,
        longitude: 0,
        googleMapsLink: '',
        email: '',
        phone: '',
        website: '',
        description: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        verificationStatus: 'Verified',
        subscriptionPlan: 'Pro',
        initialWalletBalance: 0,
        allowPointsPayment: true,
        enableReservations: true,
        sendInvitation: true
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create business');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/5">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Assisted Business Creation
            </DialogTitle>
            <DialogDescription>
              Create a new business entity with automated data completion.
            </DialogDescription>
          </DialogHeader>
          
          {/* Steps Indicator */}
          <div className="flex items-center gap-2 mt-6">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 text-sm font-medium ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border 
                    ${step >= s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}>
                    {s.id}
                  </div>
                  {s.title}
                </div>
                {idx < STEPS.length - 1 && <div className={`h-px w-8 ${step > s.id ? 'bg-primary' : 'bg-border'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-background">
          {step === 1 && (
            <div className="p-8 max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold">Find Business on Google Maps</h3>
                <p className="text-sm text-muted-foreground">Search by name or address to auto-import details.</p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Starbucks New York" 
                    className="pl-9 h-12 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button size="lg" className="h-12 px-8" onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              <div className="space-y-3">
                {searchResults.map((place) => (
                  <div 
                    key={place.place_id} 
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all"
                    onClick={() => handleSelectPlace(place)}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{place.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{place.formatted_address}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] h-5">{place.types?.[0]}</Badge>
                        {place.rating && <Badge variant="outline" className="text-[10px] h-5">⭐ {place.rating}</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">Select</Button>
                  </div>
                ))}
                
                {searchResults.length === 0 && !isLoading && (
                  <div className="text-center pt-8">
                    <Button variant="link" onClick={handleManualEntry} className="text-muted-foreground hover:text-primary">
                      Skip search and enter manually <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 space-y-6">
              {duplicates.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-500">Potential Duplicates Detected</h4>
                    <p className="text-xs text-amber-600/80 mb-2">We found similar businesses in the database.</p>
                    <div className="space-y-1">
                      {duplicates.map((d: any) => (
                        <div key={d.id} className="text-xs bg-background/50 p-2 rounded border border-amber-500/10">
                          <span className="font-bold">{d.name}</span> <span className="text-muted-foreground">(Owner: {d.owner})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Basic Info
                  </h4>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={formData.businessType} onChange={(e) => setFormData({...formData, businessType: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input className="pl-9" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (AI Generated)</Label>
                    <Textarea 
                      rows={4} 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter description..."
                    />
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary" onClick={() => setFormData({...formData, description: `Welcome to ${formData.businessName}. We offer excellent service.`})}>
                      <Sparkles className="h-3 w-3 mr-1" /> Generate with AI
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </h4>
                  <div className="space-y-2">
                    <Label>Full Address</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input type="number" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input type="number" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Owner Account
                  </h4>
                  <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={formData.ownerName} onChange={(e) => setFormData({...formData, ownerName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input className="pl-9" value={formData.ownerEmail} onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input className="pl-9" value={formData.ownerPhone} onChange={(e) => setFormData({...formData, ownerPhone: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <Label className="cursor-pointer">Send Invitation Email</Label>
                        <Switch checked={formData.sendInvitation} onCheckedChange={(c) => setFormData({...formData, sendInvitation: c})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Verification</Label>
                            <Select value={formData.verificationStatus} onValueChange={(v) => setFormData({...formData, verificationStatus: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Verified">Verified</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select value={formData.subscriptionPlan} onValueChange={(v) => setFormData({...formData, subscriptionPlan: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Free">Free</SelectItem>
                                    <SelectItem value="Pro">Pro</SelectItem>
                                    <SelectItem value="Premium">Premium</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Initial Wallet Balance ($)</Label>
                        <Input type="number" value={formData.initialWalletBalance} onChange={(e) => setFormData({...formData, initialWalletBalance: Number(e.target.value)})} />
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <Label className="font-normal">Allow Points Payment</Label>
                            <Switch checked={formData.allowPointsPayment} onCheckedChange={(c) => setFormData({...formData, allowPointsPayment: c})} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="font-normal">Enable Reservations</Label>
                            <Switch checked={formData.enableReservations} onCheckedChange={(c) => setFormData({...formData, enableReservations: c})} />
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/5">
          <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={() => step === 1 ? onOpenChange(false) : setStep(step - 1)} disabled={isLoading}>
              {step === 1 ? 'Cancel' : <><ArrowLeft className="mr-2 h-4 w-4" /> Back</>}
            </Button>
            
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !selectedPlace}>
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Create Business
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}