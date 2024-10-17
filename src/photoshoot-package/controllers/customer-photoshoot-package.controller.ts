import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PhotoshootPackageService } from '../services/photoshoot-package.service';
import { AuthGuard, Roles, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { PhotoshootPackageDto } from '../dtos/photoshoot-package.dto';
import { PhotoshootPackageFindAllDto } from '../dtos/rest/photoshoot-package-find-all.request.dto';

@Controller('photoshoot-package')
@ApiTags('customer-photoshoot-package')
export class CustomerPhotoshootPackageController {
  constructor(
    private readonly photoshootPackageService: PhotoshootPackageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get all photoshoot package of a photographer by photographerId',
  })
  @ApiOkResponsePaginated(PhotoshootPackageDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async findAll(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findAllDto: PhotoshootPackageFindAllDto,
  ) {
    return await this.photoshootPackageService.findAllByUserId(
      user.sub,
      findAllDto,
    );
  }
}
