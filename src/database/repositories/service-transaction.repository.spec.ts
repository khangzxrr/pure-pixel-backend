import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ServiceTransactionRepository } from './service-transaction.repository';

describe('ServiceTransactionRepository', () => {
  const serviceTransaction = { findUniqueOrThrow: jest.fn() };
  const extendedServiceTransaction = { update: jest.fn() };
  const txServiceTransaction = { findMany: jest.fn(), update: jest.fn() };
  const tx = {
    serviceTransaction: txServiceTransaction,
  } as unknown as Prisma.TransactionClient;
  const repository = new ServiceTransactionRepository({
    serviceTransaction,
    extendedClient: () => ({ serviceTransaction: extendedServiceTransaction }),
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [undefined, false],
    [true, true],
  ])(
    'findById with includeUpgradePackageHistory=%p should include history %p',
    async (flag, expected) => {
      serviceTransaction.findUniqueOrThrow.mockResolvedValue('found');

      await expect(repository.findById('s', flag)).resolves.toBe('found');
      expect(serviceTransaction.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 's' },
        include: {
          upgradeOrder: { include: { upgradePackageHistory: expected } },
        },
      });
    },
  );

  it('getAllPendingOrderIdTransactionByUserId should select pending ids', async () => {
    txServiceTransaction.findMany.mockResolvedValue([{ id: 's' }]);

    await expect(
      repository.getAllPendingOrderIdTransactionByUserId('u', tx),
    ).resolves.toEqual([{ id: 's' }]);
    expect(txServiceTransaction.findMany).toHaveBeenCalledWith({
      where: {
        upgradeOrder: { status: 'PENDING' },
        transaction: { userId: 'u' },
      },
      select: { id: true },
    });
  });

  it('cancelAllPendingOrderTransactionQueries should build one cancel query per id', async () => {
    txServiceTransaction.update.mockImplementation(
      ({ where }: { where: { id: string } }) => `update-${where.id}`,
    );

    await expect(
      repository.cancelAllPendingOrderTransactionQueries(['a', 'b'], tx),
    ).resolves.toEqual(['update-a', 'update-b']);
    expect(txServiceTransaction.update).toHaveBeenCalledTimes(2);
    expect(txServiceTransaction.update).toHaveBeenCalledWith({
      where: { id: 'a' },
      data: {
        upgradeOrder: { update: { status: 'CANCEL' } },
        transaction: { update: { status: 'CANCEL' } },
      },
    });
  });

  it('updateSuccessServiceTransactionAndActivateUpgradeOrder should mark success', () => {
    extendedServiceTransaction.update.mockReturnValue('updated');
    const payload = { ref: 1 };

    expect(
      repository.updateSuccessServiceTransactionAndActivateUpgradeOrder(
        's',
        payload,
      ),
    ).toBe('updated');
    expect(extendedServiceTransaction.update).toHaveBeenCalledWith({
      where: { id: 's' },
      data: {
        transaction: {
          update: { status: 'SUCCESS', paymentPayload: payload },
        },
        upgradeOrder: { update: { status: 'ACTIVE' } },
      },
    });
  });
});
