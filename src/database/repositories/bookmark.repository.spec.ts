import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { BookmarkRepository } from './bookmark.repository';

describe('BookmarkRepository', () => {
  const bookmark = {
    findMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = { bookmark } as unknown as PrismaService;
  const result = { id: 'result' };
  let repository: BookmarkRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(bookmark).forEach((fn) => fn.mockReturnValue(result));
    repository = new BookmarkRepository(prisma);
  });

  it('findAll should page with where and include', () => {
    expect(repository.findAll({ userId: 'u' }, { photo: true }, 5, 10)).toBe(
      result,
    );
    expect(bookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 'u' },
      skip: 5,
      take: 10,
      include: { photo: true },
    });
  });

  it('upsert should create when missing without updating', () => {
    const where = { userId_photoId: { userId: 'u', photoId: 'p' } };
    const data = {
      user: { connect: { id: 'u' } },
      photo: { connect: { id: 'p' } },
    } as unknown as Prisma.BookmarkCreateInput;

    expect(repository.upsert(where, data)).toBe(result);
    expect(bookmark.upsert).toHaveBeenCalledWith({
      where,
      update: {},
      create: data,
    });
  });

  it('delete should delete with where', () => {
    const where = { userId_photoId: { userId: 'u', photoId: 'p' } };

    expect(repository.delete(where)).toBe(result);
    expect(bookmark.delete).toHaveBeenCalledWith({ where });
  });
});
