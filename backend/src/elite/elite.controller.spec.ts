import { Test, TestingModule } from '@nestjs/testing';
import { EliteController } from './elite.controller';

describe('EliteController', () => {
  let controller: EliteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EliteController],
    }).compile();

    controller = module.get<EliteController>(EliteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
