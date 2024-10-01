import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpgradeService } from '../services/upgrade.service';
import { UpgradePackageDto } from '../dtos/upgrade-package.dto';
import { HttpStatusCode } from 'axios';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { UpgradeOrderService } from '../services/upgrade-order.service';
import { RequestUpgradeOrderResponseDto } from '../dtos/request-upgrade-order.response.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';

@Controller('upgrade')
@ApiTags('upgrade')
export class UpgradeController {
  constructor(
    @Inject() private readonly upgradeService: UpgradeService,
    @Inject() private readonly upgradeOrderService: UpgradeOrderService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'get all avaiable upgrade packages',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    type: UpgradePackageDto,
    isArray: true,
  })
  async findAll(): Promise<UpgradePackageDto[]> {
    return await this.upgradeService.getEnableUpgradePackages();
  }

  @Post()
  @ApiOperation({
    summary: 'request upgrade',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    type: RequestUpgradeOrderResponseDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async requestUpgradePayment(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() requestUpgrade: RequestUpgradeDto,
  ) {
    return await this.upgradeOrderService.requestUpgradePayment(
      user.sub,
      requestUpgrade,
    );
  }
}
