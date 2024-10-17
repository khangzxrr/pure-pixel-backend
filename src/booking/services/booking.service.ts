import { Injectable } from '@nestjs/common';
import { RequestPhotoshootBookingRequestDto } from '../dtos/rest/request-photoshoot-booking.request.dto';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';

@Injectable()
export class BookingService {
  findAll(sub: string, findallDto: BookingFindAllRequestDto) {
    throw new Error('Method not implemented.');
  }

  requestBooking(
    sub: string,
    bookingRequestDto: RequestPhotoshootBookingRequestDto,
  ) {
    throw new Error('Method not implemented.');
  }
}
