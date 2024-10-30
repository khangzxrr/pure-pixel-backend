import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Roles, AuthenticatedUser } from 'nest-keycloak-connect';
import { KeycloakRoleGuard } from 'src/authen/guards/KeycloakRoleGuard.guard';
import { Constants } from 'src/infrastructure/utils/constants';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItemFindAllResponseDto } from '../dtos/rest/booking-bill-item-find-all.response.dto';
import { BookingBillItemService } from '../services/bill-item.service';
import { BookingBillItemCreateDto } from '../dtos/booking-bill-item.create.dto';
import { BookingBillItemUpdateDto } from '../dtos/booking-bill-item.update.dto';

@Controller('photographer/booking')
@ApiTags('photographer-booking-bill-item')
@UseGuards(AuthGuard, KeycloakRoleGuard)
@Roles({ roles: [Constants.PHOTOGRAPHER_ROLE] })
export class PhotographerBookingBillItemController {
  constructor(
    @Inject() private readonly bookingBillItemService: BookingBillItemService,
  ) {}

  @Get(':bookingId/bill-item')
  @ApiOperation({
    summary: 'find all booking bill item by bookingId',
  })
  @ApiOkResponse({ type: BookingBillItemFindAllResponseDto })
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

  @Post(':bookingId/bill-item')
  @ApiOperation({
    summary: 'create booking bill item by bookingId',
  })
  @ApiOkResponse({ type: BookingBillItemFindAllResponseDto })
  async createBillItem(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Body() bookingBillItemCreateDto: BookingBillItemCreateDto,
  ) {
    return await this.bookingBillItemService.createBillItem(
      user.sub,
      bookingId,
      bookingBillItemCreateDto,
    );
  }

  @Patch(':bookingId/bill-item/:billitemId')
  @ApiOperation({
    summary: 'update booking bill item by billitemId',
  })
  @ApiOkResponse({ type: BookingBillItemFindAllResponseDto })
  async updateBillItem(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Param('billitemId') billitemId: string,
    @Body() bookingBillItemUpdateDto: BookingBillItemUpdateDto,
  ) {
    return await this.bookingBillItemService.updateBillItem(
      user.sub,
      bookingId,
      billitemId,
      bookingBillItemUpdateDto,
    );
  }

  @Delete(':bookingId/bill-item/:billitemId')
  @ApiOperation({
    summary: 'delete booking bill item by billitemId',
  })
  @ApiOkResponse({ type: BookingBillItemFindAllResponseDto })
  async deleteBillItem(
    @AuthenticatedUser() user: ParsedUserDto,
    @Param('bookingId') bookingId: string,
    @Param('billitemId') billitemId: string,
  ) {
    return await this.bookingBillItemService.deleteBillItem(
      user.sub,
      bookingId,
      billitemId,
    );
  }
}
