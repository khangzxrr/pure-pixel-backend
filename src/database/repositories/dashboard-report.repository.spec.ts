import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { DashboardReportRepository } from './dashboard-report.repository';

describe('DashboardReportRepository', () => {
  const extendedDashboardReport = { upsert: jest.fn(), findMany: jest.fn() };
  const dashboardReport = { create: jest.fn() };
  const prisma = {
    dashboardReport,
    extendedClient: jest.fn(() => ({
      dashboardReport: extendedDashboardReport,
    })),
  } as unknown as PrismaService;
  const result = { id: 'result' };
  let repository: DashboardReportRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    extendedDashboardReport.upsert.mockReturnValue(result);
    extendedDashboardReport.findMany.mockReturnValue(result);
    dashboardReport.create.mockReturnValue(result);
    repository = new DashboardReportRepository(prisma);
  });

  it('upsert should forward where, update and create', () => {
    const where = { id: 'd' };
    const update = {
      totalPhoto: 1,
    } as unknown as Prisma.DashboardReportUpdateInput;
    const create = {
      totalPhoto: 1,
    } as unknown as Prisma.DashboardReportCreateInput;

    expect(repository.upsert(where, update, create)).toBe(result);
    expect(extendedDashboardReport.upsert).toHaveBeenCalledWith({
      where,
      update,
      create,
    });
  });

  it('findMany should find with where', () => {
    const where = { id: 'd' };

    expect(repository.findMany(where)).toBe(result);
    expect(extendedDashboardReport.findMany).toHaveBeenCalledWith({ where });
  });

  it('create should use the base client', () => {
    const data = {
      totalPhoto: 1,
    } as unknown as Prisma.DashboardReportCreateInput;

    expect(repository.create(data)).toBe(result);
    expect(dashboardReport.create).toHaveBeenCalledWith({ data });
  });
});
