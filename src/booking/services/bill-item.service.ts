import { Inject, Injectable } from '@nestjs/common';
import { BookingBillItemRepository } from 'src/database/repositories/booking-bill-item.repository';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItem } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { BookingBillItemDto } from '../dtos/booking-bill-item.dto';
import { BookingBillItemFindAllResponseDto } from '../dtos/rest/booking-bill-item-find-all.response.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { BookingNotBelongException } from '../exceptions/booking-not-belong.exception';

@Injectable()
export class BookingBillItemService {
  constructor(
    @Inject()
    private readonly bookingBillItemRepository: BookingBillItemRepository,
    @Inject()
    private readonly bookinRepository: BookingRepository,
  ) {}

  async findAll(
    userId: string,
    bookingId: string,
    findAllDto: BookingBillItemFindAllRequestDto,
  ) {
    const booking = await this.bookinRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (
      booking.userId !== userId &&
      booking.photoshootPackage.userId !== userId
    ) {
      throw new BookingNotBelongException();
    }

    const count = await this.bookingBillItemRepository.count(
      findAllDto.toWhere(),
    );

    const billItems: BookingBillItem[] =
      await this.bookingBillItemRepository.findMany(
        findAllDto.toSkip(),
        findAllDto.limit,
        findAllDto.toWhere(),
      );

    const billItemDtos = plainToInstance(BookingBillItemDto, billItems);

    return new BookingBillItemFindAllResponseDto(
      findAllDto.limit,
      count,
      billItemDtos,
    );
  }
}
