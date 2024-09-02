import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { PhotoService } from '../services/photo.service';
import { AuthenticatedUser, AuthGuard, Public } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';

@Controller('photo')
export class PhotoController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Get('/public')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Public(false)
  async getAllPublicPhoto() {
    console.log('get public');
    return await this.photoService.findAllByVisibility('PUBLIC');
  }

  @Get('/:key')
  @Public()
  async getPhoto(@AuthenticatedUser() user, @Param('key') id: string) {
    return await this.photoService.getPhotoById(user ? user.sub : '', id);
  }
}
