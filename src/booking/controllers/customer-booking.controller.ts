import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingService } from '../services/booking.service';
import { AuthenticatedUser, AuthGuard, Roles } from 'nest-keycloak-connect';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { RequestPhotoshootBookingRequestDto } from '../dtos/rest/request-photoshoot-booking.request.dto';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';

@Controller('booking')
@ApiTags('customer-booking')
export class CustomerBookingController {
  constructor(@Inject() private readonly bookingService: BookingService) {}

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
