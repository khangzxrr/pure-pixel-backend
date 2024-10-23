import { Inject, Injectable } from '@nestjs/common';
import { BookingBillItemRepository } from 'src/database/repositories/booking-bill-item.repository';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItem } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { BookingBillItemDto } from '../dtos/booking-bill-item.dto';
import { BookingBillItemFindAllResponseDto } from '../dtos/rest/booking-bill-item-find-all.response.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { BookingNotBelongException } from '../exceptions/booking-not-belong.exception';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BookingBillItemService {
  constructor(
    @Inject()
    private readonly bookingBillItemRepository: BookingBillItemRepository,
    @Inject()
    private readonly bookinRepository: BookingRepository,
  ) {}

  async sumBookingBill(bookingId: string) {
    const sumIncrease = await this.bookingBillItemRepository.aggregate({
      where: {
        bookingId,
        type: 'INCREASE',
      },
      _sum: {
        price: true,
      },
    });

    const sumDecrease = await this.bookingBillItemRepository.aggregate({
      where: {
        bookingId,
        type: 'DECREASE',
      },
      _sum: {
        price: true,
      },
    });

    let totalAmount: Decimal = new Decimal(0);

    if (sumIncrease._sum.price) {
      totalAmount = totalAmount.add(sumIncrease._sum.price);
    }

    if (sumDecrease._sum.price) {
      totalAmount = totalAmount.sub(sumDecrease._sum.price);
    }

    return totalAmount;
  }

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
      booking.originalPhotoshootPackage.userId !== userId
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

    const totalAmount = await this.sumBookingBill(bookingId);

    return new BookingBillItemFindAllResponseDto(
      totalAmount.toNumber(),
      findAllDto.limit,
      count,
      billItemDtos,
    );
  }
}
