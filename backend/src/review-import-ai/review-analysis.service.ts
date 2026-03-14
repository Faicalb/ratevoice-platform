import { Injectable, Logger } from '@nestjs/common';
import { AiAnalyticsService } from '../ai-analytics/ai-analytics.service';
// import { GoogleGenerativeAI } from '@google/generative-ai'; // Or reuse AiAnalytics logic

@Injectable()
export class ReviewAnalysisService {
  private readonly logger = new Logger(ReviewAnalysisService.name);

  constructor(private aiAnalytics: AiAnalyticsService) {}

  async analyzeReview(text: string, language: string = 'en') {
    return this.heuristicAnalysis(text);
  }

  private heuristicAnalysis(text: string) {
    const lower = text.toLowerCase();
    let score = 0;
    let label = 'NEUTRAL';
    const keywords: string[] = [];
    const topics: string[] = [];

    // Basic Keyword Sentiment
    if (lower.includes('great') || lower.includes('excellent') || lower.includes('amazing') || lower.includes('love')) {
      score = 0.9;
      label = 'POSITIVE';
    } else if (lower.includes('bad') || lower.includes('terrible') || lower.includes('hate') || lower.includes('dirty')) {
      score = -0.8;
      label = 'NEGATIVE';
    } else if (lower.includes('good') || lower.includes('okay')) {
      score = 0.5;
      label = 'POSITIVE';
    }

    // Topic Extraction
    if (lower.includes('food') || lower.includes('breakfast') || lower.includes('dinner')) topics.push('Food & Dining');
    if (lower.includes('clean') || lower.includes('dirty') || lower.includes('room')) topics.push('Cleanliness');
    if (lower.includes('staff') || lower.includes('service') || lower.includes('reception')) topics.push('Service');
    if (lower.includes('location') || lower.includes('view') || lower.includes('beach')) topics.push('Location');
    if (lower.includes('price') || lower.includes('value') || lower.includes('expensive')) topics.push('Value');

    return {
      sentimentScore: score,
      sentimentLabel: label,
      keywords: topics, // Simplified
      topics: topics
    };
  }

  async translateReview(text: string, sourceLang: string, targetLang: string = 'en') {
    if (sourceLang === targetLang) return text;
    return text;
  }
}
