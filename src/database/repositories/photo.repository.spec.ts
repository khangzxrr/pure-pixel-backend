import { Photo, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PhotoRepository } from './photo.repository';

describe('PhotoRepository', () => {
  const extendedPhoto = {
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
  };
  const basePhoto = {
    findUniqueOrThrow: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  const txPhoto = {
    updateMany: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
  };
  const $queryRaw = jest.fn();
  const prisma = {
    photo: basePhoto,
    $queryRaw,
    extendedClient: jest.fn(() => ({ photo: extendedPhoto })),
  } as unknown as PrismaService;
  const tx = { photo: txPhoto } as unknown as Prisma.TransactionClient;
  const result = { id: 'result' };
  const detailInclude = {
    _count: { select: { votes: true, comments: true } },
    photographer: true,
    categories: true,
    camera: { include: { cameraMaker: true } },
    photoSellings: {
      where: { active: true },
      include: {
        pricetags: true,
        photoSellHistories: {
          include: {
            photoBuy: {
              where: {
                buyerId: 'buyer',
                userToUserTransaction: {
                  fromUserTransaction: { status: 'SUCCESS' },
                },
              },
            },
          },
        },
      },
    },
    photoTags: true,
  };
  const listInclude = {
    _count: { select: { votes: true, comments: true } },
    photographer: true,
    categories: true,
    camera: { include: { cameraMaker: true } },
    photoSellings: {
      where: { active: true },
      include: { pricetags: true },
    },
    photoTags: true,
  };
  const voteCommentInclude = {
    photographer: true,
    categories: true,
    _count: {
      select: {
        votes: { where: { isUpvote: true } },
        comments: true,
      },
    },
  };
  let repository: PhotoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    [...Object.values(extendedPhoto), ...Object.values(basePhoto)].forEach(
      (fn) => fn.mockReturnValue(result),
    );
    Object.values(txPhoto).forEach((fn) => fn.mockReturnValue('tx-result'));
    $queryRaw.mockReturnValue(['row']);
    repository = new PhotoRepository(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deleteById should soft delete and deactivate photo sellings', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-01T00:00:00.000Z'));

    expect(repository.deleteById('p')).toBe(result);
    expect(extendedPhoto.update).toHaveBeenCalledWith({
      where: { id: 'p' },
      data: {
        deletedAt: new Date('2024-05-01T00:00:00.000Z'),
        photoSellings: {
          updateMany: {
            where: { photoId: 'p' },
            data: { active: false },
          },
        },
      },
    });
  });

  describe('updateManyQuery', () => {
    const args = { where: { id: 'p' }, data: { title: 't' } };

    it('should use the transaction client when provided', () => {
      expect(repository.updateManyQuery(args, tx)).toBe('tx-result');
      expect(txPhoto.updateMany).toHaveBeenCalledWith(args);
      expect(extendedPhoto.updateMany).not.toHaveBeenCalled();
    });

    it('should use the extended client without transaction', () => {
      expect(repository.updateManyQuery(args)).toBe(result);
      expect(extendedPhoto.updateMany).toHaveBeenCalledWith(args);
      expect(txPhoto.updateMany).not.toHaveBeenCalled();
    });
  });

  it('batchUpdate should build one update per photo and default exif to JsonNull', () => {
    const withExif = { id: 'a', exif: { iso: 100 } } as unknown as Photo;
    const withoutExif = { id: 'b', exif: null } as unknown as Photo;

    expect(repository.batchUpdate([withExif, withoutExif])).toEqual([
      result,
      result,
    ]);
    expect(extendedPhoto.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'a' },
      data: { id: 'a', exif: { iso: 100 } },
    });
    expect(extendedPhoto.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'b' },
      data: { id: 'b', exif: Prisma.JsonNull },
    });
  });

  it('updateQueryById should update by id', () => {
    expect(repository.updateQueryById('p', { title: 't' })).toBe(result);
    expect(extendedPhoto.update).toHaveBeenCalledWith({
      where: { id: 'p' },
      data: { title: 't' },
    });
  });

  it.each([
    [{ iso: 200 }, { iso: 200 }],
    [null, Prisma.JsonNull],
  ])('update should keep exif %p as %p', async (exif, expectedExif) => {
    const photo = { id: 'p', exif } as unknown as Photo;

    expect(await repository.update(photo)).toBe(result);
    expect(extendedPhoto.update).toHaveBeenCalledWith({
      where: { id: 'p' },
      data: { id: 'p', exif: expectedExif },
    });
  });

  it('updateByIdQuery should update by id', () => {
    expect(repository.updateByIdQuery('p', { title: 't' })).toBe(result);
    expect(extendedPhoto.update).toHaveBeenCalledWith({
      where: { id: 'p' },
      data: { title: 't' },
    });
  });

  it('updateById should update by id', async () => {
    expect(await repository.updateById('p', { title: 't' })).toBe(result);
    expect(extendedPhoto.update).toHaveBeenCalledWith({
      where: { id: 'p' },
      data: { title: 't' },
    });
  });

  it.each([
    ['PENDING', 'PENDING'],
    ['PARSED', 'PARSED'],
    ['ANYTHING', 'PARSED'],
  ])(
    'getPhotoByIdAndStatusAndUserId should map status %s to %s',
    async (status, expected) => {
      expect(
        await repository.getPhotoByIdAndStatusAndUserId('p', status, 'u'),
      ).toBe(result);
      expect(extendedPhoto.findUnique).toHaveBeenCalledWith({
        where: { id: 'p', status: expected, photographerId: 'u' },
      });
    },
  );

  it('deleteByExpiredUploadDate should delete pending photos created before the cutoff', async () => {
    const date = new Date('2024-05-10T00:00:00.000Z');

    expect(await repository.deleteByExpiredUploadDate(date, 2)).toBe(result);
    // a day is 24 hours: 2 days before 2024-05-10 is 2024-05-08
    expect(extendedPhoto.deleteMany).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        createdAt: { lte: new Date('2024-05-08T00:00:00.000Z') },
      },
    });
  });

  it('create should create with vote and comment counts', async () => {
    const data = { title: 't' } as unknown as Prisma.PhotoCreateInput;

    expect(await repository.create(data)).toBe(result);
    expect(extendedPhoto.create).toHaveBeenCalledWith({
      data,
      include: voteCommentInclude,
    });
  });

  it('findAllPhotosWithVoteAndCommentCountByUserId should filter by photographer', async () => {
    expect(
      await repository.findAllPhotosWithVoteAndCommentCountByUserId('u'),
    ).toBe(result);
    expect(extendedPhoto.findMany).toHaveBeenCalledWith({
      where: { photographerId: 'u' },
      include: voteCommentInclude,
    });
  });

  it('findUniqueOrThrowIgnoreSoftDelete should use the base client', async () => {
    expect(
      await repository.findUniqueOrThrowIgnoreSoftDelete('p', 'buyer'),
    ).toBe(result);
    expect(basePhoto.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'p' },
      include: detailInclude,
    });
    expect(extendedPhoto.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('findUniqueOrThrow should use the extended client', async () => {
    expect(await repository.findUniqueOrThrow('p', 'buyer')).toBe(result);
    expect(extendedPhoto.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'p' },
      include: detailInclude,
    });
    expect(basePhoto.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('countIgnoreSoftDelete should use the base client', async () => {
    expect(await repository.countIgnoreSoftDelete({ title: 't' })).toBe(result);
    expect(basePhoto.count).toHaveBeenCalledWith({ where: { title: 't' } });
  });

  it('count should use the extended client', async () => {
    expect(await repository.count({ title: 't' })).toBe(result);
    expect(extendedPhoto.count).toHaveBeenCalledWith({ where: { title: 't' } });
  });

  it('countByGPS should query raw with coordinates', async () => {
    expect(await repository.countByGPS(106.7, 10.8, 5)).toEqual(['row']);

    const [, ...values] = $queryRaw.mock.calls[0];
    expect(values).toEqual([10.8, 106.7, 10.8, 106.7, 5]);
  });

  it('findAllIdsByGPS should query raw with coordinates', async () => {
    expect(await repository.findAllIdsByGPS(106.7, 10.8, 5)).toEqual(['row']);

    const [, ...values] = $queryRaw.mock.calls[0];
    expect(values).toEqual([10.8, 106.7, 10.8, 106.7, 5, 10.8, 106.7]);
  });

  it('findPhotoIdsByPhotographerIdOrderByPhotoSellingCount should query raw with date range', async () => {
    const fromDate = new Date('2024-01-01');
    const toDate = new Date('2024-02-01');

    expect(
      await repository.findPhotoIdsByPhotographerIdOrderByPhotoSellingCount(
        'u',
        fromDate,
        toDate,
      ),
    ).toEqual(['row']);

    const [, ...values] = $queryRaw.mock.calls[0];
    expect(values).toEqual(['u', toDate, fromDate]);
  });

  it('findAllHash should select hashes of non deleted photos', async () => {
    expect(await repository.findAllHash()).toBe(result);
    expect(extendedPhoto.findMany).toHaveBeenCalledWith({
      select: { hash: true, id: true },
      where: { deletedAt: null },
    });
  });

  it('findFirst should find with where', async () => {
    expect(await repository.findFirst({ id: 'p' })).toBe(result);
    expect(extendedPhoto.findFirst).toHaveBeenCalledWith({
      where: { id: 'p' },
    });
  });

  it('findAllWithoutPaging should find with where', async () => {
    expect(await repository.findAllWithoutPaging({ id: 'p' })).toBe(result);
    expect(extendedPhoto.findMany).toHaveBeenCalledWith({
      where: { id: 'p' },
    });
  });

  it('findAllIgnoreSoftDelete should page through the base client', async () => {
    const orderBy = [{ createdAt: 'desc' as const }];

    expect(
      await repository.findAllIgnoreSoftDelete({ id: 'p' }, orderBy, 1, 2, {
        id: 'cursor',
      }),
    ).toBe(result);
    expect(basePhoto.findMany).toHaveBeenCalledWith({
      where: { id: 'p' },
      skip: 1,
      take: 2,
      orderBy,
      cursor: { id: 'cursor' },
      include: listInclude,
    });
  });

  describe('aggregate', () => {
    const args = { _count: { id: true as const } };

    it('should use the transaction client when provided', () => {
      expect(repository.aggregate(args, tx)).toBe('tx-result');
      expect(txPhoto.aggregate).toHaveBeenCalledWith(args);
      expect(extendedPhoto.aggregate).not.toHaveBeenCalled();
    });

    it('should use the extended client without transaction', () => {
      expect(repository.aggregate(args)).toBe(result);
      expect(extendedPhoto.aggregate).toHaveBeenCalledWith(args);
    });
  });

  describe('deleteAll', () => {
    it('should use the transaction client when provided', () => {
      expect(repository.deleteAll({ id: 'p' }, tx)).toBe('tx-result');
      expect(txPhoto.deleteMany).toHaveBeenCalledWith({ where: { id: 'p' } });
      expect(extendedPhoto.deleteMany).not.toHaveBeenCalled();
    });

    it('should use the extended client without transaction', () => {
      expect(repository.deleteAll({ id: 'p' })).toBe(result);
      expect(extendedPhoto.deleteMany).toHaveBeenCalledWith({
        where: { id: 'p' },
      });
    });
  });

  it('findAll should page through the extended client', async () => {
    const orderBy = [{ createdAt: 'asc' as const }];

    expect(await repository.findAll({ id: 'p' }, orderBy)).toBe(result);
    expect(extendedPhoto.findMany).toHaveBeenCalledWith({
      where: { id: 'p' },
      skip: undefined,
      take: undefined,
      orderBy,
      cursor: undefined,
      include: listInclude,
    });
  });
});
