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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { RequestPhotoshootBookingRequestDto } from '../dtos/rest/request-photoshoot-booking.request.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItemService } from '../services/bill-item.service';

@Controller('customer/booking')
@ApiTags('customer-booking')
export class CustomerBookingController {
  constructor(
    @Inject() private readonly bookingService: BookingService,
    @Inject() private readonly bookingBillItemService: BookingBillItemService,
  ) {}

  @Get('')
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

  @Get(':bookingId/bill-item')
  @ApiOperation({
    summary: 'find all booking bill item by bookingId',
  })
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
}
