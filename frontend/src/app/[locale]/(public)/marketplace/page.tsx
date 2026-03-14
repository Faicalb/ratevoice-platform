import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SERVICES = [
    {
        id: 1,
        title: "Professional Hotel Photography",
        ambassador: "Sarah Jenkins",
        rating: 4.9,
        reviews: 120,
        price: "$200",
        location: "New York, NY",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        title: "Social Media Management",
        ambassador: "Creative Agency X",
        rating: 4.8,
        reviews: 85,
        price: "$500/mo",
        location: "Remote",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        title: "Local Food Tour Hosting",
        ambassador: "Mike Chen",
        rating: 5.0,
        reviews: 200,
        price: "$50/hr",
        location: "San Francisco, CA",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        title: "Interior Design Consultation",
        ambassador: "Elena Design",
        rating: 4.7,
        reviews: 45,
        price: "$150",
        location: "London, UK",
        image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
    }
];

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20">
          <div className="app-container text-center">
              <h1 className="text-5xl font-bold mb-6">Ambassador Marketplace</h1>
              <p className="text-xl text-slate-300 mb-8 mx-auto max-w-2xl lg:max-w-3xl xxl:max-w-4xl">
                  Connect with top-rated local experts to elevate your hospitality business. 
                  Photography, marketing, consulting, and more.
              </p>
              
              <div className="relative mx-auto w-full max-w-xl md:max-w-2xl xxl:max-w-3xl">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="Search for services (e.g. 'Photography', 'Marketing')" 
                    className="pl-10 h-12 bg-white text-slate-900 border-0"
                  />
              </div>
          </div>
      </div>

      {/* Services Grid */}
      <div className="app-container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SERVICES.map((service) => (
                  <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 overflow-hidden">
                          <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                      </div>
                      <CardHeader className="p-4">
                          <div className="flex justify-between items-start mb-2">
                              <Badge variant="secondary" className="text-xs font-normal">Service</Badge>
                              <div className="flex items-center text-yellow-500 text-sm">
                                  <Star className="h-3 w-3 fill-current mr-1" />
                                  {service.rating} ({service.reviews})
                              </div>
                          </div>
                          <CardTitle className="text-lg line-clamp-1">{service.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {service.location}
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                          <p className="text-sm text-slate-500">by <span className="font-medium text-slate-900">{service.ambassador}</span></p>
                      </CardContent>
                      <CardFooter className="p-4 border-t flex justify-between items-center bg-slate-50/50">
                          <span className="font-bold text-lg">{service.price}</span>
                          <Button size="sm">Book Now</Button>
                      </CardFooter>
                  </Card>
              ))}
          </div>
      </div>
    </div>
  );
}
