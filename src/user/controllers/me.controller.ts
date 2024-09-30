import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UserService } from '../services/user.service';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { UpgradeOrderService } from 'src/upgrade/services/upgrade-order.service';
import { ParsedUserDto } from '../dtos/parsed-user.dto';
import { MeDto } from '../dtos/me.dto';

import { Response } from 'express';
import { UpgradeOrderDto } from 'src/upgrade/dtos/upgrade-order.dto';

@Controller('me')
@ApiTags('user')
export class MeController {
  constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly upgradeOrderService: UpgradeOrderService,
  ) {}

  @ApiOperation({
    summary: 'get user info base on role ',
  })
  @ApiOkResponse({
    type: MeDto,
  })
  @Get()
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeInfo(
    @AuthenticatedUser()
    user: ParsedUserDto,
  ) {
    const userFilterDto = new UserFilterDto();
    userFilterDto.id = user.sub;

    return await this.userService.findOne(userFilterDto);
  }

  @ApiOperation({
    summary: 'get user current upgrade package',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'not found current upgrade package',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'current upgrade order',
    type: UpgradeOrderDto,
  })
  @Get('/current-upgrade-package')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeCurrentUpgradePackage(
    @AuthenticatedUser() user: ParsedUserDto,
    @Res() res: Response,
  ) {
    const upgradeOrder =
      await this.upgradeOrderService.findActiveUpgradePackageOrderByUserId(
        user.sub,
      );

    if (upgradeOrder) {
      res.status(HttpStatus.OK).json(upgradeOrder);

      return;
    }

    res.status(HttpStatus.NO_CONTENT).json({});
  }
}
