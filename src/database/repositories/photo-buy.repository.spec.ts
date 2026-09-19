import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PhotoBuyRepository } from './photo-buy.repository';

describe('PhotoBuyRepository', () => {
  const photoBuy = {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const txCreate = jest.fn();
  const tx = {
    photoBuy: { create: txCreate },
  } as unknown as Prisma.TransactionClient;
  const repository = new PhotoBuyRepository({
    photoBuy,
  } as unknown as PrismaService);
  const result = { id: 'result' };
  const transactionInclude = {
    userToUserTransaction: { include: { fromUserTransaction: true } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    [...Object.values(photoBuy), txCreate].forEach((fn) =>
      fn.mockReturnValue(result),
    );
  });

  it('count should count with where', () => {
    expect(repository.count({ buyerId: 'b' })).toBe(result);
    expect(photoBuy.count).toHaveBeenCalledWith({ where: { buyerId: 'b' } });
  });

  it('findAll should include transaction and sell history', () => {
    expect(repository.findAll({ buyerId: 'b' })).toBe(result);
    expect(photoBuy.findMany).toHaveBeenCalledWith({
      where: { buyerId: 'b' },
      include: {
        ...transactionInclude,
        photoSellHistory: { include: { originalPhotoSell: true } },
      },
    });
  });

  it('findFirstById should find by id and buyer', async () => {
    expect(await repository.findFirstById('pb', 'b')).toBe(result);
    expect(photoBuy.findFirst).toHaveBeenCalledWith({
      where: { id: 'pb', buyerId: 'b' },
      include: transactionInclude,
    });
  });

  it('findUniqueOrThrow should include sell history', async () => {
    expect(await repository.findUniqueOrThrow({ id: 'pb' })).toBe(result);
    expect(photoBuy.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'pb' },
      include: { ...transactionInclude, photoSellHistory: true },
    });
  });

  it('findFirst should find with where', async () => {
    expect(await repository.findFirst({ buyerId: 'b' })).toBe(result);
    expect(photoBuy.findFirst).toHaveBeenCalledWith({
      where: { buyerId: 'b' },
      include: transactionInclude,
    });
  });

  it('createWithTransaction should create through the transaction client', async () => {
    const data = {
      buyer: { connect: { id: 'b' } },
    } as unknown as Prisma.PhotoBuyCreateInput;

    expect(await repository.createWithTransaction(data, tx)).toBe(result);
    expect(txCreate).toHaveBeenCalledWith({
      include: transactionInclude,
      data,
    });
  });
});
