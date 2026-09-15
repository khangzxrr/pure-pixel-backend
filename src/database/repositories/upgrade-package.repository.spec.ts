import { UpgradePackage } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UpgradePackageRepository } from './upgrade-package.repository';

describe('UpgradePackageRepository', () => {
  const upgradePackage = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  };
  const repository = new UpgradePackageRepository({
    extendedClient: () => ({ upgradePackage }),
  } as unknown as PrismaService);
  const result = { id: 'result' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(upgradePackage).forEach((fn) => fn.mockReturnValue(result));
  });

  it('create should create with data', async () => {
    const data = { id: 'pkg', name: 'Pro' } as unknown as UpgradePackage;

    expect(await repository.create(data)).toBe(result);
    expect(upgradePackage.create).toHaveBeenCalledWith({ data });
  });

  it('updateById should update by id', async () => {
    expect(await repository.updateById('pkg', { name: 'n' })).toBe(result);
    expect(upgradePackage.update).toHaveBeenCalledWith({
      where: { id: 'pkg' },
      data: { name: 'n' },
    });
  });

  it('findById should find by id', async () => {
    expect(await repository.findById('pkg')).toBe(result);
    expect(upgradePackage.findUnique).toHaveBeenCalledWith({
      where: { id: 'pkg' },
    });
  });

  it('update should update by id', async () => {
    expect(await repository.update('pkg', { name: 'n' })).toBe(result);
    expect(upgradePackage.update).toHaveBeenCalledWith({
      where: { id: 'pkg' },
      data: { name: 'n' },
    });
  });

  it('delete should delete by id', async () => {
    expect(await repository.delete('pkg')).toBe(result);
    expect(upgradePackage.delete).toHaveBeenCalledWith({
      where: { id: 'pkg' },
    });
  });

  it('count should count with where', () => {
    expect(repository.count({ name: 'n' })).toBe(result);
    expect(upgradePackage.count).toHaveBeenCalledWith({ where: { name: 'n' } });
  });

  it('findFirst should find with where', async () => {
    expect(await repository.findFirst({ name: 'n' })).toBe(result);
    expect(upgradePackage.findFirst).toHaveBeenCalledWith({
      where: { name: 'n' },
    });
  });

  it('findAll should page with history count', async () => {
    const orderBy = { price: 'asc' as const };

    expect(await repository.findAll(1, 2, { name: 'n' }, orderBy)).toBe(result);
    expect(upgradePackage.findMany).toHaveBeenCalledWith({
      skip: 1,
      take: 2,
      where: { name: 'n' },
      orderBy,
      include: { _count: { select: { upgradePackageHistories: true } } },
    });
  });
});
