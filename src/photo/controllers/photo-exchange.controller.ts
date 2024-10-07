import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PhotoService } from '../services/photo.service';
import { PhotoBuyResponseDto } from '../dtos/rest/buy-photo.response.dto';
import { PhotoSellDto } from '../dtos/photo-sell.dto';

@Controller('photo')
@ApiTags('photo-exchange')
export class PhotoExchangeController {
  constructor(@Inject() private readonly photoService: PhotoService) {}

  @Post('/:id/sell')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @ApiOkResponse({
    type: PhotoSellDto,
  })
  async sellPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() createPhotoSellingDto: CreatePhotoSellingDto,
  ) {
    return await this.photoService.sellPhoto(user.sub, createPhotoSellingDto);
  }

  @Post('/:id/buy')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    type: PhotoBuyResponseDto,
  })
  async buyPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') photoId: string,
  ) {
    return await this.photoService.buyPhotoRequest(user.sub, photoId);
  }

  @Get('/:id/bought')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async getBoughtPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoService.getPhotoBuyByPhotoId(user.sub, id);
  }
}
