import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyzeReviewDto } from './dto/analyze-review.dto';
import { ProviderResolverService } from '../api-gateway/services/provider-resolver.service';

@Injectable()
export class AiAnalyticsService {
    private readonly logger = new Logger(AiAnalyticsService.name);

    constructor(
        private prisma: PrismaService,
        private providerResolver: ProviderResolverService
    ) {}

    private async getAiModel() {
        // 1. Resolve Provider via Gateway
        const provider = await this.providerResolver.getBestProvider('AI');
        
        if (!provider) {
            return null;
        }

        try {
            if (provider.providerName.includes('Gemini') || provider.providerName.includes('Google')) {
                const genAI = new GoogleGenerativeAI(provider.apiKey);
                return {
                    providerId: provider.id,
                    model: genAI.getGenerativeModel({ model: 'gemini-pro' }),
                    type: 'GEMINI'
                };
            } else if (provider.providerName.includes('OpenAI')) {
                return { providerId: provider.id, model: null, type: 'OPENAI_PENDING' };
            }
        } catch (error) {
            this.logger.error(`Failed to initialize AI provider ${provider.providerName}`, error);
            await this.providerResolver.reportFailure(provider.id, error);
            return null;
        }
        
        return null;
    }

    async analyzeReview(dto: AnalyzeReviewDto) {
        const { reviewId, transcription } = dto;

        // 1. Check if review exists
        let reviewType = 'voice';
        let review = await this.prisma.voiceReview.findUnique({ where: { id: reviewId } });
        
        if (!review) {
            reviewType = 'text';
            review = await this.prisma.textReview.findUnique({ where: { id: reviewId } }) as any;
        }

        if (!review) throw new NotFoundException('Review not found');

        // 2. Perform AI Analysis
        let sentimentScore = 0;
        let sentimentLabel = 'NEUTRAL';
        let keywords: string[] = [];
        const aiInstance = await this.getAiModel();

        if (aiInstance && aiInstance.model && aiInstance.type === 'GEMINI') {
            const startTime = Date.now();
            try {
                const prompt = `
                    Analyze the sentiment of the following review text.
                    Text: "${transcription}"
                    
                    Return a JSON object with:
                    - score: number (-1 to 1, where -1 is negative, 1 is positive)
                    - label: string (POSITIVE, NEGATIVE, NEUTRAL)
                    - keywords: string[] (max 5 key topics)
                `;

                const result = await aiInstance.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(text);

                sentimentScore = analysis.score;
                sentimentLabel = analysis.label;
                keywords = analysis.keywords;

                // Log Success
                await this.providerResolver.reportSuccess(aiInstance.providerId, Date.now() - startTime);

            } catch (error) {
                this.logger.error('AI Analysis failed', error);
                await this.providerResolver.reportFailure(aiInstance.providerId, error);
                // Fallback logic below...
                this.fallbackAnalysis(transcription, (label, score) => {
                    sentimentLabel = label;
                    sentimentScore = score;
                });
            }
        } else {
             this.fallbackAnalysis(transcription, (label, score) => {
                sentimentLabel = label;
                sentimentScore = score;
            });
             keywords = [];
        }

        // 3. Save Results
        if (reviewType === 'voice') {
            return this.prisma.voiceReview.update({
                where: { id: reviewId },
                data: {
                    transcript: transcription,
                    sentiment: sentimentLabel,
                }
            });
        } else {
             return this.prisma.textReview.update({
                where: { id: reviewId },
                data: {
                    sentiment: sentimentLabel
                }
            });
        }
    }

    private fallbackAnalysis(text: string, callback: (label: string, score: number) => void) {
        if (text.toLowerCase().includes('good') || text.toLowerCase().includes('great')) {
            callback('POSITIVE', 0.8);
        } else if (text.toLowerCase().includes('bad') || text.toLowerCase().includes('poor')) {
            callback('NEGATIVE', -0.5);
        } else {
            callback('NEUTRAL', 0);
        }
    }

