import { Prisma, UpgradePackage } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UpgradePackageOrderRepository } from './upgrade-package-order.repository';

describe('UpgradePackageOrderRepository', () => {
  const upgradeOrder = {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    findFirst: jest.fn(),
  };
  const extendedUpgradeOrder = { findUnique: jest.fn(), count: jest.fn() };
  const txUpgradeOrder = {
    update: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  };
  const tx = {
    upgradeOrder: txUpgradeOrder,
  } as unknown as Prisma.TransactionClient;
  const repository = new UpgradePackageOrderRepository({
    upgradeOrder,
    extendedClient: () => ({ upgradeOrder: extendedUpgradeOrder }),
  } as unknown as PrismaService);
  const result = { id: 'result' };
  const upgradePackage = {
    id: 'pkg',
    price: new Prisma.Decimal(100),
    name: 'Pro',
    descriptions: ['a'],
    maxPhotoQuota: BigInt(10),
    minOrderMonth: 1,
    maxPackageCount: BigInt(2),
  } as unknown as UpgradePackage;
  const expiredAt = new Date('2025-01-01');
  const amount = new Prisma.Decimal(100);
  const refundAmount = new Prisma.Decimal(5);
  const createSelect = {
    id: true,
    serviceTransaction: { select: { id: true, transaction: true } },
    upgradePackageHistory: { select: { id: true } },
  };
  const historyCreate = {
    create: {
      originalUpgradePackage: { connect: { id: 'pkg' } },
      price: upgradePackage.price,
      name: 'Pro',
      descriptions: ['a'],
      maxPhotoQuota: BigInt(10),
      minOrderMonth: 1,
      maxPackageCount: BigInt(2),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    [
      ...Object.values(upgradeOrder),
      ...Object.values(extendedUpgradeOrder),
      ...Object.values(txUpgradeOrder),
    ].forEach((fn) => fn.mockReturnValue(result));
  });

  it('findById should find by id through the extended client', async () => {
    expect(await repository.findById('o')).toBe(result);
    expect(extendedUpgradeOrder.findUnique).toHaveBeenCalledWith({
      where: { id: 'o' },
    });
  });

  it('count should count with where', async () => {
    expect(await repository.count({ userId: 'u' })).toBe(result);
    expect(extendedUpgradeOrder.count).toHaveBeenCalledWith({
      where: { userId: 'u' },
    });
  });

  it('findManyActivateOrder should find active orders', async () => {
    expect(await repository.findManyActivateOrder()).toBe(result);
    expect(upgradeOrder.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
    });
  });

  it('findManyActivateAndExpired should find expired active orders', async () => {
    const date = new Date('2024-01-01');

    expect(await repository.findManyActivateAndExpired(date)).toBe(result);
    expect(upgradeOrder.findMany).toHaveBeenCalledWith({
      where: { expiredAt: { lte: date }, status: 'ACTIVE' },
    });
  });

  it('deactivateActivatedAndExpired should expire orders', async () => {
    const date = new Date('2024-01-01');

    expect(await repository.deactivateActivatedAndExpired(date)).toBe(result);
    expect(upgradeOrder.updateMany).toHaveBeenCalledWith({
      where: { expiredAt: { lte: date }, status: 'ACTIVE' },
      data: { status: 'EXPIRE' },
    });
  });

  it('cancelOrderAndTransaction should cancel order and transaction', async () => {
    expect(await repository.cancelOrderAndTransaction('o', tx)).toBe(result);
    expect(txUpgradeOrder.update).toHaveBeenCalledWith({
      where: { id: 'o' },
      data: {
        status: 'CANCEL',
        serviceTransaction: {
          update: { transaction: { update: { status: 'CANCEL' } } },
        },
      },
    });
  });

  it('findCurrentUpgradePackageByUserId should include history and transaction', async () => {
    expect(await repository.findCurrentUpgradePackageByUserId('u')).toBe(
      result,
    );
    expect(upgradeOrder.findFirst).toHaveBeenCalledWith({
      where: { userId: 'u', status: 'ACTIVE' },
      include: {
        upgradePackageHistory: { include: { originalUpgradePackage: true } },
        serviceTransaction: { include: { transaction: true } },
      },
    });
  });

  it('findManyPendingOrderByUserId should find pending orders', async () => {
    expect(await repository.findManyPendingOrderByUserId('u')).toBe(result);
    expect(upgradeOrder.findMany).toHaveBeenCalledWith({
      where: { userId: 'u', status: 'PENDING' },
    });
  });

  it('createSuccessUpgradeOrderByWallet should create an active wallet order', async () => {
    const payload = { wallet: true };

    expect(
      await repository.createSuccessUpgradeOrderByWallet(
        'u',
        upgradePackage,
        expiredAt,
        amount,
        refundAmount,
        payload,
        tx,
      ),
    ).toBe(result);
    expect(txUpgradeOrder.create).toHaveBeenCalledWith({
      select: createSelect,
      data: {
        expiredAt,
        status: 'ACTIVE',
        user: { connect: { id: 'u' } },
        upgradePackageHistory: historyCreate,
        serviceTransaction: {
          create: {
            transaction: {
              create: {
                user: { connect: { id: 'u' } },
                type: 'UPGRADE_TO_PHOTOGRAPHER',
                amount,
                fee: refundAmount,
                paymentMethod: 'WALLET',
                status: 'SUCCESS',
                paymentPayload: payload,
              },
            },
          },
        },
      },
    });
  });

  it('createUpgradeOrderByBanking should create a pending banking order', async () => {
    expect(
      await repository.createUpgradeOrderByBanking(
        'u',
        upgradePackage,
        expiredAt,
        amount,
        refundAmount,
        tx,
      ),
    ).toBe(result);
    expect(txUpgradeOrder.create).toHaveBeenCalledWith({
      select: createSelect,
      data: {
        expiredAt,
        status: 'PENDING',
        user: { connect: { id: 'u' } },
        upgradePackageHistory: historyCreate,
        serviceTransaction: {
          create: {
            transaction: {
              create: {
                user: { connect: { id: 'u' } },
                type: 'UPGRADE_TO_PHOTOGRAPHER',
                amount,
                fee: refundAmount,
                paymentMethod: 'SEPAY',
                status: 'PENDING',
                paymentPayload: {},
              },
            },
          },
        },
      },
    });
  });

  it('deactivateCurentUpgradePackageByUserId should expire active orders', () => {
    expect(repository.deactivateCurentUpgradePackageByUserId('u', tx)).toBe(
      result,
    );
    expect(txUpgradeOrder.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u', status: 'ACTIVE' },
      data: { status: 'EXPIRE' },
    });
  });
});
