'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BrainCircuit, Cpu, Zap, Activity, Save } from 'lucide-react';
import { getAISettings, updateAISettings, AISettings } from '@/lib/api/admin/ai-engine';
import { toast } from 'sonner';

export default function AiEngineControlPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await getAISettings();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateAISettings(settings);
      toast.success('AI Engine configuration saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center">Loading AI Engine Configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Engine Control</h1>
          <p className="text-muted-foreground">Configure and fine-tune global AI models and sensitivity.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Requests</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.usage.dailyRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
            <span className="text-sm font-bold">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${settings.usage.cost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Within budget limits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.usage.errorRate}%</div>
            <p className="text-xs text-muted-foreground">Optimal performance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model Configuration</CardTitle>
            <CardDescription>Select underlying models for specific tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Sentiment Analysis Model</Label>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-muted-foreground" />
                <Input 
                  value={settings.models.sentiment} 
                  onChange={(e) => setSettings({ ...settings, models: { ...settings.models, sentiment: e.target.value } })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image Generation Model</Label>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <Input 
                  value={settings.models.image} 
                  onChange={(e) => setSettings({ ...settings, models: { ...settings.models, image: e.target.value } })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recommendation Engine</Label>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <Input 
                  value={settings.models.recommendation} 
                  onChange={(e) => setSettings({ ...settings, models: { ...settings.models, recommendation: e.target.value } })} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Sensitivity & Features</CardTitle>
            <CardDescription>Fine-tune AI behavior and active features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Analysis Sensitivity ({settings.sensitivity}%)</Label>
                <Badge variant="outline">{settings.sensitivity > 80 ? 'Strict' : settings.sensitivity < 50 ? 'Loose' : 'Balanced'}</Badge>
              </div>
              <Slider 
                value={[settings.sensitivity]} 
                max={100} 
                step={1} 
                onValueChange={(val) => setSettings({ ...settings, sensitivity: (val as number[])[0] })} 
              />
              <p className="text-xs text-muted-foreground">
                Higher sensitivity flags more content for manual review but may increase false positives.
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label>Voice AI Processing</Label>
                <p className="text-xs text-muted-foreground">Enable transcription and sentiment analysis for voice reviews.</p>
              </div>
              <Switch 
                checked={settings.voiceEnabled} 
                onCheckedChange={(checked) => setSettings({ ...settings, voiceEnabled: checked })} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
