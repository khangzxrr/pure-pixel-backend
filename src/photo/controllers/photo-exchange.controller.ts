import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  Inject,
  Param,
  ParseFilePipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { CreatePhotoSellingDto } from '../dtos/rest/create-photo-selling.request.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PhotoService } from '../services/photo.service';
import { PhotoBuyResponseDto } from '../dtos/rest/photo-buy.response.dto';
import { PhotoSellDto } from '../dtos/photo-sell.dto';
import { BuyPhotoRequestDto } from '../dtos/rest/buy-photo.request.dto';
import { SignedPhotoBuyDto } from '../dtos/rest/signed-photo-buy.response.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('afterPhotoFile'))
  async sellPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() createPhotoSellingDto: CreatePhotoSellingDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|PNG|JPG|JPEG)' }),
        ],
      }),
    )
    afterPhotoFile: Express.Multer.File,
  ) {
    return await this.photoService.sellPhoto(
      user.sub,
      createPhotoSellingDto,
      afterPhotoFile,
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
    return await this.photoService.buyPhotoRequest(
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
    return await this.photoService.getPhotoBuyByPhotoId(user.sub, id);
  }

  @Get('/photo-buy/:photobuyid/download-colorgrading')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async downloadColorGrading(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('photobuyid') id: string,
  ) {
    const buffer =
      await this.photoService.getPhotoWithScaledResolutionFromPhotoBuyId(
        user.sub,
        id,
      );

    return new StreamableFile(buffer);
  }
}
