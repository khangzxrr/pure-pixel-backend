import { PrismaService } from 'src/prisma.service';
import { CategoryRepository } from './category.repository';

describe('CategoryRepository', () => {
  const category = { findMany: jest.fn(), findFirst: jest.fn() };
  const repository = new CategoryRepository({
    category,
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    category.findMany.mockResolvedValue(['category']);
    category.findFirst.mockResolvedValue('category');
  });

  it('findAll should return all categories', async () => {
    await expect(repository.findAll()).resolves.toEqual(['category']);
    expect(category.findMany).toHaveBeenCalledWith();
  });

  it('findMany should filter with where', async () => {
    await expect(repository.findMany({ name: 'n' })).resolves.toEqual([
      'category',
    ]);
    expect(category.findMany).toHaveBeenCalledWith({ where: { name: 'n' } });
  });

  it('findById should find first by id', async () => {
    await expect(repository.findById('id')).resolves.toBe('category');
    expect(category.findFirst).toHaveBeenCalledWith({ where: { id: 'id' } });
  });
});
