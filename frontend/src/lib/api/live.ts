export interface LiveStream {
  id: string;
  title: string;
  hostName: string;
  status: 'live' | 'scheduled' | 'ended';
  viewers: number;
  duration: string; // HH:MM:SS
  startTime?: string;
  reactions: {
    love: number;
    like: number;
    fire: number;
  };
  comments: Array<{
    id: string;
    user: string;
    message: string;
    timestamp: string;
  }>;
}

export const liveApi = {
  getLiveStatus: async (): Promise<LiveStream | null> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      id: 'LIVE-001',
      title: 'Grand Opening Celebration',
      hostName: 'Chef Gordon',
      status: 'live',
      viewers: 1245,
      duration: '00:15:32',
      startTime: new Date().toISOString(),
      reactions: {
        love: 450,
        like: 890,
        fire: 320
      },
      comments: [
        { id: '1', user: 'Sarah J.', message: 'Looks amazing! 😍', timestamp: 'Just now' },
        { id: '2', user: 'Mike T.', message: 'Can we book a table for tonight?', timestamp: '1m ago' },
        { id: '3', user: 'Traveler99', message: 'Greetings from London!', timestamp: '2m ago' }
      ]
    }), 1000));
  },

  startStream: async (title: string) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, streamId: 'LIVE-NEW' }), 1500));
  },

  endStream: async (id: string) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  },

  sendMessage: async (message: string) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  }
};
