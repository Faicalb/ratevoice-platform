import { Injectable } from '@nestjs/common';

@Injectable()
export class StoriesAiService {
  async moderateContent(mediaUrl: string, type: string) {
    const url = String(mediaUrl || '').toLowerCase();
    const t = String(type || '').toLowerCase();
    const keywords = ['nsfw', 'porn', 'adult', 'weapon', 'violence'];
    const hit = keywords.find((k) => url.includes(k));
    const riskScore = hit ? 95 : t === 'video' ? 20 : 10;
    const isFlagged = riskScore >= 90;

    return {
      riskScore,
      isFlagged,
      reasons: isFlagged ? [`Potential policy violation keyword: ${hit}`] : []
    };
  }
}
