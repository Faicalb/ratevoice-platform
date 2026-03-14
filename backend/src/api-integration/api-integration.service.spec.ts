import { Test, TestingModule } from '@nestjs/testing';
import { ApiIntegrationService } from './api-integration.service';

describe('ApiIntegrationService', () => {
  let service: ApiIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiIntegrationService],
    }).compile();

    service = module.get<ApiIntegrationService>(ApiIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
