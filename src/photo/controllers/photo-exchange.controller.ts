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
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { PhotoSellDto } from '../dtos/photo-sell.dto';
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { PhotoExchangeService } from '../services/photo-exchange.service';

@Controller('photo')
@ApiTags('photo-exchange')
export class PhotoExchangeController {
  constructor(
    @Inject() private readonly photoExchangeService: PhotoExchangeService,
  ) {}

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
    return await this.photoExchangeService.sellPhoto(
      user.sub,
      createPhotoSellingDto,
    );
  }

  @Post('/:id/buy')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    type: PhotoBuyResponseDto,
  })
  async buyPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() buyPhotoRequestDto: BuyPhotoRequestDto,
  ) {
    return await this.photoExchangeService.buyPhotoRequest(
      user.sub,
      buyPhotoRequestDto,
    );
  }

  @Get('/:id/bought')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    isArray: true,
    type: SignedPhotoBuyDto,
  })
  async getBoughtPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('id') id: string,
  ) {
    return await this.photoExchangeService.getPhotoBuyByPhotoId(user.sub, id);
  }
}
