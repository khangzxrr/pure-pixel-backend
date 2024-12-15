import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { Booking, BookingDetail } from 'src/database/types/booking';
import { BookingUpdateRequestDto } from '../dtos/rest/booking-update.request.dto';
import { BookingStatus, PrismaPromise } from '@prisma/client';
import { BothStartEndDateMustSpecifyException } from '../exceptions/start-end-date-must-specify.exception';
import { BookingNotAcceptedException } from '../exceptions/booking-not-accepted.exception';
import { BookingUploadRequestDto } from '../dtos/rest/booking-upload.request.dto';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { BookingNotInValidStateException } from '../exceptions/booking-not-in-valid-state.exception';
import { PrismaService } from 'src/prisma.service';
import { BunnyService } from 'src/storage/services/bunny.service';
import { PhotoshootPackageReviewDto } from 'src/photoshoot-package/dtos/photoshoot-package-review.dto';
import { PhotoshootPackageReviewRepository } from 'src/database/repositories/photoshoot-package-review.repository';
import { CreatePhotoshootPackageReviewDto } from 'src/photoshoot-package/dtos/rest/create-photoshoot-package-review.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { CannotBookOwnedPhotoshootPackageException } from '../exceptions/cannot-book-owned-photoshoot-package.exception';
import * as AdmZip from 'adm-zip';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { UserService } from 'src/user/services/user.service';
import { PhotoGenerateWatermarkService } from 'src/photo/services/photo-generate-watermark.service';
import { FileSystemBookngUploadDto } from '../dtos/rest/file-system-booking-upload.request.dto';
import { Queue } from 'bullmq';
import { PhotoConstant } from 'src/photo/constants/photo.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { TemporaryBookingPhotoUpload } from 'src/photo/dtos/temporary-booking-photo-upload.dto';
import { Utils } from 'src/infrastructure/utils/utils';
import { writeFileSync } from 'fs';
import { PhotoshootPackageDisabledException } from '../exceptions/photoshoot-package-disabled.exception';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @Inject() private readonly bookingRepository: BookingRepository,
    @Inject()
    private readonly photoshootPackageRepository: PhotoshootRepository,
    @Inject() private readonly notificationService: NotificationService,
    @Inject()
    private readonly photoshootPackageReviewRepository: PhotoshootPackageReviewRepository,
    @Inject() private readonly photoService: PhotoService,
    @Inject() private readonly photoRepository: PhotoRepository,
    @Inject() private readonly bunnyService: BunnyService,
    @Inject() private readonly photoProcessService: PhotoProcessService,
    @Inject() private readonly userService: UserService,
    @Inject()
    private readonly photoGenerateWatermarkService: PhotoGenerateWatermarkService,
    @InjectQueue(PhotoConstant.PHOTO_PROCESS_QUEUE)
    private readonly photoProcessQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async signBooking(booking: Booking) {
    const bookingDto = plainToInstance(BookingDto, booking);

    bookingDto.originalPhotoshootPackage.thumbnail =
      this.bunnyService.getPresignedFile(
        bookingDto.originalPhotoshootPackage.thumbnail,
      );

    bookingDto.photoshootPackageHistory.thumbnail =
      this.bunnyService.getPresignedFile(
        bookingDto.photoshootPackageHistory.thumbnail,
      );

    return bookingDto;
  }

  async signBookingDetail(bookingDetail: BookingDetail) {
    const bookingDto = plainToInstance(BookingDto, bookingDetail);

    bookingDto.originalPhotoshootPackage.thumbnail =
      this.bunnyService.getPresignedFile(
        bookingDto.originalPhotoshootPackage.thumbnail,
      );

    bookingDto.photoshootPackageHistory.thumbnail =
      this.bunnyService.getPresignedFile(
        bookingDto.photoshootPackageHistory.thumbnail,
      );

    const signedPhotoDtoPromises = bookingDetail.photos.map((p) =>
      this.photoService.signPhoto(p),
    );

    const signedPhotoDtos = await Promise.all(signedPhotoDtoPromises);
    bookingDto.photos = signedPhotoDtos;

    const initialTotalBilItem = new Decimal(0);

    const totalBillItem = bookingDetail.billItems.reduce(
      (acc, current) =>
        current.type === 'INCREASE'
          ? acc.add(current.price)
          : acc.sub(current.price),
      initialTotalBilItem,
    );
    bookingDto.totalBillItem = totalBillItem.toNumber();

    return bookingDto;
  }

  async createReview(
    userId: string,
    bookingId: string,
    createDto: CreatePhotoshootPackageReviewDto,
  ) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.userId !== userId) {
      throw new BookingNotBelongException();
    }

    if (booking.status !== 'FAILED' && booking.status !== 'SUCCESSED') {
      throw new BookingNotInValidStateException();
    }

    const review = await this.photoshootPackageReviewRepository.upsert(
      {
        bookingId_userId: {
          userId,
          bookingId,
        },
      },
      {
        user: {
          connect: {
            id: userId,
          },
        },
        booking: {
          connect: {
            id: bookingId,
          },
        },
        photoshootPackage: {
          connect: {
            id: booking.originalPhotoshootPackageId,
          },
        },
        description: createDto.description,
        star: createDto.star,
      },
    );

    const photoshootPackageReviewDto = plainToInstance(
      PhotoshootPackageReviewDto,
      review,
    );

    this.notificationService.addNotificationToQueue({
      userId: booking.originalPhotoshootPackage.userId,
      type: 'IN_APP',
      title: 'Đánh giá mới',
      content: `Gói ${booking.photoshootPackageHistory.title} của bạn đã được thêm một đánh giá mới`,
      payload: {
        id: booking.id,
      },
      referenceType: 'PHOTOGRAPHER_NEW_BOOKING_REVIEW',
    });

    return photoshootPackageReviewDto;
  }

  async updateBookingToPaid(userId: string, bookingId: string) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    if (booking.status !== 'ACCEPTED') {
      throw new BookingNotInValidStateException();
    }

    const prismaPromises: PrismaPromise<any>[] = [];

    prismaPromises.push(
      this.bookingRepository.updateByIdQuery(bookingId, {
        status: 'SUCCESSED',
      }),
    );

    prismaPromises.push(
      this.photoRepository.updateManyQuery({
        where: {
          bookingId,
        },
        data: {
          watermark: false,
        },
      }),
    );

    await this.prisma.$transaction(prismaPromises);

    this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'IN_APP',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
      content: `Gói chụp ${booking.photoshootPackageHistory.title} của bạn đã được cập nhật thành đã thanh toán và mở khóa tải về ảnh`,
      payload: {
        id: booking.id,
      },
      referenceType: 'CUSTOMER_BOOKING_PAID',
    });

    return await this.findById(userId, bookingId);
  }

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
      throw new BookingNotInValidStateException();
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

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'BOTH_INAPP_EMAIL',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} của bạn có cập nhật mới`,
      content: `Gói chụp ${booking.photoshootPackageHistory.title} của bạn vừa được cập nhật ghi chú mới, xin vui lòng kiểm tra`,
      payload: {
        id: bookingId,
      },
      referenceType: 'CUSTOMER_BOOKING_NOTE_UPDATE',
    });

    return plainToInstance(BookingDto, updatedBooking);
  }

  async findById(userId: string, bookingId: string) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (
      booking.originalPhotoshootPackage.userId !== userId &&
      booking.userId !== userId
    ) {
      throw new BookingNotBelongException();
    }

    return await this.signBookingDetail(booking);
  }

  async compressZip(userId: string, bookingId: string) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (
      booking.originalPhotoshootPackage.userId !== userId &&
      booking.userId !== userId
    ) {
      throw new BookingNotBelongException();
    }

    const zip = new AdmZip();

    for (const photo of booking.photos) {
      const buffer = await this.photoProcessService.getBufferFromKey(
        photo.originalPhotoUrl,
      );

      zip.addFile(photo.originalPhotoUrl, buffer);
    }

    return zip.toBuffer();
  }

  async findAllByUserId(userId: string, findallDto: BookingFindAllRequestDto) {
    findallDto.userId = userId;

    const count = await this.bookingRepository.count(findallDto.toWhere());

    const bookings: Booking[] =
      await this.bookingRepository.findAllWithIncludedPhotoshootPackage(
        findallDto.toSkip(),
        findallDto.limit,
        findallDto.toWhere(),
        findallDto.toOrderBy(),
      );

    const dtoPromises = bookings.map(async (b) => await this.signBooking(b));
    const dtos = await Promise.all(dtoPromises);

    return new BookingFindAllResponseDto(findallDto.limit, count, dtos);
  }

  async deletePhoto(userId: string, bookingId: string, photoId: string) {
    const booking = await this.bookingRepository.findUniqueOrThrow({
      id: bookingId,
    });

    if (booking.originalPhotoshootPackage.userId !== userId) {
      throw new BookingNotBelongException();
    }

    if (booking.status !== 'ACCEPTED') {
      throw new BookingNotInValidStateException();
    }

    const photo = await this.photoRepository.findUniqueOrThrow(photoId);

    await this.photoRepository.deleteById(photoId);

    await this.userService.updatePhotoQuota(userId, photo.size);

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'IN_APP',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
      content: 'Gói chụp của bạn đã được cập nhật ảnh!',
      payload: {
        id: booking.id,
      },
      referenceType: 'CUSTOMER_BOOKING_PHOTO_REMOVE',
    });

    return photo;
  }

  async filesystemUploadPhoto(
    userId: string,
    bookingId: string,
    bookingUploadDto: FileSystemBookngUploadDto,
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

    const sharp = await this.photoProcessService.sharpInitFromFilePath(
      bookingUploadDto.file.path,
    );

    const buffer = await sharp.toBuffer();
    if (buffer.length === 0) {
      this.logger.log(
        `temporary photo ${bookingUploadDto.file.path} of booking id: ${booking.id}  is deleted form file system, skip`,
      );

      return;
    }

    const metadata = await sharp.metadata();

    const watermark = await this.photoProcessService.makeWatermark(
      sharp,
      'PXL',
    );
    const watermarkBuffer = await watermark.toBuffer();

    const extension = Utils.getExtension(bookingUploadDto.file.path);
    const watermarkFilePath = `/tmp/purepixel-local-storage/${bookingUploadDto.file.originalName}_watermark.${extension}`;

    writeFileSync(watermarkFilePath, watermarkBuffer);

    const photo = await this.photoRepository.create({
      photographer: {
        connect: {
          id: userId,
        },
      },
      description: '',
      title: bookingUploadDto.file.originalName,
      normalizedTitle: Utils.normalizeText(bookingUploadDto.file.originalName),
      size: bookingUploadDto.file.size,
      exif: {},
      width: metadata.width,
      height: metadata.height,
      status: 'PENDING',
      photoType: 'BOOKING',
      blurHash: '',
      watermark: true,
      visibility: 'PRIVATE',
      originalPhotoUrl: bookingUploadDto.file.path,
      watermarkPhotoUrl: watermarkFilePath,
      booking: {
        connect: {
          id: booking.id,
        },
      },
    });

    this.logger.log(
      `create temporary watermark for photo id: ${photo.id} of booking id: ${booking.id}`,
    );

    await this.notificationService.addNotificationToQueue(
      {
        userId: booking.userId,
        type: 'IN_APP',
        title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
        content: 'Gói chụp của bạn đã được cập nhật ảnh mới!',
        payload: {
          id: booking.id,
        },
        referenceType: 'CUSTOMER_BOOKING_PHOTO_ADD',
      },
      {
        jobId: `add_photo_${booking.id}`,
        delay: 3000,
      },
    );

    const temporaryBookingPhotoDto: TemporaryBookingPhotoUpload = {
      photographerId: userId,
      bookingId: bookingId,
      file: bookingUploadDto.file,
      photoId: photo.id,
    };

    await this.photoProcessQueue.add(
      PhotoConstant.UPLOAD_BOOKING_PHOTO_JOB_NAME,
      temporaryBookingPhotoDto,
    );

    return await this.photoService.signPhoto(photo);
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

    const signedPhotoDto = await this.photoService.uploadBookingPhoto(userId, {
      file: bookingUploadDto.file,
    });

    await this.photoGenerateWatermarkService.generateWatermarkFromBuffer(
      signedPhotoDto.id,
      {
        text: 'PXL',
      },
      bookingUploadDto.file.buffer,
    );

    await this.photoRepository.updateById(signedPhotoDto.id, {
      watermark: booking.status === 'SUCCESSED' ? false : true,
      booking: {
        connect: {
          id: bookingId,
        },
      },
    });

    await this.notificationService.addNotificationToQueue({
      userId: booking.userId,
      type: 'IN_APP',
      title: `Gói chụp ${booking.photoshootPackageHistory.title} có cập nhật mới`,
      content: 'Gói chụp của bạn đã được cập nhật ảnh mới!',
      payload: {
        id: booking.id,
      },
      referenceType: 'CUSTOMER_BOOKING_PHOTO_ADD',
    });

    return this.photoService.findById(userId, signedPhotoDto.id);
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
      referenceType: 'CUSTOMER_BOOKING_ACCEPT',
      title: `Nhiếp ảnh gia đã chấp nhận gói chụp ${booking.photoshootPackageHistory.title}`,
      type: 'BOTH_INAPP_EMAIL',
      content: `Yêu cầu thực hiện gói chụp ${booking.photoshootPackageHistory.title} của bạn đã được chấp nhận, nếu có bất kì yêu cầu nào khác - vui lòng liên hệ nhiếp ảnh gia qua tin nhắn để trao đổi thêm`,
      payload: {
        id: booking.id,
      },
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
      referenceType: 'CUSTOMER_BOOKING_CANCEL',
      title: `Nhiếp ảnh gia đã từ chối gói chụp ${booking.photoshootPackageHistory.title}`,
      type: 'BOTH_INAPP_EMAIL',
      content: `Yêu cầu thực hiện gói chụp ${booking.photoshootPackageHistory.title} của bạn đã hủy bỏ`,
      payload: {
        id: booking.id,
      },
    });

    return plainToInstance(BookingDto, updatedBooking);
  }

  async findAllByPhotographerId(
    photographerId: string,
    findallDto: BookingFindAllRequestDto,
  ) {
    findallDto.photographerId = photographerId;

    const count = await this.bookingRepository.count(findallDto.toWhere());

    const bookings: Booking[] =
      await this.bookingRepository.findAllWithIncludedPhotoshootPackage(
        findallDto.toSkip(),
        findallDto.limit,
        findallDto.toWhere(),
        findallDto.toOrderBy(),
      );

    const dtoPromises = bookings.map(async (b) => await this.signBooking(b));
    const dtos = await Promise.all(dtoPromises);

    return new BookingFindAllResponseDto(findallDto.limit, count, dtos);
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

    if (photoshootPackage.userId === userId) {
      throw new CannotBookOwnedPhotoshootPackageException();
    }

    if (photoshootPackage.status === 'DISABLED') {
      throw new PhotoshootPackageDisabledException();
    }

    this.validateStartEndDateOfUser(
      bookingRequestDto.startDate,
      bookingRequestDto.endDate,
    );

    await this.validatePreviousBookingOverlap(
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
      referenceType: 'CUSTOMER_BOOKING_REQUEST',
      title: `Yêu cầu thực hiện gói chụp ${photoshootPackage.title}`,
      type: 'BOTH_INAPP_EMAIL',
      content: `Bạn đã yêu cầu thực hiện gói chụp ${photoshootPackage.title} vui lòng chờ phản hồi từ nhiếp ảnh gia`,
      payload: {
        id: booking.id,
      },
    });

    await this.notificationService.addNotificationToQueue({
      userId: photoshootPackage.userId,
      referenceType: 'PHOTOGRAPHER_BOOKING_NEW_REQUEST',
      title: 'Có yêu cầu thực hiện gói chụp mới',
      type: 'BOTH_INAPP_EMAIL',
      content: `Có khách hàng yêu cầu thực hiện gói chụp ${photoshootPackage.title} vui lòng phản hồi sớm nhất có thể`,
      payload: {
        id: booking.id,
      },
    });

    return plainToInstance(BookingDto, booking);
  }
}
