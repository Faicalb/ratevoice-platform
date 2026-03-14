import { delay } from './utils';

export interface SeoProfile {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  canonicalUrl: string;
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
}

export interface StructuredData {
  type: 'Hotel' | 'Restaurant' | 'LocalBusiness';
  name: string;
  description: string;
  image: string;
  telephone: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  priceRange: string;
  ratingValue: number;
  reviewCount: number;
  openingHours: string[];
}

export interface LocalSeo {
  googleMapsUrl: string;
  coordinates: string;
  nearbyLandmarks: string[];
  localKeywords: string[];
}

export interface SeoPerformance {
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number;
  history: { date: string; impressions: number; clicks: number }[];
}

export interface SeoData {
  profile: SeoProfile;
  schema: StructuredData;
  local: LocalSeo;
  performance: SeoPerformance;
  score: number;
  recommendations: string[];
}

const mockSeoData: SeoData = {
  profile: {
    title: 'Grand Hotel Palace - Luxury Stay in Marrakech',
    description: 'Experience 5-star luxury at Grand Hotel Palace in the heart of Marrakech. Featuring spa, fine dining, and breathtaking views of the Atlas Mountains.',
    keywords: ['luxury hotel', 'marrakech resort', 'spa hotel', '5 star accommodation'],
    slug: 'grand-hotel-palace-marrakech',
    canonicalUrl: 'https://ratevoice.ai/hotel/grand-hotel-palace-marrakech',
    ogImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
    twitterCard: 'summary_large_image'
  },
  schema: {
    type: 'Hotel',
    name: 'Grand Hotel Palace',
    description: 'A luxury 5-star hotel in Marrakech.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    telephone: '+212 524 000 000',
    address: {
      streetAddress: 'Ave Mohammed VI',
      addressLocality: 'Marrakech',
      addressRegion: 'Marrakech-Safi',
      postalCode: '40000',
      addressCountry: 'MA'
    },
    geo: {
      latitude: 31.6295,
      longitude: -7.9811
    },
    priceRange: '$$$$',
    ratingValue: 4.8,
    reviewCount: 1250,
    openingHours: ['Mo-Su 00:00-23:59']
  },
  local: {
    googleMapsUrl: 'https://maps.google.com/?q=31.6295,-7.9811',
    coordinates: '31.6295, -7.9811',
    nearbyLandmarks: ['Jemaa el-Fnaa', 'Koutoubia Mosque', 'Menara Gardens'],
    localKeywords: ['hotel near medina', 'best riad marrakech']
  },
  performance: {
    impressions: 12500,
    clicks: 450,
    ctr: 3.6,
    averagePosition: 12.5,
    history: [
      { date: '2024-03-01', impressions: 400, clicks: 12 },
      { date: '2024-03-02', impressions: 450, clicks: 15 },
      { date: '2024-03-03', impressions: 380, clicks: 10 },
      { date: '2024-03-04', impressions: 520, clicks: 22 },
      { date: '2024-03-05', impressions: 480, clicks: 18 },
      { date: '2024-03-06', impressions: 600, clicks: 25 },
      { date: '2024-03-07', impressions: 550, clicks: 20 },
    ]
  },
  score: 85,
  recommendations: [
    'Add "Morocco" to page title for better local ranking',
    'Description length is optimal (155 chars)',
    'Add 2 more photos to Schema markup',
    'Keyword "luxury" appears 3 times (Good)'
  ]
};

export const seoApi = {
  getSeoSettings: async (): Promise<SeoData> => {
    await delay(1000);
    return { ...mockSeoData };
  },

  updateSeoSettings: async (data: Partial<SeoData>) => {
    await delay(1500);
    // Simulate updating mock data
    if (data.profile) mockSeoData.profile = { ...mockSeoData.profile, ...data.profile };
    if (data.schema) mockSeoData.schema = { ...mockSeoData.schema, ...data.schema };
    if (data.local) mockSeoData.local = { ...mockSeoData.local, ...data.local };
    
    // Recalculate score (mock logic)
    let newScore = 70;
    if (mockSeoData.profile.title.length >= 50 && mockSeoData.profile.title.length <= 60) newScore += 10;
    if (mockSeoData.profile.description.length >= 150 && mockSeoData.profile.description.length <= 160) newScore += 10;
    if (mockSeoData.profile.keywords.length >= 5) newScore += 10;
    mockSeoData.score = Math.min(100, newScore);

    return { success: true, score: mockSeoData.score };
  },

  generateAiKeywords: async (category: string, city: string): Promise<string[]> => {
    await delay(1200);
    return [
      `Best ${category} in ${city}`,
      `Luxury ${category} ${city}`,
      `${category} near me`,
      `Top rated ${category} ${city}`,
      `Affordable ${category} ${city}`
    ];
  }
};
