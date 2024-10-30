import {
  Body,
  Controller,
  Get,
  Inject,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
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
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { PhotoExchangeService } from '../services/photo-exchange.service';
import { Response } from 'express';

@Controller('photo')
@ApiTags('photo-exchange')
export class PhotoExchangeController {
  constructor(
    @Inject() private readonly photoExchangeService: PhotoExchangeService,
  ) {}

  @Post('/:photoId/sell')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @ApiOkResponse({
    type: PhotoSellDto,
  })
  async sellPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') id: string,
    @Body() createPhotoSellingDto: CreatePhotoSellingDto,
  ) {
    return await this.photoExchangeService.sellPhoto(
      user.sub,
      id,
      createPhotoSellingDto,
    );
  }

  @Patch(':photoId/sell')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @ApiOkResponse({
    type: PhotoSellDto,
  })
  async updatePhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') id: string,
  ) {
    //TODO: implement update sell
    throw new NotImplementedException();
  }

  @Post('/:photoId/photo-sell/:photoSellId/price-tag/:pricetagId')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    type: PhotoBuyResponseDto,
  })
  async buyPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
    @Param('photoSellId') photoSellId: string,
    @Param('pricetagId') pricetagId: string,
  ) {
    return await this.photoExchangeService.buyPhotoRequest(
      user.sub,
      photoId,
      photoSellId,
      pricetagId,
    );
  }

  @Get(':photoId/photo-buy/:photoBuyId/download')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    type: PhotoBuyResponseDto,
  })
  async getPhotoBought(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') photoId: string,
    @Param('photoBuyId') photoBuyId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.photoExchangeService.downloadBoughtPhoto(
      photoId,
      user.sub,
      photoBuyId,
    );

    const stream = new StreamableFile(buffer);

    res.set({
      'Content-type': 'image/jpeg',
    });
    stream.getStream().pipe(res);
  }

  @Get('/:photoId/photo-buy')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    isArray: true,
    type: SignedPhotoBuyDto,
  })
  async getBoughtPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') id: string,
  ) {
    return await this.photoExchangeService.getPhotoBuyByPhotoId(user.sub, id);
  }
}
