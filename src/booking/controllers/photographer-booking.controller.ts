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
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { DenyBookingRequestDto } from '../dtos/rest/deny-booking.request.dto';

@Controller('photographer/booking')
@ApiTags('photographer-booking')
export class PhotographerBookingController {
  constructor(@Inject() private readonly bookingService: BookingService) {}

  @Get('')
  @ApiOperation({
    summary: 'get all booking from current photographer',
  })
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
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
  async denyBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Body() denyDto: DenyBookingRequestDto,
  ) {
    return await this.bookingService.deny(bookingId, user.sub, denyDto);
  }
}
