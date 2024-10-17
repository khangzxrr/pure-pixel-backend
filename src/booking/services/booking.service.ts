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

@Injectable()
export class BookingService {
  constructor(
    @Inject() private readonly bookingRepository: BookingRepository,
    @Inject()
    private readonly photoshootPackageRepository: PhotoshootRepository,
    @Inject() private readonly notificationService: NotificationService,
  ) {}

  async findAllByUserId(userId: string, findallDto: BookingFindAllRequestDto) {
    findallDto.userId = userId;

    const count = await this.bookingRepository.count(findallDto.toWhere());

    const bookings = await this.bookingRepository.findAll({
      skip: findallDto.toSkip(),
      take: findallDto.limit,
      where: findallDto.toWhere(),
      include: {
        photoshootPackage: true,
        user: true,
      },
    });

    const bookingDtos = plainToInstance(BookingDto, bookings);

    return new BookingFindAllResponseDto(findallDto.limit, count, bookingDtos);
  }

  async findAllByPhotographerId(
    photographerId: string,
    findallDto: BookingFindAllRequestDto,
  ) {
    findallDto.photographerId = photographerId;

    const count = await this.bookingRepository.count(findallDto.toWhere());

    const bookings = await this.bookingRepository.findAll({
      skip: findallDto.toSkip(),
      take: findallDto.limit,
      where: findallDto.toWhere(),
      include: {
        photoshootPackage: true,
        user: true,
      },
    });

    const bookingDtos = plainToInstance(BookingDto, bookings);

    return new BookingFindAllResponseDto(findallDto.limit, count, bookingDtos);
  }

  async requestBooking(
    userId: string,
    packageId: string,
    bookingRequestDto: RequestPhotoshootBookingRequestDto,
  ) {
    const photoshootPackage =
      await this.photoshootPackageRepository.findUniqueOrThrow(packageId);

    const now = new Date();

    const diffFromStartDateToCurrentDate =
      bookingRequestDto.startDate.getTime() - now.getTime();
    const dayDiffFromCurrent =
      diffFromStartDateToCurrentDate / 1000 / 60 / 60 / 24;

    if (dayDiffFromCurrent < 1) {
      throw new StartDateMustLargerThanCurrentDateByOneDayException();
    }

    const diffBetweenStartAndEndDate =
      bookingRequestDto.endDate.getTime() -
      bookingRequestDto.startDate.getTime();
    const hourDiffBetweenStartAndEnd =
      diffBetweenStartAndEndDate / 1000 / 60 / 60;

    if (hourDiffBetweenStartAndEnd < 0) {
      throw new EndDateMustLargerThanStartDateException();
    }

    if (hourDiffBetweenStartAndEnd < 3) {
      throw new HourBetweenStartAndEndDateMustNotLessThanThreeException();
    }

    // ---------------------a-------------b------------------------------
    // -----c(startDate)-------------------------------d(endDate)--------
    //this is overlap date
    //
    const previousBooking = await this.bookingRepository.findFirst({
      userId,
      photoshootPackageId: packageId,
      status: {
        notIn: ['SUCCESSED', 'FAILED'],
      },
      startDate: {
        lte: bookingRequestDto.endDate,
      },
      endDate: {
        gte: bookingRequestDto.startDate,
      },
    });

    if (previousBooking) {
      throw new ExistBookingWithSelectedDateException();
    }

    const booking = await this.bookingRepository.create({
      startDate: bookingRequestDto.startDate,
      endDate: bookingRequestDto.endDate,
      status: 'REQUESTED',
      description: bookingRequestDto.description,
      photoshootPackage: {
        connect: {
          id: packageId,
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
