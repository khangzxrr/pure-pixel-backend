import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { RequestUpgradeOrderResponseDto } from '../dtos/request-upgrade-order.response.dto';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { UpgradeOrderService } from '../services/upgrade-order.service';

@Controller('upgrade-order')
@ApiTags('upgrade-order')
export class UpgradeOrderController {
  constructor(
    @Inject() private readonly upgradeOrderService: UpgradeOrderService,
  ) {}

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
