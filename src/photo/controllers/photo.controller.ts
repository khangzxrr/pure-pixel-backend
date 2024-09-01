import { Controller, Get, Inject } from '@nestjs/common';
import { PhotoService } from '../services/photo.service';
import { Public } from 'nest-keycloak-connect';

@Controller('photo')
export class PhotoController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Get('/public')
  @Public()
  async getAllPublicPhoto() {
    return await this.photoService.findAllByVisibility('PUBLIC');
  }
}
