import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PhotoshootRepository } from './photoshoot-package.repository';

describe('PhotoshootRepository', () => {
  const extendedPackage = {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  const basePackage = { findMany: jest.fn() };
  const prisma = {
    photoshootPackage: basePackage,
    extendedClient: jest.fn(() => ({ photoshootPackage: extendedPackage })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  const detailInclude = {
    showcases: true,
    user: true,
    reviews: { include: { user: true } },
    _count: { select: { bookings: true } },
  };
  let repository: PhotoshootRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    [...Object.values(extendedPackage), basePackage.findMany].forEach((fn) =>
      fn.mockReturnValue(result),
    );
    repository = new PhotoshootRepository(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('findUniqueOrThrow should include package details', async () => {
    expect(await repository.findUniqueOrThrow('pkg')).toBe(result);
    expect(extendedPackage.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'pkg' },
      include: detailInclude,
    });
  });

  it('delete should soft delete and decrement user package count', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-03-01T00:00:00.000Z'));

    expect(repository.delete('pkg')).toBe(result);
    expect(extendedPackage.update).toHaveBeenCalledWith({
      where: { id: 'pkg' },
      data: {
        deletedAt: new Date('2024-03-01T00:00:00.000Z'),
        user: { update: { packageCount: { decrement: 1 } } },
      },
    });
  });

  it('updateMany should update with where and data', async () => {
    expect(await repository.updateMany({ userId: 'u' }, { title: 't' })).toBe(
      result,
    );
    expect(extendedPackage.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u' },
      data: { title: 't' },
    });
  });

  it('updateById should update by id', async () => {
    expect(await repository.updateById('pkg', { title: 't' })).toBe(result);
    expect(extendedPackage.update).toHaveBeenCalledWith({
      where: { id: 'pkg' },
      data: { title: 't' },
    });
  });

  it('create should create with details include', () => {
    const data = {
      title: 't',
    } as unknown as Prisma.PhotoshootPackageCreateInput;

    expect(repository.create(data)).toBe(result);
    expect(extendedPackage.create).toHaveBeenCalledWith({
      data,
      include: detailInclude,
    });
  });

  it('count should count with where', async () => {
    expect(await repository.count({ userId: 'u' })).toBe(result);
    expect(extendedPackage.count).toHaveBeenCalledWith({
      where: { userId: 'u' },
    });
  });

  it('findAll should page with booking count and user', async () => {
    const orderBy = [{ createdAt: 'desc' as const }];

    expect(await repository.findAll(10, 20, { userId: 'u' }, orderBy)).toBe(
      result,
    );
    expect(extendedPackage.findMany).toHaveBeenCalledWith({
      take: 10,
      skip: 20,
      where: { userId: 'u' },
      orderBy,
      include: { _count: { select: { bookings: true } }, user: true },
    });
  });

  it('findAllIgnoreSoftDelete should use the base client', async () => {
    const orderBy = [{ createdAt: 'asc' as const }];

    expect(
      await repository.findAllIgnoreSoftDelete(
        { userId: 'u' },
        orderBy,
        { user: true },
        5,
        0,
      ),
    ).toBe(result);
    expect(basePackage.findMany).toHaveBeenCalledWith({
      take: 5,
      skip: 0,
      where: { userId: 'u' },
      orderBy,
      include: { user: true },
    });
    expect(extendedPackage.findMany).not.toHaveBeenCalled();
  });
});
