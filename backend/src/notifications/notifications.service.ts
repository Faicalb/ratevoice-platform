import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sendgridFrom: string | undefined;
  private readonly sendgridEnabled: boolean;

  constructor() {
    const key = process.env.SENDGRID_API_KEY;
    this.sendgridFrom = process.env.SENDGRID_FROM_EMAIL;
    this.sendgridEnabled = !!key && !!this.sendgridFrom;
    if (key) {
      sgMail.setApiKey(key);
    }
  }

  async sendEmail(to: string, subject: string, content: string) {
    if (process.env.APP_ENV === 'sandbox') {
      this.logger.warn(`[SANDBOX MODE] Email suppressed. To: ${to}, Subject: ${subject}`);
      return { success: true, sandbox: true };
    }
    
    if (!this.sendgridEnabled) {
      throw new ServiceUnavailableException('Email provider is not configured');
    }

    await sgMail.send({
      to,
      from: this.sendgridFrom as string,
      subject,
      html: content
    });

    return { success: true };
  }

  async sendPushNotification(userId: string, title: string, body: string) {
    if (process.env.APP_ENV === 'sandbox') {
      this.logger.warn(`[SANDBOX MODE] Push notification suppressed. User: ${userId}, Title: ${title}`);
      return { success: true, sandbox: true };
    }

    throw new ServiceUnavailableException('Push notifications are not configured');
  }
}
