import { Inject, Injectable } from '@nestjs/common';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { UpdateBookingStatusDto } from '../dtos/rest/update-booking-status.request.dto';
import { BookingService } from './booking.service';

@Injectable()
export class ManageBookingService {
  constructor(
    @Inject() private readonly bookingRepository: BookingRepository,
    @Inject() private readonly bookingService: BookingService,
  ) {}

  async findById(bookingId: string) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    return await this.bookingService.signBookingDetail(booking);
  }

  async updateStatus(bookingId: string, updateDto: UpdateBookingStatusDto) {
    const booking = await this.bookingRepository.updateById(bookingId, {
      status: updateDto.status,
    });

    return booking;
  }
}
