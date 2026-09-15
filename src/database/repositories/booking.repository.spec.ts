import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { BookingRepository } from './booking.repository';

describe('BookingRepository', () => {
  const booking = {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const extended = { booking };
  const prisma = {
    extendedClient: jest.fn(() => extended),
  } as unknown as PrismaService;
  const txUpdate = jest.fn();
  const tx = {
    booking: { update: txUpdate },
  } as unknown as Prisma.TransactionClient;
  const result = { id: 'result' };
  let repository: BookingRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(booking).forEach((fn) => fn.mockReturnValue(result));
    txUpdate.mockReturnValue('tx-result');
    repository = new BookingRepository(prisma);
  });

  it('findMany should find with where', async () => {
    expect(await repository.findMany({ userId: 'u' })).toBe(result);
    expect(booking.findMany).toHaveBeenCalledWith({ where: { userId: 'u' } });
  });

  it('create should create with data', async () => {
    const data = {
      user: { connect: { id: 'u' } },
    } as unknown as Prisma.BookingCreateInput;

    expect(await repository.create(data)).toBe(result);
    expect(booking.create).toHaveBeenCalledWith({ data });
  });

  it('findFirst should find first with where', async () => {
    expect(await repository.findFirst({ id: 'b' })).toBe(result);
    expect(booking.findFirst).toHaveBeenCalledWith({ where: { id: 'b' } });
  });

  it('count should count with where', async () => {
    expect(await repository.count({ id: 'b' })).toBe(result);
    expect(booking.count).toHaveBeenCalledWith({ where: { id: 'b' } });
  });

  it('aggregate should forward args', async () => {
    const args = { _count: { id: true as const } };

    expect(await repository.aggregate(args)).toBe(result);
    expect(booking.aggregate).toHaveBeenCalledWith(args);
  });

  it('updateByIdQuery should build update query', () => {
    expect(repository.updateByIdQuery('b', { status: 'ACCEPTED' })).toBe(
      result,
    );
    expect(booking.update).toHaveBeenCalledWith({
      where: { id: 'b' },
      data: { status: 'ACCEPTED' },
    });
  });

  it('updateById should use the transaction client when provided', async () => {
    expect(await repository.updateById('b', { status: 'DENIED' }, tx)).toBe(
      'tx-result',
    );
    expect(txUpdate).toHaveBeenCalledWith({
      where: { id: 'b' },
      data: { status: 'DENIED' },
    });
    expect(booking.update).not.toHaveBeenCalled();
  });

  it('updateById should use the extended client without transaction', async () => {
    expect(await repository.updateById('b', { status: 'DENIED' })).toBe(result);
    expect(booking.update).toHaveBeenCalledWith({
      where: { id: 'b' },
      data: { status: 'DENIED' },
    });
    expect(txUpdate).not.toHaveBeenCalled();
  });

  it('findUniqueOrThrow should include booking relations', async () => {
    expect(await repository.findUniqueOrThrow({ id: 'b' })).toBe(result);
    expect(booking.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'b' },
      include: {
        user: true,
        originalPhotoshootPackage: { include: { user: true } },
        photoshootPackageHistory: true,
        billItems: true,
        reviews: { include: { user: true } },
        photos: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });

  it('findAllWithIncludedPhotoshootPackage should page with includes', async () => {
    const orderBy = [{ createdAt: 'desc' as const }];

    expect(
      await repository.findAllWithIncludedPhotoshootPackage(
        0,
        10,
        { userId: 'u' },
        orderBy,
      ),
    ).toBe(result);
    expect(booking.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      where: { userId: 'u' },
      orderBy,
      include: {
        user: true,
        photoshootPackageHistory: true,
        originalPhotoshootPackage: { include: { user: true } },
        reviews: { include: { user: true } },
      },
    });
  });
});
