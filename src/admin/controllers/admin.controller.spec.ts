import { UpdateTimelineService } from 'src/camera/crons/update-timeline.service.cron';
import { AdminService } from '../services/admin.service';
import { GenerateDashboardReportService } from '../crons/generate-dashboard-report.cron.service';
import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { AdminController } from './admin.controller';

describe('AdminController', () => {
  const adminService = {
    triggerProcessAllPhotos: jest.fn(),
    triggerRegenerateAllBlurhash: jest.fn(),
    seed: jest.fn(),
    triggerProcess: jest.fn(),
    generateWatermarkPhoto: jest.fn(),
    syncUsers: jest.fn(),
  };
  const generateDashboardReportService = {
    generateDashboardData: jest.fn(),
    calculateTotalBalance: jest.fn(),
    getTopSellers: jest.fn(),
    getTopSellerDetail: jest.fn(),
  };
  const updateTimelineService = { triggerCron: jest.fn() };

  const controller = new AdminController(
    adminService as unknown as AdminService,
    generateDashboardReportService as unknown as GenerateDashboardReportService,
    updateTimelineService as unknown as UpdateTimelineService,
  );

  const dashboardRequestDto = Object.assign(new DashboardRequestDto(), {
    fromDate: new Date('2024-01-01T00:00:00Z'),
    toDate: new Date('2024-12-31T00:00:00Z'),
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('getDashboardReportData should delegate to dashboard service', async () => {
    generateDashboardReportService.generateDashboardData.mockResolvedValue(
      'report',
    );

    await expect(
      controller.getDashboardReportData(dashboardRequestDto),
    ).resolves.toBe('report');
    expect(
      generateDashboardReportService.generateDashboardData,
    ).toHaveBeenCalledWith(dashboardRequestDto);
  });

  it('getTotalBalance should delegate to dashboard service', async () => {
    generateDashboardReportService.calculateTotalBalance.mockResolvedValue(
      'balance',
    );

    await expect(controller.getTotalBalance()).resolves.toBe('balance');
  });

  it('getTopSellers should delegate to dashboard service', async () => {
    generateDashboardReportService.getTopSellers.mockResolvedValue(['seller']);

    await expect(
      controller.getTopSellers(dashboardRequestDto),
    ).resolves.toEqual(['seller']);
    expect(generateDashboardReportService.getTopSellers).toHaveBeenCalledWith(
      dashboardRequestDto,
    );
  });

  it('getDetailOfATopSeller should delegate to dashboard service', async () => {
    generateDashboardReportService.getTopSellerDetail.mockResolvedValue(
      'detail',
    );

    await expect(
      controller.getDetailOfATopSeller('user-1', dashboardRequestDto),
    ).resolves.toBe('detail');
    expect(
      generateDashboardReportService.getTopSellerDetail,
    ).toHaveBeenCalledWith('user-1', dashboardRequestDto);
  });

  it('triggerProcessAllPhotos should delegate to admin service', async () => {
    adminService.triggerProcessAllPhotos.mockResolvedValue(undefined);

    await expect(controller.triggerProcessAllPhotos()).resolves.toBeUndefined();
    expect(adminService.triggerProcessAllPhotos).toHaveBeenCalled();
  });

  it('triggerRegenerateAllBlurhash should delegate to admin service', async () => {
    adminService.triggerRegenerateAllBlurhash.mockResolvedValue(undefined);

    await expect(
      controller.triggerRegenerateAllBlurhash(),
    ).resolves.toBeUndefined();
    expect(adminService.triggerRegenerateAllBlurhash).toHaveBeenCalled();
  });

  it('seedDatabase should delegate to admin service', async () => {
    adminService.seed.mockResolvedValue('seeded');

    await expect(controller.seedDatabase()).resolves.toBe('seeded');
  });

  it('triggerPopularCameraGraph should trigger timeline cron', async () => {
    updateTimelineService.triggerCron.mockResolvedValue('triggered');

    await expect(controller.triggerPopularCameraGraph()).resolves.toBe(
      'triggered',
    );
  });

  it('triggerProcessPhoto should delegate to admin service', async () => {
    adminService.triggerProcess.mockResolvedValue('processed');

    await expect(controller.triggerProcessPhoto('photo-1')).resolves.toBe(
      'processed',
    );
    expect(adminService.triggerProcess).toHaveBeenCalledWith('photo-1');
  });

  it('generateWatermarkPhoto should delegate to admin service', async () => {
    adminService.generateWatermarkPhoto.mockResolvedValue('watermarked');

    await expect(controller.generateWatermarkPhoto('photo-1')).resolves.toBe(
      'watermarked',
    );
    expect(adminService.generateWatermarkPhoto).toHaveBeenCalledWith('photo-1');
  });

  it('syncUsers should delegate to admin service', async () => {
    adminService.syncUsers.mockResolvedValue('synced');

    await expect(controller.syncUsers()).resolves.toBe('synced');
  });
});
