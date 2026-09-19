import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ReportRepository } from './report.repository';

describe('ReportRepository', () => {
  const report = {
    delete: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const repository = new ReportRepository({
    report,
  } as unknown as PrismaService);
  const result = { id: 'result' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(report).forEach((fn) => fn.mockReturnValue(result));
  });

  it('delete should delete by id', async () => {
    expect(await repository.delete('r')).toBe(result);
    expect(report.delete).toHaveBeenCalledWith({ where: { id: 'r' } });
  });

  it('findUniqueOrThrow should find by id', async () => {
    expect(await repository.findUniqueOrThrow('r')).toBe(result);
    expect(report.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'r' },
    });
  });

  it('count should count with where', async () => {
    expect(await repository.count({ userId: 'u' })).toBe(result);
    expect(report.count).toHaveBeenCalledWith({ where: { userId: 'u' } });
  });

  it('findAll should page with user include', async () => {
    const orderBy = [{ createdAt: 'desc' as const }];

    expect(await repository.findAll(10, 5, { userId: 'u' }, orderBy)).toBe(
      result,
    );
    expect(report.findMany).toHaveBeenCalledWith({
      skip: 5,
      take: 10,
      where: { userId: 'u' },
      orderBy,
      include: { user: true },
    });
  });

  it('create should create with data', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const data = { content: 'spam' } as unknown as Prisma.ReportCreateInput;

    expect(await repository.create(data)).toBe(result);
    expect(report.create).toHaveBeenCalledWith({ data });
    logSpy.mockRestore();
  });

  it('updateById should update by id', async () => {
    expect(await repository.updateById('r', { content: 'x' })).toBe(result);
    expect(report.update).toHaveBeenCalledWith({
      where: { id: 'r' },
      data: { content: 'x' },
    });
  });
});
