import { Test, TestingModule } from '@nestjs/testing';
import { AmbassadorService } from './ambassador.service';

describe('AmbassadorService', () => {
  let service: AmbassadorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmbassadorService],
    }).compile();

    service = module.get<AmbassadorService>(AmbassadorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
