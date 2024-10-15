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
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { ParsedUserDto } from '../dtos/parsed-user.dto';
import { MeDto } from '../dtos/me.dto';

import { Response } from 'express';
import { PresignedUploadMediaDto } from '../dtos/presigned-upload-media.dto';
import { UpdateProfileDto } from '../dtos/rest/update-profile.request.dto';
import { UpgradeOrderDto } from 'src/upgrade-order/dtos/upgrade-order.dto';
import { UpgradeOrderService } from 'src/upgrade-order/services/upgrade-order.service';

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

  @Get('/presigned-upload-media')
  @ApiOperation({
    summary:
      'get presigned upload media (avatar, cover) for logged user to upload media',
  })
  @ApiOkResponse({
    type: PresignedUploadMediaDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async getPresignedUploadMedia(@AuthenticatedUser() user: ParsedUserDto) {
    return await this.userService.generatePresignedUploadMedia(user.sub);
  }

  @Patch()
  @ApiOperation({
    summary: 'update one or more field of profile',
  })
  @ApiOkResponse({
    type: MeDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  async patchUpdateProfile(
    @AuthenticatedUser() user: ParsedUserDto,
    @Body() updateProfileRequest: UpdateProfileDto,
  ) {
    console.log(updateProfileRequest);
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