    // ... (Keep existing methods: getInsights, getDataWall, askAI, etc. but updated to use getAiModel())
    
    async getInsights() {
        const recentReviews = await this.prisma.textReview.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { content: true, rating: true, createdAt: true }
        });

        const aiInstance = await this.getAiModel();

        if (!aiInstance || !aiInstance.model || recentReviews.length === 0) {
            return [];
        }

        const startTime = Date.now();
        try {
            const prompt = `
        Analyze the following customer reviews for a hospitality business and generate 3 concise, actionable insights.
        
        Reviews:
        ${recentReviews.map(r => `- Rating ${r.rating}/5: "${r.content}"`).join('\n')}
        
        Format the output as a JSON array of objects with the following structure:
        [
          {
            "title": "Short Title (max 5 words)",
            "description": "One sentence description of the insight.",
            "type": "POSITIVE" | "NEGATIVE" | "NEUTRAL"
          }
        ]
        Do not include any markdown formatting like \`\`\`json. Just return the raw JSON array.
        `;

            const result = await aiInstance.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            let insights = JSON.parse(jsonString);

            await this.providerResolver.reportSuccess(aiInstance.providerId, Date.now() - startTime);

            if (Array.isArray(insights)) {
                return insights.map((insight, index) => ({
                    id: `ai-${Date.now()}-${index}`,
                    ...insight,
                    createdAt: new Date()
                }));
            } else {
                return [];
            }

        } catch (error) {
            this.logger.error('Failed to generate AI insights', error);
            await this.providerResolver.reportFailure(aiInstance.providerId, error);
            return [];
        }
    }

    async getDataWall() {
        this.logger.log('Aggregating AI Data Wall telemetry...');

        const [reviews, bookings, revenueData, competitors] = await Promise.all([
            this.prisma.textReview.findMany({ take: 100, orderBy: { createdAt: 'desc' } }),
            this.prisma.booking.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
            this.prisma.booking.aggregate({
                _sum: { totalAmount: true },
                _count: true,
            }),
            this.getCompetitorBenchmarking()
        ]);

        // Calculate Sentiment Index
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1);
        const sentimentIndex = (avgRating / 5) * 100;

        const revenueTrendRows: any = await this.prisma.$queryRaw`
            SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as day,
                   COALESCE(SUM("totalAmount"), 0) as revenue
            FROM "Booking"
            WHERE "createdAt" >= (now() - interval '10 days')
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        const revenueTrend = (Array.isArray(revenueTrendRows) ? revenueTrendRows : [])
          .map((r: any) => Number(r.revenue || 0))
          .slice(-10);

        const heatmapRows: any = await this.prisma.$queryRaw`
            SELECT extract(hour from "createdAt")::int as hour, COUNT(*)::int as count
            FROM "Booking"
            WHERE "createdAt" >= (now() - interval '24 hours')
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        const heatmap = new Array(24).fill(0);
        if (Array.isArray(heatmapRows)) {
          for (const r of heatmapRows) {
            const h = Number(r.hour);
            const c = Number(r.count);
            if (Number.isFinite(h) && h >= 0 && h < 24) heatmap[h] = Number.isFinite(c) ? c : 0;
          }
        }

        // Generate AI Alerts
        const alerts: any[] = [];
        if (avgRating < 3.5) {
            alerts.push({
                id: 'alert-1',
                type: 'CRITICAL',
                title: 'Satisfaction Drop',
                message: 'Sentiment index fell below 70%. Immediate audit recommended.',
                icon: 'AlertTriangle'
            });
        }

        const recentNegative = reviews.filter(r => r.rating <= 2).length;
        if (recentNegative > 5) {
            alerts.push({
                id: 'alert-2',
                type: 'WARNING',
                title: 'Negative Spike',
                message: 'Anomalous volume of 1-2 star reviews detected in last 24h.',
                icon: 'Zap'
            });
        }

        if (bookings.length > 20) {
            alerts.push({
                id: 'alert-3',
                type: 'INFO',
                title: 'Demand Surge',
                message: 'Booking velocity increased by 22%. Adjust pricing nodes.',
                icon: 'TrendingUp'
            });
        }

        if (competitors.marketShare > 0 && competitors.marketShare < 20) {
            alerts.push({
                id: 'alert-comp-1',
                type: 'WARNING',
                title: 'Competitive Stress',
                message: 'Low market share detected relative to tracked competitors.',
                icon: 'Globe'
            });
        }

        return {
            sentiment: {
                index: sentimentIndex.toFixed(1),
                label: avgRating >= 4 ? 'OPTIMAL' : 'STRESS',
                trend: '+2.4%'
            },
            activity: {
                liveBookings: bookings.length,
                status: 'HIGH VELOCITY',
                heatmap
            },
            revenue: {
                total: revenueData._sum.totalAmount || 0,
                trend: revenueTrend,
                change: '0%'
            },
            market: {
                demand: '0%',
                competition: 'Unknown',
                signals: [],
                competitorBenchmarking: competitors
            },
            alerts,
            timestamp: new Date()
        };
    }

    async getCompetitorBenchmarking() {
        const competitors = await this.prisma.competitor.findMany({
            orderBy: { trackedSince: 'desc' },
            take: 10
        });
        return {
            marketShare: 0,
            competitors: competitors.map((c) => ({ name: c.name, trackedSince: c.trackedSince })),
            priceIndex: 0,
            sentimentGap: 0
        };
    }

    async askAI(query: string) {
        this.logger.log(`Processing AI Command: ${query}`);

        const lowerQuery = query.toLowerCase();
        let contextData: any = null;
        let intent = 'GENERAL';

        try {
            if (lowerQuery.includes('sentiment') || lowerQuery.includes('review')) {
                intent = 'SENTIMENT';
                contextData = await this.getSentimentContext();
            } else if (lowerQuery.includes('demand') || lowerQuery.includes('forecast') || lowerQuery.includes('booking')) {
                intent = 'FORECAST';
                contextData = await this.getBookingContext();
            } else if (lowerQuery.includes('revenue') || lowerQuery.includes('performance')) {
                intent = 'PERFORMANCE';
                contextData = await this.getPerformanceContext();
            } else if (lowerQuery.includes('competitor') || lowerQuery.includes('nearby') || lowerQuery.includes('compare')) {
                intent = 'COMPETITOR';
                contextData = await this.getCompetitorBenchmarking();
            } else if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('improve')) {
                intent = 'RECOMMENDATION';
                contextData = await this.getRecommendationContext();
            }

            const aiInstance = await this.getAiModel();

            if (!aiInstance || !aiInstance.model) throw new ServiceUnavailableException('AI provider is not configured');

            const startTime = Date.now();
            const prompt = `
                You are "RV-Node-01", the Core Intelligence of the RateVoice Hospitality Platform.
                The user has issued a command: "${query}".
                
                Current Platform Context (JSON):
                ${JSON.stringify(contextData || { message: "General platform state" })}
                
                Task:
                1. Provide a high-density, professional analytical response (max 3 sentences).
                2. Suggest a visualization (BAR, LINE, AREA, RADAR).
                3. Provide structured data for the chart that reflects the context data.
                4. Include 2 "Key Signals" (short bullet points).

                Format your response strictly as JSON:
                {
                    "answer": "...",
                    "chartType": "...",
                    "chartData": { "labels": [], "values": [] },
                    "signals": ["...", "..."],
                    "confidence": 0.98
                }
            `;

            const result = await aiInstance.model.generateContent(prompt);
            const text = result.response.text();
            const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiResponse = JSON.parse(jsonString);

            await this.providerResolver.reportSuccess(aiInstance.providerId, Date.now() - startTime);

            return {
                ...aiResponse,
                timestamp: new Date(),
                intent
            };

        } catch (error) {
            this.logger.error('AI Command Processing Error', error);
            throw new ServiceUnavailableException('AI request failed');
        }
    }

    private async getSentimentContext() {
        const reviews = await this.prisma.textReview.findMany({
            take: 50,
            select: { rating: true, content: true }
        });
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1);
        return {
            totalReviews: reviews.length,
            averageRating: avgRating.toFixed(2),
            recentSentiment: reviews.slice(0, 5).map(r => r.rating)
        };
    }

    private async getBookingContext() {
        const bookings = await this.prisma.booking.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            select: { totalAmount: true, status: true, createdAt: true }
        });
        return {
            activeBookings: bookings.length,
            revenueVelocity: bookings.reduce((acc, b) => acc + Number(b.totalAmount), 0),
            statusDistribution: {
                confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
                pending: bookings.filter(b => b.status === 'PENDING').length
            }
        };
    }

    private async getPerformanceContext() {
        const revenue = await this.prisma.booking.aggregate({
            _sum: { totalAmount: true },
            _count: true
        });
        return {
            totalRevenue: Number(revenue._sum.totalAmount) || 0,
            transactionCount: revenue._count,
            efficiency: 0.94 
        };
    }

    private async getRecommendationContext() {
        const lowRatings = await this.prisma.textReview.findMany({
            where: { rating: { lt: 3 } },
            take: 5,
            select: { content: true }
        });
        return {
            painPoints: lowRatings.map(r => r.content),
            suggestedActions: ["Improve response time", "Optimize pricing", "Staff training"]
        };
    }

    async getCommentAnalysis(ownerId: string) {
        const business = await this.prisma.business.findFirst({
            where: { ownerId },
            include: { branches: { select: { id: true } } }
        });
        if (!business) throw new NotFoundException('Business not found');
        const branchIds = business.branches.map((b) => b.id);

        const reviews = await this.prisma.textReview.findMany({
            where: { branchId: { in: branchIds } },
            take: 500,
            orderBy: { createdAt: 'desc' },
            select: { content: true, rating: true }
        });

        const counts: Record<string, number> = {};
        const complaints: any[] = [];
        let joy = 0;
        let anger = 0;
        let sadness = 0;
        let surprise = 0;

        const pos = ['good', 'great', 'amazing', 'excellent', 'perfect', 'love'];
        const neg = ['bad', 'poor', 'dirty', 'rude', 'slow', 'terrible', 'awful'];

        for (const r of reviews) {
            const text = (r.content || '').toLowerCase();
            for (const w of pos) if (text.includes(w)) joy += 1;
            for (const w of neg) if (text.includes(w)) anger += 1;
            if (text.includes('surprised') || text.includes('unexpected')) surprise += 1;
            if (text.includes('sad') || text.includes('disappointed')) sadness += 1;

            const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
            for (const t of tokens) {
                if (t.length < 4) continue;
                counts[t] = (counts[t] || 0) + 1;
            }

            if (Number(r.rating) <= 2 && r.content) {
                complaints.push({
                    id: `${complaints.length + 1}`,
                    text: r.content.slice(0, 180),
                    severity: 'medium',
                    status: 'open'
                });
            }
        }

        const topKeywords = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([text, count]) => ({
                text,
                count,
                sentiment: neg.includes(text) ? 'negative' : pos.includes(text) ? 'positive' : 'neutral'
            }));

        const denom = Math.max(1, joy + anger + sadness + surprise);
        const emotionScore = Math.min(100, Math.round(((joy - anger + denom) / (2 * denom)) * 100));

        return {
            emotionScore,
            emotions: {
                joy: Math.round((joy / denom) * 100),
                anger: Math.round((anger / denom) * 100),
                sadness: Math.round((sadness / denom) * 100),
                surprise: Math.round((surprise / denom) * 100)
            },
            keywords: topKeywords,
            complaints: complaints.slice(0, 10)
        };
    }

}
