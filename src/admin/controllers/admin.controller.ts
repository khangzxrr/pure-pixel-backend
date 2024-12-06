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

import { DashboardRequestDto } from '../dtos/dashboard.request.dto';
import { GenerateDashboardReportService } from '../crons/generate-dashboard-report.cron.service';
import { DashboardReportDto } from '../dtos/dashboard-report.dto';

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

  @Get('/dashboard')
  @ApiOperation({
    summary: 'get dashboard report data',
  })
  @ApiOkResponse({
    type: DashboardReportDto,
  })
  async getDashboardReportData(
    @Query() dashboardRequestDto: DashboardRequestDto,
  ) {
    return await this.generateDashboardReportService.generateDashboardData(
      dashboardRequestDto,
    );
  }

  @Get('/dashboard/top-seller')
  @ApiOperation({
    summary: 'get top photographers who have largest selling quantitive',
  })
  async getTopSellers(@Query() dashboardRequestDto: DashboardRequestDto) {
    return await this.generateDashboardReportService.getTopSellers(
      dashboardRequestDto,
    );
  }

  @Get('/dashboard/top-seller/:id')
  @ApiOperation({
    summary: 'get detail report of a top seller (photographer) by id',
  })
  async getDetailOfATopSeller(
    @Param('id') id: string,
    @Query() dashboardRequestDto: DashboardRequestDto,
  ) {
    return await this.generateDashboardReportService.getTopSellerDetail(
      id,
      dashboardRequestDto,
    );
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
