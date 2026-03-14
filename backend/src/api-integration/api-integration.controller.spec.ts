import { Test, TestingModule } from '@nestjs/testing';
import { ApiIntegrationController } from './api-integration.controller';

describe('ApiIntegrationController', () => {
  let controller: ApiIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiIntegrationController],
    }).compile();

    controller = module.get<ApiIntegrationController>(ApiIntegrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
