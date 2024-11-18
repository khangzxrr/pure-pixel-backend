import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhotoExchangeService } from '../services/photo-exchange.service';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { SignedPhotoDto } from '../dtos/signed-photo.dto';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoBuyFindAllDto } from '../dtos/rest/photo-buy-find-all.dto';

@Controller('photo-exchange')
@ApiTags('photo-exchange')
export class PhotoExchangeController {
  constructor(private readonly photoExchange: PhotoExchangeService) {}

  @Get('/me/photo-buy')
  @ApiOperation({
    summary: 'get all photo-buys of me',
  })
  @ApiOkResponsePaginated(SignedPhotoDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async findAllPhotobuys(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: PhotoBuyFindAllDto,
  ) {
    return this.photoExchange.getAllPreviousBuyPhoto(user.sub, findAllDto);
  }
}
