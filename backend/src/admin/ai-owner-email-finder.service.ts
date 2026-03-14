import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiIntegrationService } from '../api-integration/api-integration.service';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';

@Injectable()
export class AiOwnerEmailFinderService {
  private readonly logger = new Logger(AiOwnerEmailFinderService.name);

  constructor(
    private prisma: PrismaService,
    private apiIntegration: ApiIntegrationService,
    private notifications: NotificationsService
  ) {}

  async findEmailsForUnclaimedBusinesses() {
    const businesses = await this.prisma.business.findMany({
      where: {
        status: 'UNCLAIMED',
        ownerEmailFound: false
      },
      take: 10, // Process in batches
    });

    this.logger.log(`Found ${businesses.length} unclaimed businesses to process.`);
    
    const results: any[] = [];
    let foundCount = 0;
    
    for (const business of businesses) {
      const result = await this.findOwnerEmail(business.id);
      results.push(result);
      if (result.success) foundCount++;
    }

    return {
      processed: businesses.length,
      found: foundCount,
      details: results
    };
  }

  async findOwnerEmail(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return { error: 'Business not found' };

    this.logger.log(`🔍 finding email for: ${business.name}`);

    let foundEmail: string | null = null;
    let source: string | null = null;
    let confidence = 0;

    // 1. Check Website Scraping
    if (business.website) {
      const websiteEmail = await this.scrapeWebsiteForEmail(business.website);
      if (websiteEmail) {
        foundEmail = websiteEmail;
        source = 'WEBSITE';
        confidence = 0.9;
      }
    }

    // 2. Check Google Places (if we had place_id, we could check details again)
    // Assuming we might search by name/address if website didn't yield results
    if (!foundEmail) {
      // Search Google Places again to get fresh details including potential email (rarely exposed but worth checking website field update)
      // Actually Google Places API doesn't return email usually.
      // But we can check if the business has a "contact" page link in google results sometimes (not standard).
      // We skip this for now as it's redundant with website scraping.
    }

    // 3. Pattern Detection
    if (!foundEmail && business.website) {
      try {
        const domain = new URL(business.website).hostname.replace('www.', '');
        const patterns = ['info', 'contact', 'hello', 'support', 'reservations', 'booking'];
        
        for (const prefix of patterns) {
          const testEmail = `${prefix}@${domain}`;
          // In a real scenario, we would validate if this email exists (SMTP check).
          // For now, we generate the most likely one if we can't verify.
          // We'll mark confidence lower.
          if (prefix === 'info' || prefix === 'contact') {
             // We'll just suggest it as a candidate but not "found" unless verified.
             // For this MVP, let's assume 'info@' is a strong candidate if we found nothing else.
             // foundEmail = testEmail;
             // source = 'PATTERN_GUESS';
             // confidence = 0.5;
             // break;
          }
        }
      } catch (e) {}
    }

    // Save Result
    if (foundEmail) {
      await this.prisma.business.update({
        where: { id: businessId },
        data: {
          ownerEmailFound: true,
          discoveredEmail: foundEmail,
          emailConfidenceScore: confidence,
          emailSource: source
        }
      });

      // Auto Invitation (Optional: can be triggered separately)
      // await this.sendInvitation(foundEmail, business.name);
      
      return { 
        business: business.name, 
        email: foundEmail, 
        source, 
        confidence, 
        status: 'FOUND',
        success: true 
      };
    }

    return { business: business.name, status: 'NOT_FOUND', success: false };
  }

  private async scrapeWebsiteForEmail(url: string): Promise<string | null> {
    try {
      // Add protocol if missing
      if (!url.startsWith('http')) url = 'https://' + url;

      this.logger.debug(`Scraping ${url}...`);
      const response = await axios.get(url, { timeout: 10000 });
      const html = response.data;

      // Simple Regex for email
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const matches = html.match(emailRegex);

      if (matches && matches.length > 0) {
        // Filter out common false positives (like png, jpg images named as emails or bootstrap code)
        const validEmails = matches.filter(email => {
            const lower = email.toLowerCase();
            return !lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.js') && !lower.includes('example');
        });

        // Prefer 'info' or 'contact' if multiple
        const priority = validEmails.find(e => e.includes('info') || e.includes('contact'));
        return priority || validEmails[0];
      }
    } catch (error) {
      this.logger.warn(`Failed to scrape ${url}: ${error.message}`);
    }
    return null;
  }

  async sendInvitation(email: string, businessName: string) {
    const subject = `Manage your profile for ${businessName} on RateVoice`;
    const content = `
      <h1>Welcome to RateVoice</h1>
      <p>We found that your business <strong>${businessName}</strong> is listed on our platform.</p>
      <p>You can claim this business and manage your reputation, respond to reviews, and more.</p>
      <p><a href="https://ratevoice.com/claim?email=${email}">Click here to claim your business</a></p>
    `;
    await this.notifications.sendEmail(email, subject, content);
  }
}