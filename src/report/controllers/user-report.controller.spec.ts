import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { ReportCreateRequestDto } from '../dtos/rest/report-create.request.dto';
import { ReportFindAllRequestDto } from '../dtos/rest/report-find-all.request.dto';
import { ReportPutUpdateRequestDto } from '../dtos/rest/report-put-update.request.dto';
import { ReportService } from '../services/report.service';
import { UserReportController } from './user-report.controller';

describe('UserReportController', () => {
  let reportService: jest.Mocked<
    Pick<
      ReportService,
      'findAllOfUser' | 'patchUpdateOfUser' | 'create' | 'replaceOfUser'
    >
  >;
  let controller: UserReportController;

  const user = { sub: 'u1' } as unknown as ParsedUserDto;

  beforeEach(() => {
    reportService = {
      findAllOfUser: jest.fn(),
      patchUpdateOfUser: jest.fn(),
      create: jest.fn(),
      replaceOfUser: jest.fn(),
    };

    controller = new UserReportController(
      reportService as unknown as ReportService,
    );
  });

  it('should get reports of user', async () => {
    const dto = Object.assign(new ReportFindAllRequestDto(), {
      limit: 1,
      page: 0,
    });
    const response = { objects: [] };
    reportService.findAllOfUser.mockResolvedValue(response as never);

    await expect(controller.getAllReportsOfUser(user, dto)).resolves.toBe(
      response,
    );
    expect(reportService.findAllOfUser).toHaveBeenCalledWith('u1', dto);
  });

  it('should patch update own report', async () => {
    const report = { id: 'r1' };
    reportService.patchUpdateOfUser.mockResolvedValue(report as never);

    await expect(
      controller.patchUpdateReport(user, 'r1', { content: 'x' }),
    ).resolves.toBe(report);
    expect(reportService.patchUpdateOfUser).toHaveBeenCalledWith('u1', 'r1', {
      content: 'x',
    });
  });

  it('should create report', async () => {
    const dto = new ReportCreateRequestDto();
    const report = { id: 'r1' };
    reportService.create.mockResolvedValue(report as never);

    await expect(controller.createReport(user, dto)).resolves.toBe(report);
    expect(reportService.create).toHaveBeenCalledWith('u1', dto);
  });

  it('should replace own report', async () => {
    const dto = new ReportPutUpdateRequestDto();
    const report = { id: 'r1' };
    reportService.replaceOfUser.mockResolvedValue(report as never);

    await expect(controller.putUpdateReport(user, 'r1', dto)).resolves.toBe(
      report,
    );
    expect(reportService.replaceOfUser).toHaveBeenCalledWith('u1', 'r1', dto);
  });
});
