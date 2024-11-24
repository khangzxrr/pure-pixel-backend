import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { RequestPhotoshootBookingRequestDto } from '../dtos/rest/request-photoshoot-booking.request.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItemService } from '../services/bill-item.service';
import { BookingBillItemFindAllResponseDto } from '../dtos/rest/booking-bill-item-find-all.response.dto';
import { CreatePhotoshootPackageReviewDto } from 'src/photoshoot-package/dtos/rest/create-photoshoot-package-review.dto';
import { PhotoshootPackageReviewDto } from 'src/photoshoot-package/dtos/photoshoot-package-review.dto';

@Controller('customer/booking')
@ApiTags('customer-booking')
export class CustomerBookingController {
  constructor(
    @Inject() private readonly bookingService: BookingService,
    @Inject() private readonly bookingBillItemService: BookingBillItemService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'find all booking by current user',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async findAllBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findallDto: BookingFindAllRequestDto,
  ) {
    return await this.bookingService.findAllByUserId(user.sub, findallDto);
  }

  @Get(':bookingId/download-all')
  @ApiOperation({
    summary: 'compress to zip and download (contain all photos) by bookingId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async downloadAll(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
  ) {
    const buffer = await this.bookingService.compressZip(user.sub, bookingId);

    const stream = new StreamableFile(buffer, {
      disposition: `attachment; filename="${bookingId}.zip"`,
      type: 'application/zip',
    });

    return stream;
  }

  @Get(':bookingId')
  @ApiOperation({
    summary: 'get booking detail by ID',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async getBookingId(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
  ) {
    return await this.bookingService.findById(user.sub, bookingId);
  }

  @Get(':bookingId/bill-item')
  @ApiOperation({
    summary: 'find all booking bill item by bookingId',
  })
  @ApiOkResponse({ type: BookingBillItemFindAllResponseDto })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async findAllBookingBillItems(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Query() findallDto: BookingBillItemFindAllRequestDto,
  ) {
    return await this.bookingBillItemService.findAll(
      user.sub,
      bookingId,
      findallDto,
    );
  }

  @Post('/photoshoot-package/:packageId/request')
  @ApiOperation({
    summary: 'request booking by packageId',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async requestBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('packageId') packageId: string,
    @Body() bookingRequestDto: RequestPhotoshootBookingRequestDto,
  ) {
    return await this.bookingService.requestBooking(
      user.sub,
      packageId,
      bookingRequestDto,
    );
  }

  @Post(':bookingId/review')
  @ApiOperation({
    summary: 'review a photoshoot package by id',
  })
  @ApiOkResponse({
    type: PhotoshootPackageReviewDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async createReview(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') id: string,
    @Body() createDto: CreatePhotoshootPackageReviewDto,
  ) {
    return await this.bookingService.createReview(user.sub, id, createDto);
  }
}
