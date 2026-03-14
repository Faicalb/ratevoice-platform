export interface SmartReport {
  summary: string;
  keyInsights: string[];
  metrics: {
    revenue: { value: number; change: number };
    bookings: { value: number; change: number };
    sentiment: { value: number; change: number };
  };
  generatedAt: string;
}

export const reportsApi = {
  getSmartSummary: async (): Promise<SmartReport> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      summary: "This week showed a 15% increase in bookings driven by the 'Summer Special' campaign. Customer sentiment remains positive, though response times have slightly increased during peak hours.",
      keyInsights: [
        "Weekend dinner slots are 95% booked for the next 2 weeks.",
        "Positive reviews mention 'cocktail menu' frequently.",
        "Staff response time dropped by 5% on Friday nights."
      ],
      metrics: {
        revenue: { value: 12500, change: 12 },
        bookings: { value: 450, change: 8 },
        sentiment: { value: 92, change: 2 }
      },
      generatedAt: new Date().toISOString()
    }), 2000));
  }
};
