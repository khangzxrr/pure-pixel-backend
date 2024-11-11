import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { UserService } from '../services/user.service';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { ParsedUserDto } from '../dtos/parsed-user.dto';
import { UserDto } from '../dtos/user.dto';

import { Response } from 'express';

import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { UpgradeOrderDto } from 'src/upgrade-order/dtos/upgrade-order.dto';
import { UpgradeOrderService } from 'src/upgrade-order/services/upgrade-order.service';

import { FormDataRequest } from 'nestjs-form-data';

@Controller('me')
@ApiTags('me')
export class MeController {
  constructor(
    @Inject() private readonly userService: UserService,
    @Inject() private readonly upgradeOrderService: UpgradeOrderService,
  ) {}

  @ApiOperation({
    summary: 'get user info base on role ',
  })
  @ApiOkResponse({
    type: UserDto,
  })
  @Get()
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getMeInfo(
    @AuthenticatedUser()
    user: ParsedUserDto,
  ) {
    return await this.userService.findMe(user.sub);
  }

  @Patch()
  @ApiOperation({
    summary: 'update one or more field of profile',
  })
  @ApiOkResponse({
    type: UserDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @FormDataRequest()
  async patchUpdateProfile(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() updateProfileRequest: UpdateProfileDto,
  ) {
    return await this.userService.updateProfile(user.sub, updateProfileRequest);
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
