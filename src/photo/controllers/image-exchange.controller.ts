import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ApiTags } from '@nestjs/swagger';
import { PhotoService } from '../services/photo.service';

@Controller('photo')
@ApiTags('photo-exchange')
export class ImageExchangeController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Post('/:id/sell')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async sellPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() createPhotoSellingDto: CreatePhotoSellingDto,
  ) {
    return await this.photoService.sellPhoto(user.sub, createPhotoSellingDto);
  }
}
