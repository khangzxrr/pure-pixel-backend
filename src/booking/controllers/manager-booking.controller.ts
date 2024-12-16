import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { BookingDto } from '../dtos/booking.dto';

import { UpdateBookingStatusDto } from '../dtos/rest/update-booking-status.request.dto';
import { ManageBookingService } from '../services/manage-booking.service';

@Controller('manager/booking')
@ApiTags('manager-booking')
export class ManagerBookingController {
  constructor(
    @Inject() private readonly manageBookingService: ManageBookingService,
  ) {}

  @Get(':bookingId')
  @ApiOperation({
    summary: 'get booking detail by bookingId',
  })
  @ApiOkResponse({
    type: BookingDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.ADMIN_ROLE, Constants.MANAGER_ROLE] })
  async getBookingDetail(@Param('bookingId') bookingId: string) {
    return await this.manageBookingService.findById(bookingId);
  }

  @Patch(':bookingId')
  @ApiOperation({
    summary: 'update booking by bookingId',
  })
  @ApiOkResponse({
    type: BookingDto,
  })
  @UseGuards(AuthGuard, KeycloakRoleGuard)
  @Roles({ roles: [Constants.ADMIN_ROLE, Constants.MANAGER_ROLE] })
  async updateBooking(
    @Param('bookingId') bookingId: string,
    @Body() updateDto: UpdateBookingStatusDto,
  ) {
    return await this.manageBookingService.updateStatus(bookingId, updateDto);
  }
}
