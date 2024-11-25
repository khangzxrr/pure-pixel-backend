import { Inject, Injectable } from '@nestjs/common';
import { BookingBillItemRepository } from 'src/database/repositories/booking-bill-item.repository';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItem, BookingStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { BookingBillItemDto } from '../dtos/booking-bill-item.dto';
import { BookingBillItemFindAllResponseDto } from '../dtos/rest/booking-bill-item-find-all.response.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { BookingNotBelongException } from '../exceptions/booking-not-belong.exception';
import { Decimal } from '@prisma/client/runtime/library';
import { BookingBillItemCreateDto } from '../dtos/booking-bill-item.create.dto';
import { BookingNotInValidStateException } from '../exceptions/booking-not-in-valid-state.exception';
import { BookingBillItemUpdateDto } from '../dtos/booking-bill-item.update.dto';
import { NotificationService } from 'src/notification/services/notification.service';

@Injectable()
export class BookingBillItemService {
  constructor(
    @Inject()
    private readonly bookingBillItemRepository: BookingBillItemRepository,
    @Inject()
    private readonly bookinRepository: BookingRepository,
    @Inject()
    private readonly notificationService: NotificationService,
  ) {}

  async updateBillItem(
    userId: string,
    bookingId: string,
    billItemId: string,
    billItemUpdateDto: BookingBillItemUpdateDto,
  ) {
    const booking = await this.bookinRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    const validState: BookingStatus[] = [
      BookingStatus.REQUESTED,
      BookingStatus.ACCEPTED,
    ];
    if (validState.indexOf(booking.status) < 0) {
      throw new BookingNotInValidStateException();
    }

    const billitem = await this.bookingBillItemRepository.updateById(
      billItemId,
      billItemUpdateDto,
    );

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'IN_APP',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
      content: 'Gói chụp của bạn đã có cập nhật hoá đơn mới!',
      payload: billitem,
      referenceType: 'BOOKING',
    });

    return plainToInstance(BookingBillItemDto, billitem);
  }

  async deleteBillItem(userId: string, bookingId: string, billItemId: string) {
    const booking = await this.bookinRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    const validState: BookingStatus[] = [
      BookingStatus.REQUESTED,
      BookingStatus.ACCEPTED,
    ];
    if (validState.indexOf(booking.status) < 0) {
      throw new BookingNotInValidStateException();
    }

    const billItem = await this.bookingBillItemRepository.deleteById(
      bookingId,
      billItemId,
    );

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'IN_APP',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
      content: 'Gói chụp của bạn đã có cập nhật hoá đơn mới!',
      payload: billItem,
      referenceType: 'BOOKING',
    });

    return plainToInstance(BookingBillItemDto, billItem);
  }

  async createBillItem(
    userId: string,
    bookingId: string,
    bookingBillItemCreateDto: BookingBillItemCreateDto,
  ) {
    const booking = await this.bookinRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    const validState: BookingStatus[] = [
      BookingStatus.REQUESTED,
      BookingStatus.ACCEPTED,
    ];
    if (validState.indexOf(booking.status) < 0) {
      throw new BookingNotInValidStateException();
    }

    const bookingBillItem = await this.bookingBillItemRepository.create({
      ...bookingBillItemCreateDto,
      booking: {
        connect: {
          id: booking.id,
        },
      },
    });

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'IN_APP',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
      content: 'Gói chụp của bạn đã có cập nhật hoá đơn mới!',
      payload: bookingBillItem,
      referenceType: 'BOOKING',
    });

    return plainToInstance(BookingBillItemDto, bookingBillItem);
  }

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

    findAllDto.bookingId = bookingId;

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
