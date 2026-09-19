import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { WithdrawalTransactionRepository } from './withdrawal-transaction.repository';

describe('WithdrawalTransactionRepository', () => {
  const extended = {
    withdrawalTransaction: { update: jest.fn() },
    transaction: { findFirst: jest.fn(), create: jest.fn() },
  };
  const txClient = {
    withdrawalTransaction: { update: jest.fn() },
    transaction: { findFirst: jest.fn(), create: jest.fn() },
  };
  const tx = txClient as unknown as Prisma.TransactionClient;
  const repository = new WithdrawalTransactionRepository({
    extendedClient: () => extended,
  } as unknown as PrismaService);
  const createData = {
    data: {
      user: { connect: { id: 'u' } },
      status: 'PENDING',
      amount: 500,
      paymentPayload: {},
      type: 'WITHDRAWAL',
      paymentMethod: 'WALLET',
      withdrawalTransaction: {
        create: {
          bankName: 'VCB',
          bankUsername: 'NGUYEN VAN A',
          bankNumber: '0123',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    [
      extended.withdrawalTransaction.update,
      extended.transaction.findFirst,
      extended.transaction.create,
    ].forEach((fn) => fn.mockReturnValue('extended-result'));
    [
      txClient.withdrawalTransaction.update,
      txClient.transaction.findFirst,
      txClient.transaction.create,
    ].forEach((fn) => fn.mockReturnValue('tx-result'));
  });

  describe('update', () => {
    const where = { id: 'w' };
    const data = { bankName: 'ACB' };

    it('should use the transaction client when provided', () => {
      expect(repository.update(where, data, tx)).toBe('tx-result');
      expect(txClient.withdrawalTransaction.update).toHaveBeenCalledWith({
        where,
        data,
      });
      expect(extended.withdrawalTransaction.update).not.toHaveBeenCalled();
    });

    it('should use the extended client when transaction is missing', () => {
      expect(
        repository.update(
          where,
          data,
          undefined as unknown as Prisma.TransactionClient,
        ),
      ).toBe('extended-result');
      expect(extended.withdrawalTransaction.update).toHaveBeenCalledWith({
        where,
        data,
      });
      expect(txClient.withdrawalTransaction.update).not.toHaveBeenCalled();
    });
  });

  describe('findFirst', () => {
    const where = { userId: 'u' };

    it('should use the transaction client when provided', () => {
      expect(repository.findFirst(where, tx)).toBe('tx-result');
      expect(txClient.transaction.findFirst).toHaveBeenCalledWith({ where });
      expect(extended.transaction.findFirst).not.toHaveBeenCalled();
    });

    it('should use the extended client without transaction', () => {
      expect(repository.findFirst(where)).toBe('extended-result');
      expect(extended.transaction.findFirst).toHaveBeenCalledWith({ where });
      expect(txClient.transaction.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create through the transaction client when provided', () => {
      expect(
        repository.create('u', 500, 'VCB', '0123', 'NGUYEN VAN A', tx),
      ).toBe('tx-result');
      expect(txClient.transaction.create).toHaveBeenCalledWith(createData);
      expect(extended.transaction.create).not.toHaveBeenCalled();
    });

    it('should create through the extended client without transaction', () => {
      expect(repository.create('u', 500, 'VCB', '0123', 'NGUYEN VAN A')).toBe(
        'extended-result',
      );
      expect(extended.transaction.create).toHaveBeenCalledWith(createData);
      expect(txClient.transaction.create).not.toHaveBeenCalled();
    });
  });
});
