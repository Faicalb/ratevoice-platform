import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  constructor(private readonly notifications: NotificationsService) {}

  @Process('email')
  async handleEmail(job: Job<{ to: string; subject: string; content: string }>) {
    const { to, subject, content } = job.data || ({} as any);
    await this.notifications.sendEmail(to, subject, content);
    return { success: true };
  }
}

