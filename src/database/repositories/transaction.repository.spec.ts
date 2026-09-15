import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { TransactionRepository } from './transaction.repository';

describe('TransactionRepository', () => {
  const transaction = {
    count: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const extendedTransaction = { create: jest.fn(), aggregate: jest.fn() };
  const txUpdateMany = jest.fn();
  const tx = {
    transaction: { updateMany: txUpdateMany },
  } as unknown as Prisma.TransactionClient;
  const repository = new TransactionRepository({
    transaction,
    extendedClient: () => ({ transaction: extendedTransaction }),
  } as unknown as PrismaService);
  const result = { id: 'result' };
  const include = {
    user: true,
    toUserTransaction: true,
    fromUserTransaction: true,
    depositTransaction: true,
    serviceTransaction: true,
    withdrawalTransaction: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    [
      ...Object.values(transaction),
      ...Object.values(extendedTransaction),
    ].forEach((fn) => fn.mockReturnValue(result));
    txUpdateMany.mockReturnValue('tx-result');
  });

  it('create should create through the extended client', async () => {
    const data = { amount: 1 } as unknown as Prisma.TransactionCreateInput;

    expect(await repository.create(data)).toBe(result);
    expect(extendedTransaction.create).toHaveBeenCalledWith({ data });
  });

  it('countAll should count with where', async () => {
    expect(await repository.countAll({ userId: 'u' })).toBe(result);
    expect(transaction.count).toHaveBeenCalledWith({ where: { userId: 'u' } });
  });

  it('cancelAllPendingTransactionByIdAndType should cancel pending transactions', () => {
    expect(
      repository.cancelAllPendingTransactionByIdAndType('u', 'DEPOSIT'),
    ).toBe(result);
    expect(transaction.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u', type: 'DEPOSIT', status: 'PENDING' },
      data: { status: 'CANCEL' },
    });
  });

  it('updateStatusAndPayload should update status and payload', async () => {
    const payload = { a: 1 };

    expect(
      await repository.updateStatusAndPayload('t', 'SUCCESS', payload),
    ).toBe(result);
    expect(transaction.update).toHaveBeenCalledWith({
      where: { id: 't' },
      data: { status: 'SUCCESS', paymentPayload: payload },
    });
  });

  describe('update', () => {
    it('should use the transaction client when provided', async () => {
      expect(
        await repository.update({ id: 't' }, { status: 'CANCEL' }, tx),
      ).toBe('tx-result');
      expect(txUpdateMany).toHaveBeenCalledWith({
        where: { id: 't' },
        data: { status: 'CANCEL' },
      });
      expect(transaction.updateMany).not.toHaveBeenCalled();
    });

    it('should use the base client without transaction', async () => {
      expect(await repository.update({ id: 't' }, { status: 'CANCEL' })).toBe(
        result,
      );
      expect(transaction.updateMany).toHaveBeenCalledWith({
        where: { id: 't' },
        data: { status: 'CANCEL' },
      });
      expect(txUpdateMany).not.toHaveBeenCalled();
    });
  });

  it('aggregate should forward args to the extended client', async () => {
    const args = { _sum: { amount: true as const } };

    expect(await repository.aggregate(args)).toBe(result);
    expect(extendedTransaction.aggregate).toHaveBeenCalledWith(args);
  });

  it('findAll should page with relations', async () => {
    const orderBy = [{ createdAt: 'desc' as const }];

    expect(await repository.findAll({ userId: 'u' }, 1, 2, orderBy)).toBe(
      result,
    );
    expect(transaction.findMany).toHaveBeenCalledWith({
      where: { userId: 'u' },
      skip: 1,
      take: 2,
      include,
      orderBy,
    });
  });

  it('findUniqueOrThrow should include relations', async () => {
    expect(await repository.findUniqueOrThrow({ id: 't' })).toBe(result);
    expect(transaction.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 't' },
      include,
    });
  });
});
