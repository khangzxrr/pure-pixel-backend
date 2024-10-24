import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(@Inject() private readonly adminService: AdminService) {}

  @Post('seed')
  @ApiOperation({
    summary: 'seed database',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async seedDatabase() {
    return await this.adminService.seed();
  }
}
