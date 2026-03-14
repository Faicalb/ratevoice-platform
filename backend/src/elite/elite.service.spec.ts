import { Test, TestingModule } from '@nestjs/testing';
import { EliteService } from './elite.service';

describe('EliteService', () => {
  let service: EliteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EliteService],
    }).compile();

    service = module.get<EliteService>(EliteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
