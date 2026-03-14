'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, AlertTriangle, CheckCircle, Search, Server, Shield, XCircle } from 'lucide-react';
import { adminFeaturesApi, SystemFeature } from '@/lib/api/admin/features';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [features, setFeatures] = useState<SystemFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFeatures = async () => {
    try {
      const data = await adminFeaturesApi.getFeatures();
      setFeatures(data);
    } catch (error) {
      toast.error('Failed to load system features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const filteredFeatures = features.filter(feature => 
    feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'maintenance': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'degraded': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'maintenance': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'degraded': return <Activity className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Dashboard...</div>;
  }

  const stats = {
    total: features.length,
    active: features.filter(f => f.status === 'active').length,
    issues: features.filter(f => ['critical', 'degraded'].includes(f.status)).length,
    avgLoad: Math.round(features.reduce((acc, curr) => acc + curr.load, 0) / features.length || 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground">Overview of all system features and services status.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Across all platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{Math.round((stats.active / stats.total) * 100)}% uptime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.issues}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Load</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLoad}%</div>
            <p className="text-xs text-muted-foreground">System-wide average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Features</CardTitle>
              <CardDescription>Manage and monitor system features status.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Load</TableHead>
                <TableHead>Error Rate</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(feature.status)}
                      <Badge variant="outline" className={getStatusColor(feature.status)}>
                        {feature.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-xs text-muted-foreground">{feature.key}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {feature.category.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${feature.load > 80 ? 'bg-red-500' : feature.load > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${feature.load}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{feature.load}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`${feature.errorRate > 1 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {feature.errorRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{feature.version}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(feature.lastUpdated).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
