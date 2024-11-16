import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpStatusCode } from 'axios';
import { AuthGuard, AuthenticatedUser, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { RequestUpgradeOrderResponseDto } from '../dtos/request-upgrade-order.response.dto';
import { RequestUpgradeDto } from '../dtos/request-upgrade.dto';
import { UpgradeOrderService } from '../services/upgrade-order.service';
import { Constants } from 'src/infrastructure/utils/constants';
import { UpgradeTransferFeeRequestDto } from '../dtos/rest/upgrade-transfer-fee.request.dto';

@Controller('upgrade-order')
@ApiTags('upgrade-order')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
export class UpgradeOrderController {
  constructor(
    @Inject() private readonly upgradeOrderService: UpgradeOrderService,
  ) {}

  @Get('/upgrade-package/:upgradePackageId/fee')
  @ApiOperation({
    summary: 'check transfer fee to other package',
  })
  async checkTransferFee(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('upgradePackageId') upgradePackageId: string,
    @Query()
    upgradeTransferFeeRequestDto: UpgradeTransferFeeRequestDto,
  ) {
    return await this.upgradeOrderService.calculateTransferFee(
      user.sub,
      upgradePackageId,
      upgradeTransferFeeRequestDto,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'request upgrade',
  })
  @ApiResponse({
    status: HttpStatusCode.Ok,
    type: RequestUpgradeOrderResponseDto,
  })
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
