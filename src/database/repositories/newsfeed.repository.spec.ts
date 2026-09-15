import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { NewsfeedRepository } from './newsfeed.repository';

describe('NewsfeedRepository', () => {
  const newsfeed = {
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    delete: jest.fn(),
  };
  const prisma = {
    extendedClient: jest.fn(() => ({ newsfeed })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  const where = { id: 'n' };
  const data = {
    user: { connect: { id: 'u' } },
  } as unknown as Prisma.NewsfeedCreateInput;
  let repository: NewsfeedRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(newsfeed).forEach((fn) => fn.mockReturnValue(result));
    repository = new NewsfeedRepository(prisma);
  });

  it('create should create with data', () => {
    expect(repository.create(data)).toBe(result);
    expect(newsfeed.create).toHaveBeenCalledWith({ data });
  });

  it('update should update with where and data', () => {
    expect(repository.update(where, {})).toBe(result);
    expect(newsfeed.update).toHaveBeenCalledWith({ where, data: {} });
  });

  it('upsert should forward where, update and create', () => {
    expect(repository.upsert(where, {}, data)).toBe(result);
    expect(newsfeed.upsert).toHaveBeenCalledWith({
      where,
      update: {},
      create: data,
    });
  });

  it('count should count with where', () => {
    expect(repository.count({ userId: 'u' })).toBe(result);
    expect(newsfeed.count).toHaveBeenCalledWith({ where: { userId: 'u' } });
  });

  it('findMany should page with include', () => {
    expect(repository.findMany({ userId: 'u' }, { user: true }, 0, 5)).toBe(
      result,
    );
    expect(newsfeed.findMany).toHaveBeenCalledWith({
      where: { userId: 'u' },
      include: { user: true },
      skip: 0,
      take: 5,
    });
  });

  it('findUnique should forward where and include', () => {
    expect(repository.findUnique(where, { user: true })).toBe(result);
    expect(newsfeed.findUnique).toHaveBeenCalledWith({
      where,
      include: { user: true },
    });
  });

  it('findUniqueOrThrow should forward where and include', () => {
    expect(repository.findUniqueOrThrow(where, { user: true })).toBe(result);
    expect(newsfeed.findUniqueOrThrow).toHaveBeenCalledWith({
      where,
      include: { user: true },
    });
  });

  it('delete should delete with where', () => {
    expect(repository.delete(where)).toBe(result);
    expect(newsfeed.delete).toHaveBeenCalledWith({ where });
  });
});
