import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PhotoshootPackageShowcaseRepository } from './photoshoot-package-showcase.repository';

describe('PhotoshootPackageShowcaseRepository', () => {
  const showcase = {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const repository = new PhotoshootPackageShowcaseRepository({
    extendedClient: () => ({ photoshootPackageShowcasePhoto: showcase }),
  } as unknown as PrismaService);
  const result = { id: 'result' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(showcase).forEach((fn) => fn.mockReturnValue(result));
  });

  it('create should create with data', () => {
    const data = {
      photoUrl: 'url',
    } as unknown as Prisma.PhotoshootPackageShowcasePhotoCreateInput;

    expect(repository.create(data)).toBe(result);
    expect(showcase.create).toHaveBeenCalledWith({ data });
  });

  it('count should count with where', () => {
    expect(repository.count({ photoshootPackageId: 'p' })).toBe(result);
    expect(showcase.count).toHaveBeenCalledWith({
      where: { photoshootPackageId: 'p' },
    });
  });

  it('findMany should page with ordering', () => {
    const orderBy = [{ createdAt: 'desc' as const }];

    expect(
      repository.findMany({ photoshootPackageId: 'p' }, 1, 2, orderBy),
    ).toBe(result);
    expect(showcase.findMany).toHaveBeenCalledWith({
      where: { photoshootPackageId: 'p' },
      skip: 1,
      take: 2,
      orderBy,
    });
  });

  it('findByIdOrThrow should find by id', () => {
    expect(repository.findByIdOrThrow('s')).toBe(result);
    expect(showcase.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 's' },
    });
  });

  it('updateById should update by id', () => {
    expect(repository.updateById('s', { photoUrl: 'u' })).toBe(result);
    expect(showcase.update).toHaveBeenCalledWith({
      where: { id: 's' },
      data: { photoUrl: 'u' },
    });
  });

  it('deleteById should delete by id', () => {
    expect(repository.deleteById('s')).toBe(result);
    expect(showcase.delete).toHaveBeenCalledWith({ where: { id: 's' } });
  });
});
