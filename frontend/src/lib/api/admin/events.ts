import api from '../api';

export interface EventNews {
  id: string;
  title: string;
  type: 'event' | 'news' | 'promotion';
  publisher: string;
  status: 'active' | 'pending' | 'rejected';
  publishDate: string;
  views: number;
}

export async function getEvents(): Promise<EventNews[]> {
  const [eventsRes, newsRes] = await Promise.all([api.get('/admin/events'), api.get('/admin/news')]);
  const events = (eventsRes.data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    type: 'event',
    publisher: e.source || 'Admin',
    status: e.status === 'PUBLISHED' ? 'active' : e.status === 'DRAFT' ? 'pending' : 'rejected',
    publishDate: e.createdAt,
    views: 0
  }));
  const news = (newsRes.data || []).map((n: any) => ({
    id: n.id,
    title: n.title,
    type: 'news',
    publisher: n.source || 'Admin',
    status: n.status === 'PUBLISHED' ? 'active' : n.status === 'DRAFT' ? 'pending' : 'rejected',
    publishDate: n.createdAt,
    views: 0
  }));
  return [...events, ...news].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

export async function updateEventStatus(id: string, status: EventNews['status']): Promise<void> {
  const mapped = status === 'active' ? 'PUBLISHED' : status === 'pending' ? 'DRAFT' : 'ARCHIVED';
  try {
    await api.patch(`/admin/events/${id}/status`, { status: mapped });
    return;
  } catch (e: any) {
    await api.patch(`/admin/news/${id}/status`, { status: mapped });
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await api.delete(`/admin/events/${id}`);
    return;
  } catch (e: any) {
    await api.delete(`/admin/news/${id}`);
  }
}
