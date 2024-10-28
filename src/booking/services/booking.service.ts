import { Inject, Injectable } from '@nestjs/common';
import { RequestPhotoshootBookingRequestDto } from '../dtos/rest/request-photoshoot-booking.request.dto';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { BookingFindAllResponseDto } from '../dtos/rest/booking-find-all.response.dto';
import { plainToInstance } from 'class-transformer';
import { BookingDto } from '../dtos/booking.dto';
import { StartDateMustLargerThanCurrentDateByOneDayException } from '../exceptions/start-date-must-larger-than-current-day-by-one-day.exception';
import { HourBetweenStartAndEndDateMustNotLessThanThreeException } from '../exceptions/hour-between-start-end-date-must-larger-than-three-hours.exception';
import { EndDateMustLargerThanStartDateException } from '../exceptions/end-date-must-larger-than-start-date.exception';
import { ExistBookingWithSelectedDateException } from '../exceptions/exist-booking-with-selected-date.exception';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { DenyBookingRequestDto } from '../dtos/rest/deny-booking.request.dto';
import { BookingNotBelongException } from '../exceptions/booking-not-belong.exception';
import { BookingNotInRequestedStateException } from '../exceptions/booking-not-in-requested-state.exception';
import { BookingWithPhotoshootPackageIncludedUser } from 'src/database/types/booking';
import { BookingUpdateRequestDto } from '../dtos/rest/booking-update.request.dto';
import { BookingStatus } from '@prisma/client';
import { BookingStartedException } from '../exceptions/booking-started.exception';
import { BothStartEndDateMustSpecifyException } from '../exceptions/start-end-date-must-specify.exception';
import { BookingNotAcceptedException } from '../exceptions/booking-not-accepted.exception';
import { BookingUploadRequestDto } from '../dtos/rest/booking-upload.request.dto';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';

@Injectable()
export class BookingService {
  constructor(
    @Inject() private readonly bookingRepository: BookingRepository,
    @Inject()
    private readonly photoshootPackageRepository: PhotoshootRepository,
    @Inject() private readonly notificationService: NotificationService,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly photoRepository: PhotoRepository,
  ) {}

  async updateById(
    userId: string,
    bookingId: string,
    updateDto: BookingUpdateRequestDto,
  ) {
    if (
      (updateDto.startDate && !updateDto.endDate) ||
      (!updateDto.startDate && updateDto.endDate)
    ) {
      throw new BothStartEndDateMustSpecifyException();
    }

    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    const validStates: BookingStatus[] = ['REQUESTED', 'ACCEPTED'];

    if (validStates.indexOf(booking.status) < 0) {
      throw new BookingStartedException();
    }

    if (updateDto.startDate && updateDto.endDate) {
      this.validateStartEndDateOfUser(updateDto.startDate, updateDto.endDate);

      this.validatePreviousBookingOverlap(
        booking.userId, //<-- user who book NOT PHOTOGRAPHER
        updateDto.startDate,
        updateDto.endDate,
      );
    }

    const updatedBooking = await this.bookingRepository.updateById(
      bookingId,
      updateDto,
    );

    return plainToInstance(BookingDto, updatedBooking);
  }

  async findAllByUserId(userId: string, findallDto: BookingFindAllRequestDto) {
    findallDto.userId = userId;

    const count = await this.bookingRepository.count(findallDto.toWhere());

    const bookings: BookingWithPhotoshootPackageIncludedUser[] =
      await this.bookingRepository.findAllWithIncludedPhotoshootPackage(
        findallDto.toSkip(),
        findallDto.limit,
        findallDto.toWhere(),
      );

    const bookingDtos = plainToInstance(BookingDto, bookings);

    return new BookingFindAllResponseDto(findallDto.limit, count, bookingDtos);
  }

  async uploadPhoto(
    userId: string,
    bookingId: string,
    bookingUploadDto: BookingUploadRequestDto,
  ) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    if (
      booking.status === 'FAILED' ||
      booking.status === 'REQUESTED' ||
      booking.status === 'DENIED'
    ) {
      throw new BookingNotAcceptedException();
    }

    const signedPhotoDto = await this.photoService.uploadPhoto(
      userId,
      'BOOKING',
      {
        file: bookingUploadDto.file,
      },
    );

    await this.photoService.sendImageWatermarkQueue(userId, signedPhotoDto.id, {
      text: 'PXL',
    });

    await this.photoRepository.updateById(signedPhotoDto.id, {
      watermark: true,
      booking: {
        connect: {
          id: bookingId,
        },
      },
    });

