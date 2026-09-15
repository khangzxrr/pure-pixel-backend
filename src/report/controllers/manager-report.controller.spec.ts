import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportPutUpdateRequestDto } from '../dtos/rest/report-put-update.request.dto';
import { ReportService } from '../services/report.service';
import { ManagerReportController } from './manager-report.controller';

describe('ManagerReportController', () => {
  let reportService: jest.Mocked<
    Pick<
      ReportService,
      'findAll' | 'patchUpdate' | 'create' | 'delete' | 'replace'
    >
  >;
  let controller: ManagerReportController;

  beforeEach(() => {
    reportService = {
      findAll: jest.fn(),
      patchUpdate: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      replace: jest.fn(),
    };

    controller = new ManagerReportController(
      reportService as unknown as ReportService,
    );
  });

  it('should get reports', async () => {
    const dto = Object.assign(new ReportFindAllRequestDto(), {
      limit: 1,
      page: 0,
    });
    const response = { objects: [] };
    reportService.findAll.mockResolvedValue(response as never);

    await expect(controller.getReports(dto)).resolves.toBe(response);
    expect(reportService.findAll).toHaveBeenCalledWith(dto);
  });

  it('should patch update report', async () => {
    const report = { id: 'r1' };
    reportService.patchUpdate.mockResolvedValue(report as never);

    await expect(
      controller.patchUpdateReport('r1', { content: 'x' }),
    ).resolves.toBe(report);
    expect(reportService.patchUpdate).toHaveBeenCalledWith('r1', {
      content: 'x',
    });
  });

  it('should create report as manager', async () => {
    const dto = new ReportCreateRequestDto();
    const report = { id: 'r1' };
    reportService.create.mockResolvedValue(report as never);

    await expect(
      controller.createReport({ sub: 'm1' } as unknown as ParsedUserDto, dto),
    ).resolves.toBe(report);
    expect(reportService.create).toHaveBeenCalledWith('m1', dto);
  });

  it('should delete report', async () => {
    const report = { id: 'r1' };
    reportService.delete.mockResolvedValue(report as never);

    await expect(controller.deleteReport('r1')).resolves.toBe(report);
    expect(reportService.delete).toHaveBeenCalledWith('r1');
  });

  it('should replace report', async () => {
    const dto = new ReportPutUpdateRequestDto();
    const report = { id: 'r1' };
    reportService.replace.mockResolvedValue(report as never);

    await expect(controller.putUpdateReport('r1', dto)).resolves.toBe(report);
    expect(reportService.replace).toHaveBeenCalledWith('r1', dto);
  });
});
