import { PrismaService } from 'src/prisma.service';
import { BlogRepository } from './blog.repository';

describe('BlogRepository', () => {
  const blog = {
    count: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = { blog } as unknown as PrismaService;
  const result = { id: 'result' };
  let repository: BlogRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(blog).forEach((fn) => fn.mockReturnValue(result));
    repository = new BlogRepository(prisma);
  });

  it('count should count with where', async () => {
    expect(await repository.count({ title: 'a' })).toBe(result);
    expect(blog.count).toHaveBeenCalledWith({ where: { title: 'a' } });
  });

  it('findByIdOrThrow should find by id', async () => {
    expect(await repository.findByIdOrThrow('b1')).toBe(result);
    expect(blog.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'b1' },
    });
  });

  it('findAll should forward find many args', async () => {
    const args = { skip: 1, take: 2 };

    expect(await repository.findAll(args)).toBe(result);
    expect(blog.findMany).toHaveBeenCalledWith(args);
  });

  it('create should create with data', async () => {
    const data = { title: 't', content: 'c', thumbnail: 'x', user: {} };

    expect(await repository.create(data)).toBe(result);
    expect(blog.create).toHaveBeenCalledWith({ data });
  });

  it('updateById should update by id', async () => {
    expect(await repository.updateById('b1', { title: 'n' })).toBe(result);
    expect(blog.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: { title: 'n' },
    });
  });

  it('deleteById should delete by id', async () => {
    expect(await repository.deleteById('b1')).toBe(result);
    expect(blog.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
  });
});
