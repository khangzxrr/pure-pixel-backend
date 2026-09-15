import { PhotoCategoryController } from './photo-category.controller';
import { PhotoCategoryService } from '../services/photo-category.service';

describe('PhotoCategoryController', () => {
  it('delegates findAll to the category service', async () => {
    const categories = [{ id: 'c1' }];
    const photoCategoryService = {
      findAll: jest.fn().mockResolvedValue(categories),
    };
    const controller = new PhotoCategoryController(
      photoCategoryService as unknown as PhotoCategoryService,
    );

    await expect(controller.findAll()).resolves.toBe(categories);
    expect(photoCategoryService.findAll).toHaveBeenCalledTimes(1);
  });
});
