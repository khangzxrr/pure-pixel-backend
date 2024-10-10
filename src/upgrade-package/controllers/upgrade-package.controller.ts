import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { UpgradePackageFindAllDto } from '../dtos/rest/upgrade-package-find-all.request.dto';
import { UpgradePackageService } from '../services/upgrade-package.service';
import { CreateUpgradePackageDto } from '../dtos/rest/create-upgrade-package.request.dto';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { Constants } from 'src/infrastructure/utils/constants';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { PatchUpdateUpgradePackageDto } from '../dtos/rest/patch-update-upgrade-package.request.dto';
import { PutUpdateUpgradePackageDto } from '../dtos/rest/put-update-upgrade-package.request.dto';

@Controller('upgrade-package')
@ApiTags('upgrade-package')
export class UpgradePackageController {
  constructor(
    @Inject() private readonly upgradePackageService: UpgradePackageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get all avaiable upgrade packages',
  })
  @ApiOkResponsePaginated(UpgradePackageDto)
  async findAll(@Query() findAllDto: UpgradePackageFindAllDto) {
    return await this.upgradePackageService.findAll(findAllDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'delete a upgrade package by id',
  })
  @ApiOkResponse({
    type: UpgradePackageDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async delete(@Param('id') id: string) {
    return await this.upgradePackageService.delete(id);
  }

  @Post()
  @ApiOperation({
    summary: 'create new upgrade package',
  })
  @ApiOkResponse({
    type: UpgradePackageDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async createUpgradePackage(
    @Body() createUpgradePackageDto: CreateUpgradePackageDto,
  ) {
    return await this.upgradePackageService.create(createUpgradePackageDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'update one or more fields of upgrade package by id',
  })
  @ApiOkResponse({
    type: UpgradePackageDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async patchUpdatePackage(
    @Param('id') id: string,
    @Body() patchUpdateUpgradePackageDto: PatchUpdateUpgradePackageDto,
  ) {
    return await this.upgradePackageService.update(
      id,
      patchUpdateUpgradePackageDto,
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'replace all fields of upgrade package by id',
  })
  @ApiOkResponse({
    type: UpgradePackageDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.MANAGER_ROLE] })
  async putUpdatePackage(
    @Param('id') id: string,
    @Body() putUpdateUpgradePackageDto: PutUpdateUpgradePackageDto,
  ) {
    return await this.upgradePackageService.replace(
      id,
      putUpdateUpgradePackageDto,
    );
  }
}
