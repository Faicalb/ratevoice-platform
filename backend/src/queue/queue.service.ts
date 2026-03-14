import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('ai-analysis') private aiQueue: Queue
  ) {}

  async addNotificationJob(type: string, payload: any) {
    await this.notificationsQueue.add(type, payload, { removeOnComplete: true, removeOnFail: true });
  }

  async addAiAnalysisJob(reviewId: string) {
    await this.aiQueue.add('analyze', { reviewId }, { removeOnComplete: true, removeOnFail: true });
  }
}
