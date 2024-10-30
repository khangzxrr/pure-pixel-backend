import { Controller, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UpdateTimelineService } from 'src/camera/crons/update-timeline.service.cron';
import { Constants } from 'src/infrastructure/utils/constants';

@Controller('admin')
@ApiTags('admin')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.MANAGER_ROLE] })
export class AdminController {
  constructor(
    @Inject() private readonly adminService: AdminService,
    @Inject() private readonly updateTimelineService: UpdateTimelineService,
  ) {}

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
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
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
}
