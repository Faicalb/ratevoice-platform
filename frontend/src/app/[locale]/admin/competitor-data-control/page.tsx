'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { Database, Eye, EyeOff, BarChart2, RefreshCw } from 'lucide-react';
import { getCompetitorData, updateCompetitorVisibility, CompetitorData } from '@/lib/api/admin/competitor';
import { toast } from 'sonner';

export default function CompetitorDataControlPage() {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await getCompetitorData();
      setCompetitors(data);
    } catch (error) {
      toast.error('Failed to load competitor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVisibilityToggle = async (id: string, currentVisibility: CompetitorData['visibility']) => {
    const newVisibility = currentVisibility === 'visible' ? 'hidden' : 'visible';
    try {
      await updateCompetitorVisibility(id, newVisibility);
      setCompetitors(competitors.map(c => c.id === id ? { ...c, visibility: newVisibility } : c));
      toast.success(`Competitor is now ${newVisibility}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Competitor Name',
      cell: (row: CompetitorData) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'industry',
      header: 'Industry',
    },
    {
      key: 'marketShare',
      header: 'Market Share',
      cell: (row: CompetitorData) => `${row.marketShare}%`,
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (row: CompetitorData) => (
        <Badge variant="outline">
          {row.rating} / 5.0
        </Badge>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibility',
      cell: (row: CompetitorData) => {
        const visibility = row.visibility;
        return (
          <Badge variant={visibility === 'visible' ? 'default' : 'secondary'}>
            {visibility}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      cell: (row: CompetitorData) => {
        const item = row;
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleVisibilityToggle(item.id, item.visibility)}
            >
              {item.visibility === 'visible' ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitor Data Control</h1>
          <p className="text-muted-foreground">Manage and clean competitor analysis data sources.</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible to Users</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {competitors.filter(c => c.visibility === 'visible').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Market Share</CardTitle>
            <BarChart2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(competitors.reduce((acc, c) => acc + c.marketShare, 0) / (competitors.length || 1)).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Competitor Database</CardTitle>
          <CardDescription>View and manage competitor data availability.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading competitor data...</div>
          ) : (
            // @ts-ignore - Ignoring DataTable type mismatch for quick fix
            <DataTable columns={columns} data={competitors} title="Competitors" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
