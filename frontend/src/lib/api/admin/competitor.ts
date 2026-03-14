import api from '../api';

export interface CompetitorData {
  id: string;
  name: string;
  industry: string;
  marketShare: number;
  visibility: 'visible' | 'hidden';
  rating: number;
  lastAnalysis: string;
}

export async function getCompetitorData(): Promise<CompetitorData[]> {
  const res = await api.get('/admin/competitors');
  return (res.data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    industry: c.industry || '',
    marketShare: Number(c.marketShare || 0),
    visibility: c.isVisible === false ? 'hidden' : 'visible',
    rating: Number(c.rating || 0),
    lastAnalysis: c.lastAnalysis || c.trackedSince
  }));
}

export async function updateCompetitorVisibility(id: string, visibility: 'visible' | 'hidden'): Promise<void> {
  await api.patch(`/admin/competitors/${id}/visibility`, { visibility });
}

export async function updateCompetitorData(id: string, data: Partial<CompetitorData>): Promise<void> {
  await api.patch(`/admin/competitors/${id}`, data);
}
