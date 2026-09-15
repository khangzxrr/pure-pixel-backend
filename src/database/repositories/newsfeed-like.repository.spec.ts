import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { NewsfeedLikeRepository } from './newsfeed-like.repository';

describe('NewsfeedLikeRepository', () => {
  const newsfeedLike = {
    upsert: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = {
    extendedClient: jest.fn(() => ({ newsfeedLike })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  const where = { id: 'like' };
  const create = {
    user: { connect: { id: 'u' } },
  } as unknown as Prisma.NewsfeedLikeCreateInput;
  let repository: NewsfeedLikeRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(newsfeedLike).forEach((fn) => fn.mockReturnValue(result));
    repository = new NewsfeedLikeRepository(prisma);
  });

  it('upsert should forward where, update and create', () => {
    expect(repository.upsert(where, {}, create)).toBe(result);
    expect(newsfeedLike.upsert).toHaveBeenCalledWith({
      where,
      update: {},
      create,
    });
  });

  it('create should create with data', () => {
    expect(repository.create(create)).toBe(result);
    expect(newsfeedLike.create).toHaveBeenCalledWith({ data: create });
  });

  it('findUnique should find with where', () => {
    expect(repository.findUnique(where)).toBe(result);
    expect(newsfeedLike.findUnique).toHaveBeenCalledWith({ where });
  });

  it('delete should delete with where', () => {
    expect(repository.delete(where)).toBe(result);
    expect(newsfeedLike.delete).toHaveBeenCalledWith({ where });
  });
});
