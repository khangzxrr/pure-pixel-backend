import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PhotoSellRepository } from './photo-sell.repository';

describe('PhotoSellRepository', () => {
  const photoSell = {
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  };
  const repository = new PhotoSellRepository({
    extendedClient: () => ({ photoSell }),
  } as unknown as PrismaService);
  const result = { id: 'result' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(photoSell).forEach((fn) => fn.mockReturnValue(result));
  });

  it('findFirst should find with where', async () => {
    expect(await repository.findFirst({ photoId: 'p' })).toBe(result);
    expect(photoSell.findFirst).toHaveBeenCalledWith({
      where: { photoId: 'p' },
    });
  });

  it('findUniqueOrThrow should include photo and price tags', async () => {
    expect(await repository.findUniqueOrThrow({ id: 's' })).toBe(result);
    expect(photoSell.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 's' },
      include: { photo: true, pricetags: true },
    });
  });

  it('deactivatePhotoSellByPhotoIdQuery should deactivate sells of photo', () => {
    expect(repository.deactivatePhotoSellByPhotoIdQuery('p')).toBe(result);
    expect(photoSell.updateMany).toHaveBeenCalledWith({
      where: { photoId: 'p' },
      data: { active: false },
    });
  });

  it('updateMany should update with where and data', () => {
    expect(repository.updateMany({ photoId: 'p' }, { active: true })).toBe(
      result,
    );
    expect(photoSell.updateMany).toHaveBeenCalledWith({
      where: { photoId: 'p' },
      data: { active: true },
    });
  });

  it('createAndActiveByPhotoIdQuery should create with data', () => {
    const data = {
      active: true,
    } as unknown as Prisma.PhotoSellCreateInput;

    expect(repository.createAndActiveByPhotoIdQuery(data)).toBe(result);
    expect(photoSell.create).toHaveBeenCalledWith({ data });
  });

  it('findMany should forward where, orderBy and include', async () => {
    const orderBy = [{ createdAt: 'desc' as const }];

    expect(
      await repository.findMany({ photoId: 'p' }, orderBy, { photo: true }),
    ).toBe(result);
    expect(photoSell.findMany).toHaveBeenCalledWith({
      where: { photoId: 'p' },
      orderBy,
      include: { photo: true },
    });
  });
});
