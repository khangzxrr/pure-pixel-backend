import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UserService } from '../services/user.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserFilterDto } from '../dto/user-filter.dto';
import { UpgradeOrderService } from 'src/upgrade/services/upgrade-order.service';

@Controller('me')
@ApiTags('user')
export class MeController {
  constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly upgradeOrderService: UpgradeOrderService,
  ) {}

  @ApiOperation({
    summary: 'get user info',
  })
  @Get()
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeInfo(
    @AuthenticatedUser()
    user: any,
    @Query() userFilterDto: UserFilterDto,
  ) {
    console.log(userFilterDto);

    userFilterDto.id = user.sub;

    return await this.userService.findOne(userFilterDto);
  }

  @ApiOperation({
    summary: 'get user current upgrade package',
  })
  @Get('/current-upgrade-package')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeCurrentUpgradePackage(@AuthenticatedUser() user) {
    return await this.upgradeOrderService.findActiveUpgradePackageOrderByUserId(
      user.sub,
    );
  }
}
