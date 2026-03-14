'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  ArrowRight,
  Play,
  Globe,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  Building2,
  Star,
  Check,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/language-switcher';
import { CurrencySwitcher } from '@/components/currency-switcher';
import { useCurrency } from '@/contexts/currency-context';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Navigation */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="app-container h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-2 shrink-0 shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">RateVoice</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Platform', 'Features', 'Pricing', 'Docs'].map((item) => (
              <Link 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-white/10">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-white text-black hover:bg-slate-200 rounded-full px-6 font-semibold">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-[#050505] border-b border-white/10 p-6 flex flex-col gap-4">
            {['Platform', 'Features', 'Pricing', 'Docs'].map((item) => (
              <Link 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-lg font-medium text-slate-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex items-center gap-4 justify-between">
               <LanguageSwitcher />
               <CurrencySwitcher />
            </div>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-white text-black">Get Started</Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20">
        
        {/* SECTION 1: HERO */}
        <section className="relative pt-20 pb-32 lg:pt-32 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <div className="absolute top-[10%] left-[20%] w-[min(500px,60vw)] h-[min(500px,60vw)] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute top-[20%] right-[20%] w-[min(400px,50vw)] h-[min(400px,50vw)] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen" />
          </div>

          <div className="app-container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider">
                  New Generation Intelligence
                </Badge>
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                  AI Hospitality <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                    Intelligence Platform
                  </span>
                </h1>
                
                <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                  RateVoice converts customer voice feedback into powerful AI insights that help hotels and restaurants improve service and increase bookings.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="h-14 px-8 bg-white text-black hover:bg-slate-200 rounded-full font-bold text-sm">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 text-white hover:bg-white/5 rounded-full font-bold text-sm">
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Watch Demo
                  </Button>
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center gap-6">
                  <div className="flex -space-x-3">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="h-10 w-10 rounded-full border-2 border-[#050505] bg-slate-800 overflow-hidden">
                         <img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="User" />
                       </div>
                     ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />)}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Trusted by 40K+ businesses</p>
                  </div>
                </div>
              </motion.div>

              {/* Dashboard Preview (Right Side) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative"
              >
                <div className="relative z-10 rounded-2xl border border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md shadow-2xl overflow-hidden aspect-[4/3]">
                  {/* Mock Dashboard UI */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  <div className="p-4 border-b border-white/5 flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/50" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                      <div className="h-3 w-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="h-6 w-64 bg-white/5 rounded-full" />
                  </div>
                  <div className="p-6 grid gap-6">
                    <div className="grid grid-cols-3 gap-4">
                       {[1,2,3].map(i => (
                         <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/5 p-4 space-y-2">
                           <div className="h-2 w-12 bg-white/10 rounded-full" />
                           <div className="h-8 w-20 bg-white/10 rounded-md" />
                         </div>
                       ))}
                    </div>
                    <div className="flex gap-6 h-64">
                       <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-4 relative overflow-hidden">
                          {/* Mock Chart */}
                          <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end justify-between px-4 pb-4 gap-2">
                             {[40, 60, 45, 70, 50, 80, 65, 90].map((h, i) => (
                               <motion.div 
                                 key={i}
                                 initial={{ height: 0 }}
                                 animate={{ height: `${h}%` }}
                                 transition={{ duration: 1.5, delay: i * 0.1 }}
                                 className="w-full bg-purple-500/30 rounded-t-sm"
                               />
                             ))}
                          </div>
                       </div>
                       <div className="w-1/3 rounded-xl bg-white/5 border border-white/5 p-4 space-y-4">
                          <div className="h-4 w-24 bg-white/10 rounded-full" />
                          {[1,2,3].map(i => (
                            <div key={i} className="h-12 rounded-lg bg-white/5" />
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 -bottom-8 p-4 rounded-2xl bg-[#141414] border border-white/10 shadow-xl flex items-center gap-3"
                >
                   <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                     <TrendingUp className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-xs text-slate-500">Revenue</p>
                     <p className="text-lg font-bold text-white">+24.5%</p>
                   </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PLATFORM STATS */}
        <section className="py-20 border-y border-white/5 bg-white/[0.02]">
          <div className="app-container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: 'Voice Reviews Analyzed', value: '2M+' },
                { label: 'Hospitality Businesses', value: '40K+' },
                { label: 'Countries', value: '120+' },
                { label: 'AI Sentiment Accuracy', value: '98%' },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="text-4xl font-bold text-white tracking-tight">{stat.value}</h3>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: AI CAPABILITIES */}
        <section id="features" className="py-32 relative">
          <div className="app-container">
            <div className="text-center mx-auto max-w-3xl lg:max-w-4xl xxl:max-w-5xl mb-20 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold text-white">Powerful AI Capabilities</h2>
              <p className="text-slate-400 text-lg">
                Leverage our advanced neural engine to decode customer sentiment and drive operational excellence.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: MessageSquare, title: 'Voice Review Analyzer', desc: 'Transcribe and analyze voice feedback instantly.' },
                { icon: BrainCircuit, title: 'AI Sentiment Detection', desc: 'Understand the emotion behind every guest interaction.' },
                { icon: TrendingUp, title: 'Booking Intelligence', desc: 'Predict demand and optimize booking flows.' },
                { icon: Users, title: 'CX Analytics', desc: 'Deep dive into customer experience metrics.' },
                { icon: Globe, title: 'Market Intelligence', desc: 'Compare your performance against local competitors.' },
                { icon: Zap, title: 'AI Response Suggestions', desc: 'Generate perfect replies to reviews in seconds.' },
              ].map((feature, i) => (
                <Card key={i} className="bg-white/5 border-white/5 hover:border-purple-500/30 transition-colors backdrop-blur-sm">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: DASHBOARD PREVIEW */}
        <section className="py-20 bg-[#080808] border-y border-white/5">
           <div className="app-container">
              <div className="relative rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-[#0F0F0F]">
                 <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                 <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                       <div className="space-y-4">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Dashboard View</Badge>
                          <h3 className="text-3xl font-bold text-white">Real-time Command Center</h3>
                          <p className="text-slate-400 max-w-lg">Monitor your entire operation from a single, unified interface. Track reviews, revenue, and AI insights as they happen.</p>
                       </div>
                    </div>
                    
                    {/* Visual Representation of Dashboard */}
                    <div className="grid grid-cols-12 gap-6 aspect-[16/9] md:aspect-[21/9]">
                       {/* Sidebar Mock */}
                       <div className="hidden md:block col-span-2 bg-white/5 rounded-xl border border-white/5 p-4 space-y-4">
                          {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 w-full bg-white/5 rounded-lg" />)}
                       </div>
                       
                       {/* Main Area */}
                       <div className="col-span-12 md:col-span-10 space-y-6">
                          {/* Top Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5" />)}
                          </div>
                          {/* Map & Lists */}
                          <div className="grid grid-cols-3 gap-6 h-full min-h-[300px]">
                             <div className="col-span-2 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                                <Globe className="h-32 w-32 text-white/5" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                   <p className="text-sm font-mono text-slate-500">GLOBAL ANALYTICS MAP</p>
                                </div>
                             </div>
                             <div className="col-span-1 bg-white/5 rounded-xl border border-white/5 p-4 space-y-3">
                                <div className="h-4 w-20 bg-white/10 rounded-full mb-4" />
                                {[1,2,3,4].map(i => (
                                   <div key={i} className="h-16 bg-white/5 rounded-lg border border-white/5" />
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 5: PLATFORM CAPABILITIES */}
        <section className="py-32">
          <div className="app-container">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div className="space-y-8">
                  <h2 className="text-4xl font-bold text-white">Comprehensive Platform Modules</h2>
                  <div className="space-y-6">
                     {[
                        { title: 'Customer Voice Reviews', desc: 'Collect and manage feedback from multiple channels.' },
                        { title: 'Booking Management', desc: 'Streamline reservations with AI prediction.' },
                        { title: 'Marketing Campaign Tools', desc: 'Launch targeted campaigns based on guest segments.' },
                        { title: 'AI Analytics Engine', desc: 'Process millions of data points for actionable strategy.' },
                        { title: 'Market Intelligence', desc: 'Stay ahead of the competition with real-time benchmarking.' },
                     ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                           <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                              <Check className="h-3.5 w-3.5 text-purple-400" />
                           </div>
                           <div>
                              <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                              <p className="text-slate-400 text-sm">{item.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl rounded-full" />
                  <div className="relative bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 aspect-square flex items-center justify-center">
                     <BrainCircuit className="h-48 w-48 text-white/5" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Badge className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-2 text-lg">Core Engine</Badge>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: GLOBAL MAP */}
        <section className="py-20 bg-white/[0.02] border-y border-white/5">
           <div className="app-container text-center">
              <h2 className="text-3xl font-bold text-white mb-12">Global Reach</h2>
              <div className="relative w-full max-w-5xl lg:max-w-6xl xxl:max-w-7xl 3xl:max-w-[90rem] mx-auto aspect-[2/1] bg-[#0A0A0A] rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden">
                 {/* Abstract Map Visualization */}
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                 <Globe className="h-64 w-64 text-white/10 animate-pulse" />
                 
                 {/* Hotspots */}
                 <div className="absolute top-[30%] left-[25%] h-3 w-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" /> {/* USA */}
                 <div className="absolute top-[25%] left-[52%] h-3 w-3 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]" /> {/* Europe */}
                 <div className="absolute top-[40%] left-[58%] h-3 w-3 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]" /> {/* Middle East */}
                 <div className="absolute top-[35%] left-[75%] h-3 w-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)]" /> {/* Asia */}
                 
                 <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 text-xs font-mono text-slate-500">
                    <span>USA</span>
                    <span>EUROPE</span>
                    <span>MIDDLE EAST</span>
                    <span>ASIA</span>
                    <span>AFRICA</span>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 7: PRICING */}
        <section id="pricing" className="py-32">
          <div className="app-container">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-white mb-4">Transparent Pricing</h2>
              <p className="text-slate-400">Choose the perfect plan for your business growth.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 lg:gap-10 3xl:gap-12 items-stretch">
              <PricingCard 
                name="FREE PLAN" 
                price={0} 
                features={['Listen to 3 voice reviews', 'Basic analytics', 'Limited dashboard access']} 
              />
              <PricingCard 
                name="PROFESSIONAL" 
                price={29} 
                popular
                features={['Unlimited voice reviews', 'Reply to customer reviews', 'AI sentiment analysis', 'Booking management', 'Reports export']} 
              />
              <PricingCard 
                name="ENTERPRISE" 
                price="Custom" 
                features={['Multi-location management', 'Advanced analytics', 'API access', 'Dedicated support']} 
              />
            </div>
          </div>
        </section>

        {/* SECTION 8: CALL TO ACTION */}
        <section className="py-32 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none" />
           <div className="app-container relative z-10 text-center space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                 Start Transforming Guest <br /> Feedback Into Revenue
              </h2>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                 <Link href="/register">
                    <Button size="lg" className="h-16 px-12 bg-white text-black hover:bg-slate-200 rounded-full text-lg font-bold">
                       Create Account
                    </Button>
                 </Link>
                 <Button size="lg" variant="outline" className="h-16 px-12 border-white/20 text-white hover:bg-white/10 rounded-full text-lg font-bold">
                    Request Demo
                 </Button>
              </div>
           </div>
        </section>

      </main>

      {/* SECTION 11: FOOTER */}
      <footer className="bg-[#020202] border-t border-white/10 py-20">
         <div className="app-container">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
               <div className="col-span-1 md:col-span-2 space-y-6">
                  <div className="flex items-center gap-2">
                     <BrainCircuit className="h-6 w-6 text-white" />
                     <span className="font-bold text-xl text-white">RateVoice</span>
                  </div>
                  <p className="text-slate-500 max-w-sm">
                     The world-class AI hospitality intelligence platform. 
                     Empowering businesses to listen, analyze, and grow.
                  </p>
               </div>
               <div>
                  <h4 className="font-bold text-white mb-6">Platform</h4>
                  <ul className="space-y-4 text-sm text-slate-500">
                     <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold text-white mb-6">Company</h4>
                  <ul className="space-y-4 text-sm text-slate-500">
                     <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  </ul>
               </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
               <p>© 2025 RateVoice. Registered trademark of Kingdom AI. All rights reserved.</p>
               <div className="flex gap-6">
                  {/* Socials */}
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}

function PricingCard({ name, price, features, popular }: { name: string, price: number | string, features: string[], popular?: boolean }) {
  const { format, convert } = useCurrency();
  
  // Handle display price
  const displayPrice = typeof price === 'number' 
    ? format(convert(price))
    : price;

  return (
    <Card className={`relative flex flex-col ${popular ? 'bg-white/10 border-purple-500/50' : 'bg-white/5 border-white/5'} backdrop-blur-md`}>
       {popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
             <Badge className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1">MOST POPULAR</Badge>
          </div>
       )}
       <CardHeader className="text-center pb-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{name}</h3>
          <div className="flex items-baseline justify-center gap-1">
             <span className="text-4xl font-bold text-white">{displayPrice}</span>
             {typeof price === 'number' && <span className="text-slate-500">/mo</span>}
          </div>
       </CardHeader>
       <CardContent className="flex-1">
          <ul className="space-y-4">
             {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                   <Check className="h-5 w-5 text-purple-400 shrink-0" />
                   <span>{f}</span>
                </li>
             ))}
          </ul>
       </CardContent>
       <CardFooter>
          <Button className={`w-full h-12 font-bold ${popular ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
             Choose Plan
          </Button>
       </CardFooter>
    </Card>
  );
}