    return this.photoService.getSignedPhotoById(userId, signedPhotoDto.id);
  }

  async accept(bookingId: string, userId: string) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    if (booking.status !== 'REQUESTED') {
      throw new BookingNotInRequestedStateException();
    }

    const updatedBooking = await this.bookingRepository.updateById(bookingId, {
      status: 'ACCEPTED',
    });

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      referenceId: booking.id,
      referenceType: 'BOOKING',
      title: `Nhiếp ảnh gia đã chấp nhận gói chụp ${booking.photoshootPackageHistory.title}`,
      type: 'BOTH_INAPP_EMAIL',
      content: `Yêu cầu thực hiện gói chụp ${booking.photoshootPackageHistory.title} của bạn đã được chấp nhận, nếu có bất kì yêu cầu nào khác - vui lòng liên hệ nhiếp ảnh gia qua tin nhắn để trao đổi thêm`,
    });

    return plainToInstance(BookingDto, updatedBooking);
  }

  async deny(
    bookingId: string,
    userId: string,
    denyDto: DenyBookingRequestDto,
  ) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    if (booking.status !== 'REQUESTED') {
      throw new BookingNotInRequestedStateException();
    }

    const updatedBooking = await this.bookingRepository.updateById(bookingId, {
      status: 'DENIED',
      failedReason: denyDto.reason,
    });

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      referenceId: booking.id,
      referenceType: 'BOOKING',
      title: `Nhiếp ảnh gia đã từ chối gói chụp ${booking.photoshootPackageHistory.title}`,
      type: 'BOTH_INAPP_EMAIL',
      content: `Yêu cầu thực hiện gói chụp ${booking.photoshootPackageHistory.title} của bạn đã hủy bỏ với lí do ${denyDto.reason}`,
    });

    return plainToInstance(BookingDto, updatedBooking);
  }

  async findAllByPhotographerId(
    photographerId: string,
    findallDto: BookingFindAllRequestDto,
  ) {
    findallDto.photographerId = photographerId;

    const count = await this.bookingRepository.count(findallDto.toWhere());

    const bookings: BookingWithPhotoshootPackageIncludedUser[] =
      await this.bookingRepository.findAllWithIncludedPhotoshootPackage(
        findallDto.toSkip(),
        findallDto.limit,
        findallDto.toWhere(),
      );

    const bookingDtos = plainToInstance(BookingDto, bookings);

    return new BookingFindAllResponseDto(findallDto.limit, count, bookingDtos);
  }

  validateStartEndDateOfUser(start: Date, end: Date) {
    const now = new Date();

    const diffFromStartDateToCurrentDate = start.getTime() - now.getTime();
    const dayDiffFromCurrent =
      diffFromStartDateToCurrentDate / 1000 / 60 / 60 / 24;

    if (dayDiffFromCurrent < 1) {
      throw new StartDateMustLargerThanCurrentDateByOneDayException();
    }

    const diffBetweenStartAndEndDate = end.getTime() - start.getTime();
    const hourDiffBetweenStartAndEnd =
      diffBetweenStartAndEndDate / 1000 / 60 / 60;

    if (hourDiffBetweenStartAndEnd < 0) {
      throw new EndDateMustLargerThanStartDateException();
    }

    if (hourDiffBetweenStartAndEnd < 3) {
      throw new HourBetweenStartAndEndDateMustNotLessThanThreeException();
    }

    return true;
  }

  async validatePreviousBookingOverlap(userId: string, start: Date, end: Date) {
    // ---------------------a-------------b------------------------------
    // -----c(startDate)-------------------------------d(endDate)--------
    //this is overlap date
    //
    const previousBooking = await this.bookingRepository.findFirst({
      userId,
      status: {
        notIn: ['SUCCESSED', 'FAILED', 'DENIED'],
      },
      startDate: {
        lte: end,
      },
      endDate: {
        gte: start,
      },
    });

    if (previousBooking) {
      throw new ExistBookingWithSelectedDateException();
    }
  }

  async requestBooking(
    userId: string,
    packageId: string,
    bookingRequestDto: RequestPhotoshootBookingRequestDto,
  ) {
    const photoshootPackage =
      await this.photoshootPackageRepository.findUniqueOrThrow(packageId);

    this.validateStartEndDateOfUser(
      bookingRequestDto.startDate,
      bookingRequestDto.endDate,
    );

    this.validatePreviousBookingOverlap(
      userId,
      bookingRequestDto.startDate,
      bookingRequestDto.endDate,
    );

    const booking = await this.bookingRepository.create({
      startDate: bookingRequestDto.startDate,
      endDate: bookingRequestDto.endDate,
      status: 'REQUESTED',
      description: bookingRequestDto.description,
      billItems: {
        create: {
          type: 'INCREASE',
          title: 'giá gốc của gói chụp',
          price: photoshootPackage.price,
        },
      },
      originalPhotoshootPackage: {
        connect: {
          id: photoshootPackage.id,
        },
      },
      photoshootPackageHistory: {
        create: {
          price: photoshootPackage.price,
          title: photoshootPackage.title,
          subtitle: photoshootPackage.subtitle,
          thumbnail: photoshootPackage.thumbnail,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    });

    await this.notificationService.addNotificationToQueue({
      userId,
      referenceId: booking.id,
      referenceType: 'BOOKING',
      title: `Yêu cầu thực hiện gói chụp ${photoshootPackage.title}`,
      type: 'BOTH_INAPP_EMAIL',
      content: `Bạn đã yêu cầu thực hiện gói chụp ${photoshootPackage.title} vui lòng chờ phản hồi từ nhiếp ảnh gia`,
    });

    await this.notificationService.addNotificationToQueue({
      userId: photoshootPackage.userId,
      referenceId: booking.id,
      referenceType: 'BOOKING',
      title: 'Có yêu cầu thực hiện gói chụp mới',
      type: 'BOTH_INAPP_EMAIL',
      content: `Có khách hàng yêu cầu thực hiện gói chụp ${photoshootPackage.title} vui lòng phản hồi sớm nhất có thể`,
    });

    return plainToInstance(BookingDto, booking);
  }
}
