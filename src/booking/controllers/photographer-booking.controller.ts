import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { BookingBillItemService } from '../services/bill-item.service';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItemFindAllResponseDto } from '../dtos/rest/booking-bill-item-find-all.response.dto';

@Controller('photographer/booking')
@ApiTags('photographer-booking')
export class PhotographerBookingController {
  constructor(
    @Inject() private readonly bookingService: BookingService,
    @Inject() private readonly bookingBillItemService: BookingBillItemService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'get all booking from current photographer',
  })
  @ApiOkResponsePaginated(BookingDto)
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async requestBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findallDto: BookingFindAllRequestDto,
  ) {
    return await this.bookingService.findAllByPhotographerId(
      user.sub,
      findallDto,
    );
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
}
