export interface ReputationData {
  score: number;
  grade: 'Excellent' | 'Good' | 'Average' | 'Poor';
  history: Array<{ date: string; score: number }>;
  breakdown: {
    service: number;
    cleanliness: number;
    value: number;
    location: number;
  };
  interactionRate: number; // Percentage
  totalInteractions: number;
  responseSpeed: 'Fast' | 'Average' | 'Slow';
}

export const reputationApi = {
  getReputation: async (): Promise<ReputationData> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      score: 8.7,
      grade: 'Excellent',
      history: [
        { date: 'Jan', score: 8.2 },
        { date: 'Feb', score: 8.4 },
        { date: 'Mar', score: 8.5 },
        { date: 'Apr', score: 8.7 },
      ],
      breakdown: {
        service: 9.2,
        cleanliness: 8.8,
        value: 8.5,
        location: 9.5
      },
      interactionRate: 94,
      totalInteractions: 1250,
      responseSpeed: 'Fast'
    }), 1000));
  }
};
