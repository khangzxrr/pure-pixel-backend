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
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { DenyBookingRequestDto } from '../dtos/rest/deny-booking.request.dto';
import { BookingDto } from '../dtos/booking.dto';
import { ApiOkResponsePaginated } from 'src/infrastructure/decorators/paginated.response.dto';
import { BookingUpdateRequestDto } from '../dtos/rest/booking-update.request.dto';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';
import { BookingUploadRequestDto } from '../dtos/rest/booking-upload.request.dto';

import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';
import { FileSystemBookngUploadDto } from '../dtos/rest/file-system-booking-upload.request.dto';

@Controller('photographer/booking')
@ApiTags('photographer-booking')
export class PhotographerBookingController {
  constructor(@Inject() private readonly bookingService: BookingService) {}

  @Get('me')
  @ApiOperation({
    summary: 'get all booking from current photographer',
  })
  @ApiOkResponsePaginated(BookingDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async findAllBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findallDto: BookingFindAllRequestDto,
  ) {
    return await this.bookingService.findAllByPhotographerId(
      user.sub,
      findallDto,
    );
  }

  @Get(':bookingId')
  @ApiOperation({
    summary: 'get booking detail by bookingId',
  })
  @ApiOkResponsePaginated(BookingDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async getBookingDetail(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
  ) {
    return await this.bookingService.findById(user.sub, bookingId);
  }

  @Put(':bookingId/upload/v2')
  @ApiOperation({
    summary: 'upload photo to booking by bookingId',
  })
  @ApiResponse({
    status: 202,
    description:
      'accepted file and start to process photo, when done it will notify via websocket (notification)',
    type: SignedPhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest({
    storage: FileSystemStoredFile,
    fileSystemStoragePath: '/tmp/purepixel-local-storage',
    cleanupAfterFailedHandle: true,
    cleanupAfterSuccessHandle: false,
  })
  async filesystemUpload(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Body() bookingUploadDto: FileSystemBookngUploadDto,
  ) {
    return await this.bookingService.filesystemUploadPhoto(
      user.sub,
      bookingId,
      bookingUploadDto,
    );
  }

  @Put(':bookingId/upload')
  @ApiOperation({
    summary: 'upload photo to booking by bookingId',
  })
  @ApiOkResponse({
    type: SignedPhotoDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  async uploadPhoto(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Body() bookingUploadDto: BookingUploadRequestDto,
  ) {
    return await this.bookingService.uploadPhoto(
      user.sub,
      bookingId,
      bookingUploadDto,
    );
  }

  @Delete(':bookingId/photo/:photoId')
  @ApiOperation({
    summary: 'get booking detail by bookingId',
  })
  @ApiOkResponsePaginated(BookingDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async deletePhotoBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Param('photoId') photoId: string,
  ) {
    return await this.bookingService.deletePhoto(user.sub, bookingId, photoId);
  }

  @Post(':bookingId/accept')
  @ApiOperation({
    summary: 'accept booking by bookingId',
  })
  @ApiOkResponse({
    type: BookingDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async acceptBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
  ) {
    return await this.bookingService.accept(bookingId, user.sub);
  }

  @Post(':bookingId/deny')
  @ApiOperation({
    summary: 'deny booking by bookingId',
  })
  @ApiOkResponse({
    type: BookingDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async denyBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Body() denyDto: DenyBookingRequestDto,
  ) {
    return await this.bookingService.deny(bookingId, user.sub, denyDto);
  }

  @Patch(':bookingId')
  @ApiOperation({
    summary: 'update booking by bookingId',
  })
  @ApiOkResponse({
    type: BookingDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async updateBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Body() updateDto: BookingUpdateRequestDto,
  ) {
    return await this.bookingService.updateById(user.sub, bookingId, updateDto);
  }

  @Patch(':bookingId/paid')
  @ApiOperation({
    summary: 'set booking status to paid - unlock watermark photo by bookingId',
  })
  @ApiOkResponse({
    type: BookingDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async paidBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
  ) {
    return await this.bookingService.updateBookingToPaid(user.sub, bookingId);
  }
}
