import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserToUserRepository } from './user-to-user-transaction.repository';

describe('UserToUserRepository', () => {
  const userToUserTransaction = { findUnique: jest.fn(), update: jest.fn() };
  const extendedUserToUser = { findMany: jest.fn() };
  const txUpdate = jest.fn();
  const tx = {
    userToUserTransaction: { update: txUpdate },
  } as unknown as Prisma.TransactionClient;
  const repository = new UserToUserRepository({
    userToUserTransaction,
    extendedClient: () => ({ userToUserTransaction: extendedUserToUser }),
  } as unknown as PrismaService);
  const result = { id: 'result' };

  beforeEach(() => {
    jest.clearAllMocks();
    [
      userToUserTransaction.findUnique,
      userToUserTransaction.update,
      extendedUserToUser.findMany,
      txUpdate,
    ].forEach((fn) => fn.mockReturnValue(result));
  });

  it('getById should include buyer transaction and photo', async () => {
    expect(await repository.getById('t')).toBe(result);
    expect(userToUserTransaction.findUnique).toHaveBeenCalledWith({
      where: { id: 't' },
      include: {
        fromUserTransaction: { include: { user: true } },
        photoBuy: {
          include: {
            photoSellHistory: {
              include: { originalPhotoSell: { include: { photo: true } } },
            },
          },
        },
      },
    });
  });

  it('findMany should include both transactions', async () => {
    expect(await repository.findMany({ id: 't' })).toBe(result);
    expect(extendedUserToUser.findMany).toHaveBeenCalledWith({
      where: { id: 't' },
      include: { fromUserTransaction: true, toUserTransaction: true },
    });
  });

  it('updateById should update through the transaction client', async () => {
    const update = {} as Prisma.UserToUserTransactionUpdateInput;

    expect(await repository.updateById('t', update, tx)).toBe(result);
    expect(txUpdate).toHaveBeenCalledWith({
      where: { id: 't' },
      data: update,
    });
  });

  it('markSucccessAndCreateToUserTransaction should mark success and create receiver transaction', async () => {
    const payload = { ref: 'x' };
    const fee = new Prisma.Decimal(1);
    const amount = new Prisma.Decimal(99);

    expect(
      await repository.markSucccessAndCreateToUserTransaction(
        't',
        payload,
        'receiver',
        fee,
        amount,
      ),
    ).toBe(result);
    expect(userToUserTransaction.update).toHaveBeenCalledWith({
      where: { id: 't' },
      data: {
        fromUserTransaction: {
          update: {
            data: {
              status: 'SUCCESS',
              paymentPayload: payload,
              paymentMethod: 'SEPAY',
            },
          },
        },
        toUserTransaction: {
          create: {
            paymentPayload: payload,
            type: 'IMAGE_SELL',
            fee,
            user: { connect: { id: 'receiver' } },
            amount,
            status: 'SUCCESS',
            paymentMethod: 'WALLET',
          },
        },
      },
    });
  });
});
