import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UpdateTimelineService } from 'src/camera/crons/update-timeline.service.cron';
import { Constants } from 'src/infrastructure/utils/constants';
import { DashboardDto } from '../dtos/dashboard.dto';
import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { GenerateDashboardReportService } from '../crons/generate-dashboard-report.cron.service';

@Controller('admin')
@ApiTags('admin')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.ADMIN_ROLE] })
export class AdminController {
  constructor(
    @Inject() private readonly adminService: AdminService,
    @Inject()
    private readonly generateDashboardReportService: GenerateDashboardReportService,
    @Inject() private readonly updateTimelineService: UpdateTimelineService,
  ) {}

  @Post('/dashboard-trigger/generate-report')
  @ApiOperation({
    summary: 'get dashboard summary',
  })
  @ApiOkResponse({
    type: DashboardDto,
  })
  async generateDashboardReport() {
    return await this.generateDashboardReportService.generateDashboardData();
  }

  @Get('/dashboard')
  @ApiOperation({
    summary: 'get dashboard report data',
  })
  @ApiOkResponse({
    type: DashboardDto,
  })
  async getDashboardReportData(
    @Query() dashboardRequestDto: DashboardRequestDto,
  ) {
    return await this.adminService.getDashboardReport(dashboardRequestDto);
  }

  @Post('/photo-trigger/process')
  @ApiOperation({
    summary: 'trigger process all photos',
  })
  async triggerProcessAllPhotos() {
    await this.adminService.triggerProcessAllPhotos();
  }

  @Post('seed')
  @ApiOperation({
    summary: 'seed database',
  })
  async seedDatabase() {
    return await this.adminService.seed();
  }

  @Post('popular-camera-graph/trigger')
  @ApiOperation({
    summary: 'trigger popular camera graph cron job',
  })
  async triggerPopularCameraGraph() {
    return await this.updateTimelineService.triggerCron();
  }

  @Post('/photo/:photoId/process')
  @ApiOperation({
    summary: 'trigger process photo',
  })
  async triggerProcessPhoto(@Param('photoId') photoId: string) {
    return await this.adminService.triggerProcess(photoId);
  }

  @Post('/photo/:photoId/watermark')
  @ApiOperation({
    summary: 'generate watermark photo',
  })
  async generateWatermarkPhoto(@Param('photoId') photoId: string) {
    return await this.adminService.generateWatermarkPhoto(photoId);
  }

  @Post('/user/sync')
  @ApiOperation({
    summary: 'sync keycloak database with application database',
  })
  async syncUsers() {
    return await this.adminService.syncUsers();
  }
}
