import { Prisma } from '@prisma/client';
import { Constants } from 'src/infrastructure/utils/constants';
import { PrismaService } from 'src/prisma.service';
import { CameraRepository } from './camera.repository';

describe('CameraRepository', () => {
  const extendedCamera = {
    findUniqueOrThrow: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findFirstOrThrow: jest.fn(),
  };
  const baseCamera = {
    findMany: jest.fn(),
    upsert: jest.fn(),
  };
  const $queryRaw = jest.fn();
  const prisma = {
    camera: baseCamera,
    $queryRaw,
    extendedClient: jest.fn(() => ({ camera: extendedCamera })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  let repository: CameraRepository;

  const sqlText = (value: unknown) => (value as Prisma.Sql).sql;

  beforeEach(() => {
    jest.clearAllMocks();
    [...Object.values(extendedCamera), ...Object.values(baseCamera)].forEach(
      (fn) => fn.mockReturnValue(result),
    );
    $queryRaw.mockReturnValue(['row']);
    repository = new CameraRepository(prisma);
  });

  it('findUniqueOrThrow should use the extended client', async () => {
    expect(await repository.findUniqueOrThrow({ id: 'c' })).toBe(result);
    expect(extendedCamera.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'c' },
    });
  });

  it('delete should delete with where', async () => {
    expect(await repository.delete({ id: 'c' })).toBe(result);
    expect(extendedCamera.delete).toHaveBeenCalledWith({ where: { id: 'c' } });
  });

  it('update should update with where and data', async () => {
    expect(await repository.update({ id: 'c' }, { name: 'n' })).toBe(result);
    expect(extendedCamera.update).toHaveBeenCalledWith({
      where: { id: 'c' },
      data: { name: 'n' },
    });
  });

  it('count should count with optional where', () => {
    expect(repository.count()).toBe(result);
    expect(extendedCamera.count).toHaveBeenCalledWith({ where: undefined });
  });

  it('findMany should forward paging args', () => {
    const orderBy = [{ name: 'asc' as const }];

    expect(
      repository.findMany({ name: 'n' }, { cameraMaker: true }, 1, 2, orderBy),
    ).toBe(result);
    expect(extendedCamera.findMany).toHaveBeenCalledWith({
      where: { name: 'n' },
      include: { cameraMaker: true },
      skip: 1,
      take: 2,
      orderBy,
    });
  });

  it('findFindOrThrow should find first by id', () => {
    expect(repository.findFindOrThrow('c')).toBe(result);
    expect(extendedCamera.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'c' },
    });
  });

  it('findByMakerId should select cameras ordered by usage', async () => {
    expect(await repository.findByMakerId('maker', 5)).toBe(result);
    expect(baseCamera.findMany).toHaveBeenCalledWith({
      take: 5,
      where: { cameraMaker: { id: 'maker' } },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        _count: {
          select: {
            photos: { where: { deletedAt: null, visibility: 'PUBLIC' } },
            cameraOnUsers: true,
          },
        },
      },
      orderBy: [
        { photos: { _count: 'desc' } },
        { cameraOnUsers: { _count: 'desc' } },
      ],
    });
  });

  describe.each([
    ['findTopOrderByPhotoCount', '"photoCount"'],
    ['findTopUsageByUserCount', '"userCount"'],
  ] as const)('%s', (method, orderColumn) => {
    it.each([
      ['asc', 'asc'],
      ['desc', 'desc'],
    ] as const)('should query raw with %s order', async (sortOrder, sql) => {
      expect(await repository[method]('canon', sortOrder, 10, 20)).toEqual([
        'row',
      ]);

      const [strings, search, order, skip, take] = $queryRaw.mock.calls[0];
      expect(strings.join('?')).toContain(`ORDER BY ${orderColumn}`);
      expect(search).toBe('canon');
      expect(sqlText(order)).toBe(sql);
      expect(skip).toBe(10);
      expect(take).toBe(20);
    });
  });

  it('findTopUsageAtTimestamp should query raw with date parameters', async () => {
    const endDate = new Date('2024-01-01');

    expect(
      await repository.findTopUsageAtTimestamp('month', 3, endDate),
    ).toEqual(['row']);

    const [, dateSeperator, date, limit] = $queryRaw.mock.calls[0];
    expect(dateSeperator).toBe('month');
    expect(date).toBe(endDate);
    expect(limit).toBe(3);
  });

  it('upsert should connect the photo and connect or create the maker', async () => {
    expect(await repository.upsert('EOS R5', 'Canon', 'photo')).toBe(result);
    expect(baseCamera.upsert).toHaveBeenCalledWith({
      where: { name: 'EOS R5' },
      update: { photos: { connect: { id: 'photo' } } },
      create: {
        name: 'EOS R5',
        thumbnail: Constants.DEFAULT_IMAGE,
        cameraMaker: {
          connectOrCreate: {
            where: { name: 'Canon' },
            create: { name: 'Canon', thumbnail: Constants.DEFAULT_IMAGE },
          },
        },
        photos: { connect: { id: 'photo' } },
      },
    });
  });
});
