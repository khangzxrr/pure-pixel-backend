import { Cache } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Constants } from 'src/infrastructure/utils/constants';
import { PrismaService } from 'src/prisma.service';
import { SftpService } from 'src/storage/services/sftp.service';
import { UserFilterDto } from 'src/user/dtos/user-filter.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { AuthenService } from './authen.service';

describe('AuthenService', () => {
  const originalEnv = process.env;
  const tx = { user: {} } as unknown as Prisma.TransactionClient;

  let userRepository: {
    findUniqueTransaction: jest.Mock;
    createIfNotExistTransaction: jest.Mock;
  };
  let cache: { get: jest.Mock; set: jest.Mock };
  let prisma: { $transaction: jest.Mock };
  let service: AuthenService;

  beforeEach(() => {
    process.env = { ...originalEnv };

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    userRepository = {
      findUniqueTransaction: jest.fn().mockResolvedValue(null),
      createIfNotExistTransaction: jest.fn().mockResolvedValue(undefined),
    };
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    };
    prisma = {
      $transaction: jest.fn(
        async (fn: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          fn(tx),
      ),
    };

    service = new AuthenService(
      userRepository as unknown as UserRepository,
      {} as SftpService,
      cache as unknown as Cache,
      prisma as unknown as PrismaService,
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('runs inside a serializable transaction', async () => {
    await service.createUserIfNotExist('u1', 'john', 'j@m.c');

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('skips creation when the user is cached', async () => {
    cache.get.mockResolvedValue({ id: 'u1' });

    await service.createUserIfNotExist('u1', 'john', 'j@m.c');

    expect(cache.get).toHaveBeenCalledWith('authen:user:u1');
    expect(userRepository.findUniqueTransaction).not.toHaveBeenCalled();
    expect(userRepository.createIfNotExistTransaction).not.toHaveBeenCalled();
  });

  it('caches and skips creation when the user exists in the database', async () => {
    const existUser = { id: 'u1', name: 'john' };
    userRepository.findUniqueTransaction.mockResolvedValue(existUser);

    await service.createUserIfNotExist('u1', 'john', 'j@m.c');

    const [filter, usedTx] = userRepository.findUniqueTransaction.mock.calls[0];
    expect(filter).toBeInstanceOf(UserFilterDto);
    expect(filter.id).toBe('u1');
    expect(usedTx).toBe(tx);
    expect(cache.set).toHaveBeenCalledWith('authen:user:u1', existUser, 300000);
    expect(userRepository.createIfNotExistTransaction).not.toHaveBeenCalled();
  });

  it('creates a new user with defaults when it does not exist', async () => {
    await service.createUserIfNotExist('u1', 'Võ Khang', 'j@m.c');

    expect(userRepository.createIfNotExistTransaction).toHaveBeenCalledTimes(1);
    const [newUser, usedTx] =
      userRepository.createIfNotExistTransaction.mock.calls[0];

    expect(usedTx).toBe(tx);
    expect(newUser).toBeInstanceOf(UserEntity);
    expect(newUser.id).toBe('u1');
    expect(newUser.name).toBe('Võ Khang');
    expect(newUser.normalizedName).toBe('vo khang');
    expect(newUser.avatar).toBe(Constants.DEFAULT_AVATAR);
    expect(newUser.cover).toBe(Constants.DEFAULT_COVER);
    expect(newUser.ftpUsername).toMatch(/^Võ Khang[A-Za-z0-9]{5}$/);
    expect(newUser.ftpPassword).toMatch(/^[A-Za-z0-9]{12}$/);
  });
});
