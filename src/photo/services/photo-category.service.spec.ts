import { CategoryRepository } from 'src/database/repositories/category.repository';
import { PhotoCategoryService } from './photo-category.service';

type Categories = Awaited<ReturnType<CategoryRepository['findAll']>>;

describe('PhotoCategoryService', () => {
  it('returns all categories from the repository', async () => {
    const categories = [{ id: 'c1', name: 'nature' }] as unknown as Categories;
    const categoryRepository: jest.Mocked<Pick<CategoryRepository, 'findAll'>> =
      {
        findAll: jest.fn().mockResolvedValue(categories),
      };

    const service = new PhotoCategoryService(
      categoryRepository as unknown as CategoryRepository,
    );

    await expect(service.findAll()).resolves.toBe(categories);
    expect(categoryRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
