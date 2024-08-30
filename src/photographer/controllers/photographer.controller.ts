import { Controller, Get, Inject } from '@nestjs/common';
import { PhotographerService } from '../services/photographer.service';
import { AuthenticatedUser, Roles } from 'nest-keycloak-connect';

@Controller('photographer')
export class PhotographerController {
  constructor(
    @Inject() private readonly photographerService: PhotographerService,
  ) {}

  @Get('/me')
  @Roles({ roles: ['photographer'] })
  async getInfo(@AuthenticatedUser() user) {
    const info = await this.photographerService.getInfo(user.sub);

    return info;
  }
}
