import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';

@Controller('booking')
@ApiTags('photographer-booking')
export class CustomerBookingController {
  constructor(@Inject() private readonly bookingService: BookingService) {}

  @Get('')
  @ApiOperation({
    summary: 'get all booking from current photographer',
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.PHOTOGRAPHER_ROLE, Constants.CUSTOMER_ROLE] })
  async requestBooking(
    @AuthenticatedUser() user: ParsedUserDto,
    @Query() findallDto: BookingFindAllRequestDto,
  ) {
    return await this.bookingService.findAll(user.sub, findallDto);
  }
}
