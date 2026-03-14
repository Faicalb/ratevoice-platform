export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'promotion' | 'event' | 'announcement';
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'ended';
  attendees?: number;
  reach?: number;
}

export const eventsApi = {
  getEvents: async (): Promise<Event[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([
      {
        id: 'EVT-001',
        title: 'Valentine\'s Dinner Special',
        description: 'Exclusive 5-course meal for couples.',
        type: 'event',
        startDate: '2024-02-14T18:00:00',
        endDate: '2024-02-14T23:00:00',
        status: 'ended',
        attendees: 120,
        reach: 5400
      },
      {
        id: 'EVT-002',
        title: 'Spring Menu Launch',
        description: 'Introducing our new seasonal dishes.',
        type: 'announcement',
        startDate: '2024-03-20T09:00:00',
        endDate: '2024-03-27T09:00:00',
        status: 'active',
        reach: 2300
      },
      {
        id: 'EVT-003',
        title: 'Happy Hour 50% Off',
        description: 'Half price on all cocktails.',
        type: 'promotion',
        startDate: '2024-03-22T17:00:00',
        endDate: '2024-03-22T19:00:00',
        status: 'scheduled'
      }
    ]), 1000));
  },

  createEvent: async (data: Partial<Event>) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
  }
};
