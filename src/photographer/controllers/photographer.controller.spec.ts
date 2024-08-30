import { Test, TestingModule } from '@nestjs/testing';
import { PhotographerController } from './photographer.controller';

describe('PhotographerController', () => {
  let controller: PhotographerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotographerController],
    }).compile();

    controller = module.get<PhotographerController>(PhotographerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
