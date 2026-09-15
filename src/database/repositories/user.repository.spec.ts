import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { DuplicatedUserIdException } from '../exceptions/duplicatedUserId.exception';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  const user = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    aggregate: jest.fn(),
    upsert: jest.fn(),
  };
  const extendedUser = {
    count: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
  const txUser = {
    update: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  };
  const $queryRaw = jest.fn();
  const tx = { user: txUser } as unknown as Prisma.TransactionClient;
  const repository = new UserRepository({
    user,
    $queryRaw,
    extendedClient: () => ({ user: extendedUser }),
  } as unknown as PrismaService);
  const result = { id: 'result' };

  const joinedValues = (value: unknown) => (value as Prisma.Sql).values;
  const rawSql = (strings: TemplateStringsArray) => strings.join('?');

  beforeEach(() => {
    jest.clearAllMocks();
    [
      ...Object.values(user),
      ...Object.values(extendedUser),
      ...Object.values(txUser),
    ].forEach((fn) => fn.mockReturnValue(result));
    $queryRaw.mockReturnValue(['row']);
  });

  describe('rawCount', () => {
    it('should count followed users with a follow join', () => {
      expect(repository.rawCount('me', ['a', 'b'], 'name', true)).toEqual([
        'row',
      ]);

      const [strings, ids, search, userId] = $queryRaw.mock.calls[0];
      expect(rawSql(strings)).toContain('INNER JOIN public."Follow"');
      expect(joinedValues(ids)).toEqual(['a', 'b']);
      expect(search).toBe('name');
      expect(userId).toBe('me');
    });

    it('should count users without the follow join', () => {
      expect(repository.rawCount('me', ['a'], 'name')).toEqual(['row']);

      const [strings, ids, search, ...rest] = $queryRaw.mock.calls[0];
      expect(rawSql(strings)).not.toContain('Follow');
      expect(joinedValues(ids)).toEqual(['a']);
      expect(search).toBe('name');
      expect(rest).toEqual([]);
    });
  });

  describe('rawFindMany', () => {
    it('should find followed users with paging', () => {
      expect(repository.rawFindMany('me', ['a'], 5, 10, 'name', true)).toEqual([
        'row',
      ]);

      const [strings, ids, search, userId, take, skip] =
        $queryRaw.mock.calls[0];
      expect(rawSql(strings)).toContain('INNER JOIN public."Follow"');
      expect(joinedValues(ids)).toEqual(['a']);
      expect(search).toBe('name');
      expect(userId).toBe('me');
      expect(take).toBe(10);
      expect(skip).toBe(5);
    });

    it('should find users with follow flag subquery', () => {
      expect(repository.rawFindMany('me', ['a'], 5, 10, 'name')).toEqual([
        'row',
      ]);

      const [strings, userId, ids, search, take, skip] =
        $queryRaw.mock.calls[0];
      expect(rawSql(strings)).not.toContain('INNER JOIN');
      expect(userId).toBe('me');
      expect(joinedValues(ids)).toEqual(['a']);
      expect(search).toBe('name');
      expect(take).toBe(10);
      expect(skip).toBe(5);
    });
  });

  it('count should count through the extended client', () => {
    expect(repository.count({ name: 'n' })).toBe(result);
    expect(extendedUser.count).toHaveBeenCalledWith({ where: { name: 'n' } });
  });

  it('updateMaxQuotaByUserIdTransaction should update quotas in transaction', () => {
    expect(
      repository.updateMaxQuotaByUserIdTransaction(
        'u',
        BigInt(10),
        BigInt(2),
        tx,
      ),
    ).toBe(result);
    expect(txUser.update).toHaveBeenCalledWith({
      where: { id: 'u' },
      data: { maxPhotoQuota: BigInt(10), maxPackageCount: BigInt(2) },
    });
  });

  it('updateMaxQuotaByUserId should update quotas', () => {
    expect(repository.updateMaxQuotaByUserId('u', BigInt(10), BigInt(2))).toBe(
      result,
    );
    expect(extendedUser.update).toHaveBeenCalledWith({
      where: { id: 'u' },
      data: { maxPhotoQuota: BigInt(10), maxPackageCount: BigInt(2) },
    });
  });

  it('increasePhotoQuotaUsageById should increment quota usage', () => {
    expect(repository.increasePhotoQuotaUsageById('u', 3)).toBe(result);
    expect(extendedUser.update).toHaveBeenCalledWith({
      where: { id: 'u' },
      data: { photoQuotaUsage: { increment: 3 } },
    });
  });

  it('findOneByIdWithFollowings should include following ids', async () => {
    expect(await repository.findOneByIdWithFollowings('u')).toBe(result);
    expect(user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u' },
      include: { followings: { select: { followingId: true } } },
    });
  });

  it('findUniqueOrThrow should find by id with include', async () => {
    expect(await repository.findUniqueOrThrow('u', { photos: true })).toBe(
      result,
    );
    expect(user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'u' },
      include: { photos: true },
    });
  });

  it('findUnique should find by id with include', async () => {
    expect(await repository.findUnique('u')).toBe(result);
    expect(user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u' },
      include: undefined,
    });
  });

  it('aggregate should forward args', () => {
    const args = { _count: { id: true as const } };

    expect(repository.aggregate(args)).toBe(result);
    expect(user.aggregate).toHaveBeenCalledWith(args);
  });

  describe('update', () => {
    it('should use the transaction client when provided', () => {
      expect(repository.update('u', { name: 'n' }, tx)).toBe(result);
      expect(txUser.update).toHaveBeenCalledWith({
        where: { id: 'u' },
        data: { name: 'n' },
      });
      expect(extendedUser.update).not.toHaveBeenCalled();
    });

    it('should use the extended client without transaction', () => {
      expect(repository.update('u', { name: 'n' })).toBe(result);
      expect(extendedUser.update).toHaveBeenCalledWith({
        where: { id: 'u' },
        data: { name: 'n' },
      });
      expect(txUser.update).not.toHaveBeenCalled();
    });
  });

  it('findUniqueTransaction should find by filter id in transaction', async () => {
    const filter = { id: 'u' } as UserFilterDto;

    expect(await repository.findUniqueTransaction(filter, tx)).toBe(result);
    expect(txUser.findUnique).toHaveBeenCalledWith({ where: { id: 'u' } });
  });

  describe('createIfNotExistTransaction', () => {
    const entity = new UserEntity({
      id: 'u',
      ftpUsername: 'ftp-user',
      ftpPassword: 'ftp-pass',
    });

    it('should upsert the user updating ftp credentials', async () => {
      expect(await repository.createIfNotExistTransaction(entity, tx)).toBe(
        result,
      );
      expect(txUser.upsert).toHaveBeenCalledWith({
        where: { id: 'u' },
        update: { ftpUsername: 'ftp-user', ftpPassword: 'ftp-pass' },
        create: entity,
      });
    });

    it('should throw DuplicatedUserIdException on synchronous P2002 errors', async () => {
      txUser.upsert.mockImplementation(() => {
        throw new Prisma.PrismaClientKnownRequestError('duplicated', {
          code: 'P2002',
          clientVersion: '5.22.0',
        });
      });

      await expect(
        repository.createIfNotExistTransaction(entity, tx),
      ).rejects.toBeInstanceOf(DuplicatedUserIdException);
    });

    it('should throw DuplicatedUserIdException when upsert rejects asynchronously with P2002', async () => {
      txUser.upsert.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicated', {
          code: 'P2002',
          clientVersion: '5.22.0',
        }),
      );

      await expect(
        repository.createIfNotExistTransaction(entity, tx),
      ).rejects.toBeInstanceOf(DuplicatedUserIdException);
    });

    it('should swallow other known request errors', async () => {
      txUser.upsert.mockImplementation(() => {
        throw new Prisma.PrismaClientKnownRequestError('other', {
          code: 'P2025',
          clientVersion: '5.22.0',
        });
      });

      await expect(
        repository.createIfNotExistTransaction(entity, tx),
      ).resolves.toBeUndefined();
    });

    it('should swallow unknown errors', async () => {
      txUser.upsert.mockImplementation(() => {
        throw new Error('boom');
      });

      await expect(
        repository.createIfNotExistTransaction(entity, tx),
      ).resolves.toBeUndefined();
    });
  });

  it('upsert should create user without updating', async () => {
    const data = { id: 'u', name: 'n' } as unknown as Prisma.UserCreateInput;

    expect(await repository.upsert(data)).toBe(result);
    expect(user.upsert).toHaveBeenCalledWith({
      where: { id: 'u' },
      update: {},
      create: data,
    });
  });

  it('findManyWithoutPaging should find with where', async () => {
    expect(await repository.findManyWithoutPaging({ name: 'n' })).toBe(result);
    expect(extendedUser.findMany).toHaveBeenCalledWith({
      where: { name: 'n' },
    });
  });

  it('findMany should page with include and ordering', async () => {
    const orderBy = [{ name: 'asc' as const }];

    expect(
      await repository.findMany({ name: 'n' }, orderBy, { photos: true }, 1, 2),
    ).toBe(result);
    expect(extendedUser.findMany).toHaveBeenCalledWith({
      where: { name: 'n' },
      include: { photos: true },
      orderBy,
      skip: 1,
      take: 2,
    });
  });
});
