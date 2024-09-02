import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';

@Controller('photographer')
export class PhotographerController {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
  ) {}

  @Get('/me/upload/:objectName')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: ['photographer'] })
  async getPresignedUploadUrl(
    @AuthenticatedUser() user,
    @Param('objectName') objectName: string,
  ) {
    const presignedUrl = await this.photographerService.getPresignedUploadUrl(
      user.sub,
      objectName,
    );

    return presignedUrl;
  }
}
