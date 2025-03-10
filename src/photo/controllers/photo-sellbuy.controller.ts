import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { PhotoSellDto } from '../dtos/photo-sell.dto';

import { PhotoExchangeService } from '../services/photo-exchange.service';
import { Response } from 'express';
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { PhotoWithSignedPhotoBuys } from '../dtos/photo-with-signed-photo-buy.dto';

@Controller('photo')
@ApiTags('photo-exchange')
export class PhotoSellBuyController {
  constructor(
    @Inject() private readonly photoExchangeService: PhotoExchangeService,
  ) {}

  @Post('/:photoId/sell')
  @ApiOperation({
    summary: 'sell photo using photoId',
  })
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

  @Put(':photoId/sell')
  @ApiOperation({
    summary: 'update sell photo using photoId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @ApiOkResponse({
    type: PhotoSellDto,
  })
  async updateSellPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') id: string,
    @Body() createPhotoSellingDto: CreatePhotoSellingDto,
  ) {
    return await this.photoExchangeService.replaceSellPhoto(
      user.sub,
      id,
      createPhotoSellingDto,
    );
  }

  @Post(':photoId/stop-selling')
  @ApiOperation({
    summary: 'stop sell photo using photoId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @ApiOkResponse({
    description: 'stop selling photo successfully',
  })
  async stopSellingPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') id: string,
  ) {
    return await this.photoExchangeService.stopSellingPhoto(user.sub, id);
  }

  @Post('/:photoId/photo-sell/:photoSellId/price-tag/:pricetagId/buy')
  @ApiOperation({
    summary:
      'buy photo using photoId, photoSellId, and pricetagId  (I KNOW, ALOTS)',
  })
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
    @Body() buyPhotoDto: BuyPhotoRequestDto,
  ) {
    return await this.photoExchangeService.buyPhotoRequest(
      user.sub,
      photoId,
      photoSellId,
      pricetagId,
      buyPhotoDto,
    );
  }

  @Get(':photoId/photo-buy/:photoBuyId/download')
  @ApiOperation({
    summary: 'download photo using photoBuyId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
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
  @ApiOperation({
    summary: 'get all previous photo-buy using photoId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  @ApiOkResponse({
    type: PhotoWithSignedPhotoBuys,
  })
  async getBoughtPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photoId') id: string,
  ) {
    return await this.photoExchangeService.getPhotoBuyByPhotoId(user.sub, id);
  }
}
