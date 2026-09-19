import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { FollowRepository } from './follow.repository';

describe('FollowRepository', () => {
  const follow = {
    delete: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  const prisma = {
    extendedClient: jest.fn(() => ({ follow })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  const where = {
    followerId_followingId: { followerId: 'a', followingId: 'b' },
  };
  let repository: FollowRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(follow).forEach((fn) => fn.mockReturnValue(result));
    repository = new FollowRepository(prisma);
  });

  it('delete should delete with where', () => {
    expect(repository.delete(where)).toBe(result);
    expect(follow.delete).toHaveBeenCalledWith({ where });
  });

  it('upsert should create without updating', () => {
    const create = {
      follower: { connect: { id: 'a' } },
      following: { connect: { id: 'b' } },
    } as unknown as Prisma.FollowCreateInput;

    expect(repository.upsert(where, create)).toBe(result);
    expect(follow.upsert).toHaveBeenCalledWith({ where, update: {}, create });
  });

  it('findUnique should forward where and include', () => {
    expect(repository.findUnique(where, { following: true })).toBe(result);
    expect(follow.findUnique).toHaveBeenCalledWith({
      where,
      include: { following: true },
    });
  });

  it('count should count with where', () => {
    expect(repository.count({ followerId: 'a' })).toBe(result);
    expect(follow.count).toHaveBeenCalledWith({ where: { followerId: 'a' } });
  });

  it('findAll should page with include', () => {
    expect(
      repository.findAll({ followerId: 'a' }, { follower: true }, 1, 2),
    ).toBe(result);
    expect(follow.findMany).toHaveBeenCalledWith({
      where: { followerId: 'a' },
      include: { follower: true },
      skip: 1,
      take: 2,
    });
  });
});
