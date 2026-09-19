import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { NotificationRepository } from './notification.repository';

describe('NotificationRepository', () => {
  const notification = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
  const repository = new NotificationRepository({
    notification,
  } as unknown as PrismaService);
  const result = { id: 'result' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(notification).forEach((fn) => fn.mockReturnValue(result));
  });

  it('count should count with where', async () => {
    expect(await repository.count({ userId: 'u' })).toBe(result);
    expect(notification.count).toHaveBeenCalledWith({
      where: { userId: 'u' },
    });
  });

  it('findAll should page ordered by newest first', async () => {
    expect(await repository.findAll(1, 2, { userId: 'u' })).toBe(result);
    expect(notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'u' },
      skip: 1,
      take: 2,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create should create with data', async () => {
    const data = {
      title: 't',
    } as unknown as Prisma.NotificationCreateInput;

    expect(await repository.create(data)).toBe(result);
    expect(notification.create).toHaveBeenCalledWith({ data });
  });
});
