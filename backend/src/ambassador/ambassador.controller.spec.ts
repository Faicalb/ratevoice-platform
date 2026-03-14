import { Test, TestingModule } from '@nestjs/testing';
import { AmbassadorController } from './ambassador.controller';

describe('AmbassadorController', () => {
  let controller: AmbassadorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmbassadorController],
    }).compile();

    controller = module.get<AmbassadorController>(AmbassadorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
