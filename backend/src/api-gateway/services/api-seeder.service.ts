import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderEncryptionService } from './provider-encryption.service';

@Injectable()
export class ApiSeederService {
  private readonly logger = new Logger(ApiSeederService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: ProviderEncryptionService
  ) {}

  async seedAllProviders() {
    const providers: Array<{ name: string; service: string; envKey: string; endpoint?: string }> = [
      { name: 'OpenAI', service: 'AI', envKey: 'OPENAI_API_KEY' },
      { name: 'Gemini', service: 'AI', envKey: 'GEMINI_API_KEY' },
      { name: 'Claude', service: 'AI', envKey: 'CLAUDE_API_KEY' },
      { name: 'OpenRouter', service: 'AI', envKey: 'OPENROUTER_API_KEY' },
      { name: 'Groq', service: 'AI', envKey: 'GROQ_API_KEY' },
      { name: 'Mistral', service: 'AI', envKey: 'MISTRAL_API_KEY' },
      { name: 'DeepSeek', service: 'AI', envKey: 'DEEPSEEK_API_KEY' },
      { name: 'Cohere', service: 'AI', envKey: 'COHERE_API_KEY' },

      { name: 'GoogleMaps', service: 'MAPS', envKey: 'GOOGLE_PLACES_API_KEY' },
      { name: 'GoogleMapsBackup', service: 'MAPS', envKey: 'GOOGLE_PLACES_API_KEY_BACKUP' },
      { name: 'RapidApiMaps', service: 'MAPS', envKey: 'RAPIDAPI_MAPS_KEY', endpoint: 'google-api31.p.rapidapi.com/map' },

      { name: 'Deepgram', service: 'SPEECH_TO_TEXT', envKey: 'DEEPGRAM_API_KEY' },
      { name: 'AssemblyAI', service: 'SPEECH_TO_TEXT', envKey: 'ASSEMBLYAI_API_KEY' },
      { name: 'Speechmatics', service: 'SPEECH_TO_TEXT', envKey: 'SPEECHMATICS_API_KEY' },

      { name: 'GoogleTranslate', service: 'TRANSLATION', envKey: 'GOOGLE_TRANSLATE_API_KEY' },
      { name: 'AiBitTranslator', service: 'TRANSLATION', envKey: 'RAPIDAPI_TRANSLATION_KEY', endpoint: 'aibit-translator.p.rapidapi.com' },

      { name: 'ScrapeNinja', service: 'DATA_ENRICHMENT', envKey: 'RAPIDAPI_SCRAPENINJA_KEY', endpoint: 'scrapeninja.p.rapidapi.com' }
    ];

    let count = 0;
    for (const p of providers) {
      const key = process.env[p.envKey];
      const hasKey = typeof key === 'string' && key.length > 0;
      
      const exists = await this.prisma.externalProvider.findFirst({
        where: { providerName: p.name, serviceName: p.service }
      });

      if (!exists) {
        await this.prisma.externalProvider.create({
          data: {
            providerName: p.name,
            serviceName: p.service,
            apiKey: hasKey ? this.encryptionService.encrypt(key as string) : '',
            endpoint: p.endpoint,
            isActive: hasKey,
            status: hasKey ? 'ACTIVE' : 'INACTIVE',
            priority: 1,
            rateLimit: 60
          }
        });
        count++;
      } else {
        if (hasKey) {
          await this.prisma.externalProvider.update({
            where: { id: exists.id },
            data: {
              apiKey: this.encryptionService.encrypt(key as string),
              endpoint: p.endpoint ?? exists.endpoint,
              isActive: true,
              status: 'ACTIVE'
            }
          });
          count++;
        }
      }
    }
    
    this.logger.log(`Seeded/Updated ${count} external providers.`);
    return { success: true, count };
  }
}
