jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
}));

import { NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import * as classTransformer from 'class-transformer';
import { writeFileSync } from 'fs';
import * as AdmZip from 'adm-zip';
import { BookingService } from './booking.service';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { PhotoshootRepository } from 'src/database/repositories/photoshoot-package.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { PhotoshootPackageReviewRepository } from 'src/database/repositories/photoshoot-package-review.repository';
import { PhotoService } from 'src/photo/services/photo.service';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { BunnyService } from 'src/storage/services/bunny.service';
import { PhotoProcessService } from 'src/photo/services/photo-process.service';
import { UserService } from 'src/user/services/user.service';
import { PhotoGenerateWatermarkService } from 'src/photo/services/photo-generate-watermark.service';
import { PrismaService } from 'src/prisma.service';
import { Booking, BookingDetail } from 'src/database/types/booking';
import { BookingDto } from '../dtos/booking.dto';
import { BookingNotBelongException } from '../exceptions/booking-not-belong.exception';
import { BookingNotInValidStateException } from '../exceptions/booking-not-in-valid-state.exception';
import { BothStartEndDateMustSpecifyException } from '../exceptions/start-end-date-must-specify.exception';
import { BookingNotFinishedLongEnoughException } from '../exceptions/booking-not-finished-long-enough.exception';
import { BookingNotAcceptedException } from '../exceptions/booking-not-accepted.exception';
import { FailToParsePhotoException } from 'src/photo/exceptions/fail-to-parse-photo.exception';
import { PhotoNotFoundException } from 'src/photo/exceptions/photo-not-found.exception';
import { BookingNotInRequestedStateException } from '../exceptions/booking-not-in-requested-state.exception';
import { StartDateMustLargerThanCurrentDateByOneDayException } from '../exceptions/start-date-must-larger-than-current-day-by-one-day.exception';
import { EndDateMustLargerThanStartDateException } from '../exceptions/end-date-must-larger-than-start-date.exception';
import { HourBetweenStartAndEndDateMustNotLessThanThreeException } from '../exceptions/hour-between-start-end-date-must-larger-than-three-hours.exception';
import { ExistBookingWithSelectedDateException } from '../exceptions/exist-booking-with-selected-date.exception';
import { CannotBookOwnedPhotoshootPackageException } from '../exceptions/cannot-book-owned-photoshoot-package.exception';
import { PhotoshootPackageDisabledException } from '../exceptions/photoshoot-package-disabled.exception';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { BookingFindAllResponseDto } from '../dtos/rest/booking-find-all.response.dto';
import { FileSystemBookngUploadDto } from '../dtos/rest/file-system-booking-upload.request.dto';
import { BookingUploadRequestDto } from '../dtos/rest/booking-upload.request.dto';
import { RequestPhotoshootBookingRequestDto } from '../dtos/rest/request-photoshoot-booking.request.dto';
import { PhotoConstant } from 'src/photo/constants/photo.constant';
import { Decimal } from '@prisma/client/runtime/library';
import { CreatePhotoshootPackageReviewDto } from 'src/photoshoot-package/dtos/rest/create-photoshoot-package-review.dto';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const PHOTOGRAPHER_ID = 'photographer-id';
const CUSTOMER_ID = 'customer-id';
const BOOKING_ID = 'booking-id';

const makeBooking = (overrides: Record<string, unknown> = {}): BookingDetail =>
  ({
    id: BOOKING_ID,
    userId: CUSTOMER_ID,
    status: 'ACCEPTED',
    startDate: new Date(),
    endDate: new Date(),
    successedAt: null,
    updatedAt: new Date(),
    originalPhotoshootPackageId: 'package-id',
    originalPhotoshootPackage: {
      id: 'package-id',
      userId: PHOTOGRAPHER_ID,
      thumbnail: 'package-thumbnail',
      updatedAt: new Date(1000),
    },
    photoshootPackageHistory: {
      id: 'history-id',
      title: 'package title',
      thumbnail: 'history-thumbnail',
    },
    photos: [],
    billItems: [],
    reviews: [],
    ...overrides,
  }) as unknown as BookingDetail;

describe('BookingService', () => {
  let service: BookingService;

  let bookingRepository: {
    findUniqueOrThrow: jest.Mock;
    updateByIdQuery: jest.Mock;
    updateById: jest.Mock;
    count: jest.Mock;
    findAllWithIncludedPhotoshootPackage: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  let photoshootPackageRepository: { findUniqueOrThrow: jest.Mock };
  let notificationService: { addNotificationToQueue: jest.Mock };
  let reviewRepository: { upsert: jest.Mock };
  let photoService: {
    signPhoto: jest.Mock;
    uploadBookingPhoto: jest.Mock;
    findById: jest.Mock;
  };
  let photoRepository: {
    updateManyQuery: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    deleteById: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
  };
  let bunnyService: { getPresignedFile: jest.Mock };
  let photoProcessService: {
    getBufferFromKey: jest.Mock;
    sharpInitFromFilePath: jest.Mock;
    makeWatermark: jest.Mock;
  };
  let userService: { updatePhotoQuota: jest.Mock };
  let watermarkService: { generateWatermarkFromBuffer: jest.Mock };
  let photoProcessQueue: { add: jest.Mock };
  let prisma: { $transaction: jest.Mock };

  beforeEach(() => {
    bookingRepository = {
      findUniqueOrThrow: jest.fn(),
      updateByIdQuery: jest.fn().mockReturnValue('update-booking-query'),
      updateById: jest.fn(),
      count: jest.fn(),
      findAllWithIncludedPhotoshootPackage: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    photoshootPackageRepository = { findUniqueOrThrow: jest.fn() };
    notificationService = {
      addNotificationToQueue: jest.fn().mockResolvedValue(undefined),
    };
    reviewRepository = { upsert: jest.fn() };
    photoService = {
      signPhoto: jest.fn(async (p: { id: string }) => ({ ...p, signed: true })),
      uploadBookingPhoto: jest.fn(),
      findById: jest.fn(),
    };
    photoRepository = {
      updateManyQuery: jest.fn().mockReturnValue('update-photo-query'),
      findUniqueOrThrow: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
    };
    bunnyService = {
      getPresignedFile: jest.fn(
        (key: string, suffix: string) => `signed:${key}${suffix}`,
      ),
    };
    photoProcessService = {
      getBufferFromKey: jest.fn(),
      sharpInitFromFilePath: jest.fn(),
      makeWatermark: jest.fn(),
    };
    userService = { updatePhotoQuota: jest.fn() };
    watermarkService = { generateWatermarkFromBuffer: jest.fn() };
    photoProcessQueue = { add: jest.fn() };
    prisma = { $transaction: jest.fn().mockResolvedValue([]) };

    service = new BookingService(
      bookingRepository as unknown as BookingRepository,
      photoshootPackageRepository as unknown as PhotoshootRepository,
      notificationService as unknown as NotificationService,
      reviewRepository as unknown as PhotoshootPackageReviewRepository,
      photoService as unknown as PhotoService,
      photoRepository as unknown as PhotoRepository,
      bunnyService as unknown as BunnyService,
      photoProcessService as unknown as PhotoProcessService,
      userService as unknown as UserService,
      watermarkService as unknown as PhotoGenerateWatermarkService,
      photoProcessQueue as unknown as Queue,
      prisma as unknown as PrismaService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (writeFileSync as jest.Mock).mockReset();
  });

  describe('signBooking', () => {
    it('should sign thumbnails of original package and history', async () => {
      const booking = makeBooking() as unknown as Booking;

      const dto = await service.signBooking(booking);

      expect(dto).toBeInstanceOf(BookingDto);
      expect(dto.originalPhotoshootPackage?.thumbnail).toEqual(
        'signed:package-thumbnail?updatedAt=1000',
      );
      expect(dto.photoshootPackageHistory?.thumbnail).toEqual(
        'signed:history-thumbnail?updatedAt=1000',
      );
    });

    it('should throw when original package is null', async () => {
      const booking = makeBooking({
        originalPhotoshootPackage: null,
      }) as unknown as Booking;

      await expect(service.signBooking(booking)).rejects.toThrow(
        new NotFoundException('OriginalPhotoshootPackageNotFound'),
      );
    });

    it('should throw when history is missing', async () => {
      const booking = makeBooking({
        photoshootPackageHistory: undefined,
      }) as unknown as Booking;

      await expect(service.signBooking(booking)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when transformed dto has no original package', async () => {
      jest
        .spyOn(classTransformer, 'plainToInstance')
        .mockReturnValueOnce({ photoshootPackageHistory: {} });

      await expect(
        service.signBooking(makeBooking() as unknown as Booking),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('signBookingDetail', () => {
    it('should sign photos and compute total bill item', async () => {
      const booking = makeBooking({
        photos: [{ id: 'p1' }, { id: 'p2' }],
        billItems: [
          { type: 'INCREASE', price: new Decimal(100) },
          { type: 'DECREASE', price: new Decimal(30) },
          { type: 'INCREASE', price: new Decimal(5) },
        ],
      });

      const dto = await service.signBookingDetail(booking);

      expect(photoService.signPhoto).toHaveBeenCalledTimes(2);
      expect(dto.photos).toHaveLength(2);
      expect(dto.totalBillItem).toEqual(75);
      expect(dto.originalPhotoshootPackage?.thumbnail).toEqual(
        'signed:package-thumbnail?updatedAt=1000',
      );
      expect(dto.photoshootPackageHistory?.thumbnail).toEqual(
        'signed:history-thumbnail?updatedAt=1000',
      );
    });

    it('should throw when original package is null', async () => {
      await expect(
        service.signBookingDetail(
          makeBooking({ originalPhotoshootPackage: null }),
        ),
      ).rejects.toThrow('OriginalPhotoshootPackageNotFound');
    });

    it('should throw when history is missing', async () => {
      await expect(
        service.signBookingDetail(
          makeBooking({ photoshootPackageHistory: undefined }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when transformed dto has no original package', async () => {
      jest
        .spyOn(classTransformer, 'plainToInstance')
        .mockReturnValueOnce({ photoshootPackageHistory: {} });

      await expect(service.signBookingDetail(makeBooking())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createReview', () => {
    const createDto: CreatePhotoshootPackageReviewDto = {
      description: 'great',
      star: 5,
      photoshootPackageId: 'package-id',
      bookingId: BOOKING_ID,
    };

    it('should upsert review and notify photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'SUCCESSED' }),
      );
      reviewRepository.upsert.mockResolvedValue({
        id: 'review-id',
        star: 5,
        description: 'great',
      });

      const result = await service.createReview(
        CUSTOMER_ID,
        BOOKING_ID,
        createDto,
      );

      expect(result).toMatchObject({ id: 'review-id', star: 5 });
      expect(reviewRepository.upsert).toHaveBeenCalledWith(
        { bookingId_userId: { userId: CUSTOMER_ID, bookingId: BOOKING_ID } },
        expect.objectContaining({
          photoshootPackage: { connect: { id: 'package-id' } },
          description: 'great',
          star: 5,
        }),
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: PHOTOGRAPHER_ID,
          referenceType: 'PHOTOGRAPHER_NEW_BOOKING_REVIEW',
        }),
      );
    });

    it('should accept FAILED bookings', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'FAILED' }),
      );
      reviewRepository.upsert.mockResolvedValue({ id: 'review-id' });

      await expect(
        service.createReview(CUSTOMER_ID, BOOKING_ID, createDto),
      ).resolves.toMatchObject({ id: 'review-id' });
    });

    it('should throw when booking does not belong to user', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'SUCCESSED' }),
      );

      await expect(
        service.createReview('other', BOOKING_ID, createDto),
      ).rejects.toThrow(BookingNotBelongException);
    });

    it('should throw when booking is not finished', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.createReview(CUSTOMER_ID, BOOKING_ID, createDto),
      ).rejects.toThrow(BookingNotInValidStateException);
    });

    it('should throw when originalPhotoshootPackageId is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'SUCCESSED', originalPhotoshootPackageId: null }),
      );

      await expect(
        service.createReview(CUSTOMER_ID, BOOKING_ID, createDto),
      ).rejects.toThrow('OriginalPhotoshootPackageNotFound');
      expect(reviewRepository.upsert).not.toHaveBeenCalled();
    });

    it('should throw when original package relation is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'SUCCESSED', originalPhotoshootPackage: null }),
      );
      reviewRepository.upsert.mockResolvedValue({ id: 'review-id' });

      await expect(
        service.createReview(CUSTOMER_ID, BOOKING_ID, createDto),
      ).rejects.toThrow(NotFoundException);
      expect(notificationService.addNotificationToQueue).not.toHaveBeenCalled();
    });
  });

  describe('updateBookingToPaid', () => {
    it('should update booking and photos in a transaction then return detail', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      const result = await service.updateBookingToPaid(
        PHOTOGRAPHER_ID,
        BOOKING_ID,
      );

      expect(bookingRepository.updateByIdQuery).toHaveBeenCalledWith(
        BOOKING_ID,
        expect.objectContaining({ status: 'SUCCESSED' }),
      );
      expect(photoRepository.updateManyQuery).toHaveBeenCalledWith({
        where: { bookingId: BOOKING_ID },
        data: { watermark: false },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        'update-booking-query',
        'update-photo-query',
      ]);
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: CUSTOMER_ID,
          referenceType: 'CUSTOMER_BOOKING_PAID',
        }),
      );
      expect(result).toBeInstanceOf(BookingDto);
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.updateBookingToPaid(PHOTOGRAPHER_ID, BOOKING_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.updateBookingToPaid(CUSTOMER_ID, BOOKING_ID),
      ).rejects.toThrow(BookingNotBelongException);
    });

    it('should throw when booking is not accepted', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'REQUESTED' }),
      );

      await expect(
        service.updateBookingToPaid(PHOTOGRAPHER_ID, BOOKING_ID),
      ).rejects.toThrow(BookingNotInValidStateException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('updateById', () => {
    it('should throw when only startDate is specified', async () => {
      await expect(
        service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {
          startDate: new Date(),
        }),
      ).rejects.toThrow(BothStartEndDateMustSpecifyException);
    });

    it('should throw when only endDate is specified', async () => {
      await expect(
        service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {
          endDate: new Date(),
        }),
      ).rejects.toThrow(BothStartEndDateMustSpecifyException);
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.updateById(CUSTOMER_ID, BOOKING_ID, {}),
      ).rejects.toThrow(BookingNotBelongException);
    });

    it('should throw when booking is not in a valid state', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'SUCCESSED' }),
      );

      await expect(
        service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {}),
      ).rejects.toThrow(BookingNotInValidStateException);
    });

    it('should update without dates', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'REQUESTED' }),
      );
      bookingRepository.updateById.mockResolvedValue({
        id: BOOKING_ID,
        description: 'note',
      });

      const result = await service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {
        description: 'note',
      });

      expect(result).toBeInstanceOf(BookingDto);
      expect(result.description).toEqual('note');
      expect(bookingRepository.findFirst).not.toHaveBeenCalled();
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: CUSTOMER_ID,
          referenceType: 'CUSTOMER_BOOKING_NOTE_UPDATE',
        }),
      );
    });

    it('should validate dates and check overlap against the customer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
      bookingRepository.updateById.mockResolvedValue({ id: BOOKING_ID });

      const startDate = new Date(Date.now() + 2 * DAY);
      const endDate = new Date(startDate.getTime() + 4 * HOUR);

      await service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {
        startDate,
        endDate,
      });

      expect(bookingRepository.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ userId: CUSTOMER_ID }),
      );
      expect(bookingRepository.updateById).toHaveBeenCalledWith(BOOKING_ID, {
        startDate,
        endDate,
      });
    });

    it('should throw and not update when the customer has an overlapping booking', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
      bookingRepository.findFirst.mockResolvedValue({ id: 'other-booking-id' });

      const startDate = new Date(Date.now() + 2 * DAY);
      const endDate = new Date(startDate.getTime() + 4 * HOUR);

      await expect(
        service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {
          startDate,
          endDate,
        }),
      ).rejects.toThrow(ExistBookingWithSelectedDateException);
      expect(bookingRepository.updateById).not.toHaveBeenCalled();
      expect(notificationService.addNotificationToQueue).not.toHaveBeenCalled();
    });

    it('should throw when dates are invalid', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.updateById(PHOTOGRAPHER_ID, BOOKING_ID, {
          startDate: new Date(),
          endDate: new Date(Date.now() + 4 * HOUR),
        }),
      ).rejects.toThrow(StartDateMustLargerThanCurrentDateByOneDayException);
    });
  });

  describe('findById', () => {
    it('should return signed detail for the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      const result = await service.findById(PHOTOGRAPHER_ID, BOOKING_ID);

      expect(bookingRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: BOOKING_ID,
      });
      expect(result).toBeInstanceOf(BookingDto);
    });

    it('should return signed detail for the customer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.findById(CUSTOMER_ID, BOOKING_ID),
      ).resolves.toBeInstanceOf(BookingDto);
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(service.findById(CUSTOMER_ID, BOOKING_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when user is neither photographer nor customer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(service.findById('stranger', BOOKING_ID)).rejects.toThrow(
        BookingNotBelongException,
      );
    });
  });

  describe('compressZip', () => {
    it('should add every photo to the zip', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({
          photos: [
            { originalPhotoUrl: 'a.jpg' },
            { originalPhotoUrl: 'b.jpg' },
          ],
        }),
      );
      photoProcessService.getBufferFromKey.mockImplementation(async (key) =>
        Buffer.from(`content-${key}`),
      );

      const buffer = await service.compressZip(CUSTOMER_ID, BOOKING_ID);

      const entries = new AdmZip(buffer).getEntries();
      expect(entries.map((e) => e.entryName).sort()).toEqual([
        'a.jpg',
        'b.jpg',
      ]);
      expect(photoProcessService.getBufferFromKey).toHaveBeenCalledTimes(2);
    });

    it('should work for the photographer with no photos', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      const buffer = await service.compressZip(PHOTOGRAPHER_ID, BOOKING_ID);

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.compressZip(CUSTOMER_ID, BOOKING_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user does not own the booking', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(service.compressZip('stranger', BOOKING_ID)).rejects.toThrow(
        BookingNotBelongException,
      );
    });
  });

  describe('findAllByUserId / findAllByPhotographerId', () => {
    const makeFindAllDto = () =>
      Object.assign(new BookingFindAllRequestDto(), { limit: 10, page: 1 });

    it('should find all bookings of a customer', async () => {
      const dto = makeFindAllDto();
      bookingRepository.count.mockResolvedValue(1);
      bookingRepository.findAllWithIncludedPhotoshootPackage.mockResolvedValue([
        makeBooking(),
      ]);

      const result = await service.findAllByUserId(CUSTOMER_ID, dto);

      expect(dto.userId).toEqual(CUSTOMER_ID);
      expect(bookingRepository.count).toHaveBeenCalledWith({
        userId: CUSTOMER_ID,
      });
      expect(
        bookingRepository.findAllWithIncludedPhotoshootPackage,
      ).toHaveBeenCalledWith(10, 10, { userId: CUSTOMER_ID }, []);
      expect(result).toBeInstanceOf(BookingFindAllResponseDto);
      expect(result.objects).toHaveLength(1);
    });

    it('should find all bookings of a photographer', async () => {
      const dto = makeFindAllDto();
      bookingRepository.count.mockResolvedValue(1);
      bookingRepository.findAllWithIncludedPhotoshootPackage.mockResolvedValue([
        makeBooking(),
      ]);

      const result = await service.findAllByPhotographerId(
        PHOTOGRAPHER_ID,
        dto,
      );

      expect(dto.photographerId).toEqual(PHOTOGRAPHER_ID);
      expect(bookingRepository.count).toHaveBeenCalledWith({
        originalPhotoshootPackage: { userId: PHOTOGRAPHER_ID },
      });
      expect(result).toBeInstanceOf(BookingFindAllResponseDto);
      expect(result.objects).toHaveLength(1);
      expect(result.objects[0]).toBeInstanceOf(BookingDto);
    });
  });

  describe('deletePhoto', () => {
    const photo = { id: 'photo-id', size: 1234 };

    beforeEach(() => {
      photoRepository.findUniqueOrThrow.mockResolvedValue(photo);
    });

    it('should delete photo, refund quota and notify customer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ photos: [photo] }),
      );

      const result = await service.deletePhoto(
        PHOTOGRAPHER_ID,
        BOOKING_ID,
        'photo-id',
      );

      expect(result).toBe(photo);
      expect(photoRepository.deleteById).toHaveBeenCalledWith('photo-id');
      expect(userService.updatePhotoQuota).toHaveBeenCalledWith(
        PHOTOGRAPHER_ID,
        1234,
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: CUSTOMER_ID,
          referenceType: 'CUSTOMER_BOOKING_PHOTO_REMOVE',
        }),
        { jobId: `remove_photo_${BOOKING_ID}`, delay: 200 },
      );
    });

    it('should throw PhotoNotFoundException without deleting or refunding when photo is not in the booking', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ photos: [{ id: 'another-photo-id', size: 99 }] }),
      );

      await expect(
        service.deletePhoto(PHOTOGRAPHER_ID, BOOKING_ID, 'photo-id'),
      ).rejects.toThrow(PhotoNotFoundException);
      expect(photoRepository.deleteById).not.toHaveBeenCalled();
      expect(userService.updatePhotoQuota).not.toHaveBeenCalled();
      expect(notificationService.addNotificationToQueue).not.toHaveBeenCalled();
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.deletePhoto(PHOTOGRAPHER_ID, BOOKING_ID, 'photo-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.deletePhoto(CUSTOMER_ID, BOOKING_ID, 'photo-id'),
      ).rejects.toThrow(BookingNotBelongException);
    });

    it('should throw when successed booking (no successedAt) was updated recently', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({
          status: 'SUCCESSED',
          successedAt: null,
          updatedAt: new Date(Date.now() - DAY),
        }),
      );

      await expect(
        service.deletePhoto(PHOTOGRAPHER_ID, BOOKING_ID, 'photo-id'),
      ).rejects.toThrow(BookingNotFinishedLongEnoughException);
    });

    it('should allow delete when successed booking (no successedAt) was updated long ago', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({
          status: 'SUCCESSED',
          successedAt: null,
          updatedAt: new Date(Date.now() - 31 * DAY),
          photos: [photo],
        }),
      );

      await expect(
        service.deletePhoto(PHOTOGRAPHER_ID, BOOKING_ID, 'photo-id'),
      ).resolves.toBe(photo);
    });

    it('should throw when booking succeeded recently', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({
          status: 'SUCCESSED',
          successedAt: new Date(Date.now() - DAY),
        }),
      );

      await expect(
        service.deletePhoto(PHOTOGRAPHER_ID, BOOKING_ID, 'photo-id'),
      ).rejects.toThrow(BookingNotFinishedLongEnoughException);
      expect(photoRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should allow delete when booking succeeded more than 30 days ago', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({
          status: 'SUCCESSED',
          successedAt: new Date(Date.now() - 31 * DAY),
          photos: [photo],
        }),
      );

      await expect(
        service.deletePhoto(PHOTOGRAPHER_ID, BOOKING_ID, 'photo-id'),
      ).resolves.toBe(photo);
    });
  });

  describe('filesystemUploadPhoto', () => {
    const uploadDto = {
      file: {
        path: '/tmp/purepixel-local-storage/abc.jpg',
        originalName: 'My Photo',
        size: 2048,
      },
    } as unknown as FileSystemBookngUploadDto;

    const makeSharp = (
      buffer: Buffer,
      metadata: { width?: number; height?: number },
    ) => ({
      toBuffer: jest.fn().mockResolvedValue(buffer),
      metadata: jest.fn().mockResolvedValue(metadata),
    });

    it('should create photo with watermark, notify and enqueue processing', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
      photoProcessService.sharpInitFromFilePath.mockResolvedValue(
        makeSharp(Buffer.from('image'), { width: 100, height: 200 }),
      );
      photoProcessService.makeWatermark.mockResolvedValue({
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('watermark')),
      });
      photoRepository.create.mockResolvedValue({ id: 'photo-id' });

      const result = await service.filesystemUploadPhoto(
        PHOTOGRAPHER_ID,
        BOOKING_ID,
        uploadDto,
      );

      const watermarkPath =
        '/tmp/purepixel-local-storage/My Photo_watermark.jpg';
      expect(photoProcessService.sharpInitFromFilePath).toHaveBeenCalledWith(
        uploadDto.file.path,
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        watermarkPath,
        Buffer.from('watermark'),
      );
      expect(photoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 100,
          height: 200,
          size: 2048,
          title: 'My Photo',
          originalPhotoUrl: uploadDto.file.path,
          watermarkPhotoUrl: watermarkPath,
          booking: { connect: { id: BOOKING_ID } },
        }),
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceType: 'CUSTOMER_BOOKING_PHOTO_ADD',
        }),
        { jobId: `add_photo_${BOOKING_ID}`, delay: 200 },
      );
      expect(photoProcessQueue.add).toHaveBeenCalledWith(
        PhotoConstant.UPLOAD_BOOKING_PHOTO_JOB_NAME,
        {
          photographerId: PHOTOGRAPHER_ID,
          bookingId: BOOKING_ID,
          file: uploadDto.file,
          photoId: 'photo-id',
        },
      );
      expect(result).toEqual({ id: 'photo-id', signed: true });
    });

    it('should skip when temporary file is empty', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
      photoProcessService.sharpInitFromFilePath.mockResolvedValue(
        makeSharp(Buffer.alloc(0), { width: 1, height: 1 }),
      );

      await expect(
        service.filesystemUploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto),
      ).resolves.toBeUndefined();
      expect(photoRepository.create).not.toHaveBeenCalled();
    });

    it('should throw FailToParsePhotoException when width is missing', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
      photoProcessService.sharpInitFromFilePath.mockResolvedValue(
        makeSharp(Buffer.from('image'), { height: 1 }),
      );

      await expect(
        service.filesystemUploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto),
      ).rejects.toThrow(FailToParsePhotoException);
    });

    it('should throw FailToParsePhotoException when height is missing', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
      photoProcessService.sharpInitFromFilePath.mockResolvedValue(
        makeSharp(Buffer.from('image'), { width: 1 }),
      );

      await expect(
        service.filesystemUploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto),
      ).rejects.toThrow(FailToParsePhotoException);
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.filesystemUploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.filesystemUploadPhoto(CUSTOMER_ID, BOOKING_ID, uploadDto),
      ).rejects.toThrow(BookingNotBelongException);
    });

    it.each(['FAILED', 'REQUESTED', 'DENIED'])(
      'should throw when booking status is %s',
      async (status) => {
        bookingRepository.findUniqueOrThrow.mockResolvedValue(
          makeBooking({ status }),
        );

        await expect(
          service.filesystemUploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto),
        ).rejects.toThrow(BookingNotAcceptedException);
      },
    );
  });

  describe('uploadPhoto', () => {
    const uploadDto = {
      file: { buffer: Buffer.from('image') },
    } as unknown as BookingUploadRequestDto;

    beforeEach(() => {
      photoService.uploadBookingPhoto.mockResolvedValue({ id: 'photo-id' });
      photoService.findById.mockResolvedValue({ id: 'photo-id', found: true });
    });

    it('should upload photo with watermark for accepted booking', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      const result = await service.uploadPhoto(
        PHOTOGRAPHER_ID,
        BOOKING_ID,
        uploadDto,
      );

      expect(photoService.uploadBookingPhoto).toHaveBeenCalledWith(
        PHOTOGRAPHER_ID,
        { file: uploadDto.file },
      );
      expect(watermarkService.generateWatermarkFromBuffer).toHaveBeenCalledWith(
        'photo-id',
        { text: 'PXL' },
        uploadDto.file.buffer,
      );
      expect(photoRepository.updateById).toHaveBeenCalledWith('photo-id', {
        watermark: true,
        booking: { connect: { id: BOOKING_ID } },
      });
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceType: 'CUSTOMER_BOOKING_PHOTO_ADD',
        }),
      );
      expect(result).toEqual({ id: 'photo-id', found: true });
    });

    it('should upload photo without watermark for successed booking', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'SUCCESSED' }),
      );

      await service.uploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto);

      expect(photoRepository.updateById).toHaveBeenCalledWith(
        'photo-id',
        expect.objectContaining({ watermark: false }),
      );
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.uploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.uploadPhoto(CUSTOMER_ID, BOOKING_ID, uploadDto),
      ).rejects.toThrow(BookingNotBelongException);
    });

    it.each(['FAILED', 'REQUESTED', 'DENIED'])(
      'should throw when booking status is %s',
      async (status) => {
        bookingRepository.findUniqueOrThrow.mockResolvedValue(
          makeBooking({ status }),
        );

        await expect(
          service.uploadPhoto(PHOTOGRAPHER_ID, BOOKING_ID, uploadDto),
        ).rejects.toThrow(BookingNotAcceptedException);
        expect(photoService.uploadBookingPhoto).not.toHaveBeenCalled();
      },
    );
  });

  describe('accept', () => {
    it('should accept a requested booking', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'REQUESTED' }),
      );
      bookingRepository.updateById.mockResolvedValue({
        id: BOOKING_ID,
        status: 'ACCEPTED',
      });

      const result = await service.accept(BOOKING_ID, PHOTOGRAPHER_ID);

      expect(bookingRepository.updateById).toHaveBeenCalledWith(BOOKING_ID, {
        status: 'ACCEPTED',
      });
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: CUSTOMER_ID,
          referenceType: 'CUSTOMER_BOOKING_ACCEPT',
        }),
      );
      expect(result).toBeInstanceOf(BookingDto);
      expect(result.status).toEqual('ACCEPTED');
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(service.accept(BOOKING_ID, PHOTOGRAPHER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'REQUESTED' }),
      );

      await expect(service.accept(BOOKING_ID, CUSTOMER_ID)).rejects.toThrow(
        BookingNotBelongException,
      );
    });

    it('should throw when booking is not requested', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(service.accept(BOOKING_ID, PHOTOGRAPHER_ID)).rejects.toThrow(
        BookingNotInRequestedStateException,
      );
    });
  });

  describe('deny', () => {
    const denyDto = { reason: 'busy' };

    it('should deny a requested booking', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'REQUESTED' }),
      );
      bookingRepository.updateById.mockResolvedValue({
        id: BOOKING_ID,
        status: 'DENIED',
      });

      const result = await service.deny(BOOKING_ID, PHOTOGRAPHER_ID, denyDto);

      expect(bookingRepository.updateById).toHaveBeenCalledWith(BOOKING_ID, {
        status: 'DENIED',
        failedReason: 'busy',
      });
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({ referenceType: 'CUSTOMER_BOOKING_CANCEL' }),
      );
      expect(result.status).toEqual('DENIED');
    });

    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.deny(BOOKING_ID, PHOTOGRAPHER_ID, denyDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ status: 'REQUESTED' }),
      );

      await expect(
        service.deny(BOOKING_ID, CUSTOMER_ID, denyDto),
      ).rejects.toThrow(BookingNotBelongException);
    });

    it('should throw when booking is not requested', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.deny(BOOKING_ID, PHOTOGRAPHER_ID, denyDto),
      ).rejects.toThrow(BookingNotInRequestedStateException);
    });
  });

  describe('validateStartEndDateOfUser', () => {
    it('should return true for valid dates', () => {
      const start = new Date(Date.now() + 2 * DAY);
      const end = new Date(start.getTime() + 3 * HOUR);

      expect(service.validateStartEndDateOfUser(start, end)).toBe(true);
    });

    it('should throw when start date is less than one day from now', () => {
      const start = new Date(Date.now() + HOUR);
      const end = new Date(start.getTime() + 4 * HOUR);

      expect(() => service.validateStartEndDateOfUser(start, end)).toThrow(
        StartDateMustLargerThanCurrentDateByOneDayException,
      );
    });

    it('should throw when end date is before start date', () => {
      const start = new Date(Date.now() + 2 * DAY);
      const end = new Date(start.getTime() - HOUR);

      expect(() => service.validateStartEndDateOfUser(start, end)).toThrow(
        EndDateMustLargerThanStartDateException,
      );
    });

    it('should throw when duration is less than three hours', () => {
      const start = new Date(Date.now() + 2 * DAY);
      const end = new Date(start.getTime() + 2 * HOUR);

      expect(() => service.validateStartEndDateOfUser(start, end)).toThrow(
        HourBetweenStartAndEndDateMustNotLessThanThreeException,
      );
    });
  });

  describe('validatePreviousBookingOverlap', () => {
    const start = new Date('2030-01-01T00:00:00Z');
    const end = new Date('2030-01-01T05:00:00Z');

    it('should resolve when there is no overlapping booking', async () => {
      await expect(
        service.validatePreviousBookingOverlap(CUSTOMER_ID, start, end),
      ).resolves.toBeUndefined();
      expect(bookingRepository.findFirst).toHaveBeenCalledWith({
        userId: CUSTOMER_ID,
        status: { notIn: ['SUCCESSED', 'FAILED', 'DENIED'] },
        startDate: { lte: end },
        endDate: { gte: start },
      });
    });

    it('should throw when an overlapping booking exists', async () => {
      bookingRepository.findFirst.mockResolvedValue(makeBooking());

      await expect(
        service.validatePreviousBookingOverlap(CUSTOMER_ID, start, end),
      ).rejects.toThrow(ExistBookingWithSelectedDateException);
    });
  });

  describe('requestBooking', () => {
    const photoshootPackage = {
      id: 'package-id',
      userId: PHOTOGRAPHER_ID,
      status: 'ENABLED',
      price: new Decimal(500),
      title: 'package title',
      subtitle: 'subtitle',
      thumbnail: 'thumb',
    };

    const makeRequestDto = (): RequestPhotoshootBookingRequestDto => {
      const startDate = new Date(Date.now() + 2 * DAY);
      return {
        startDate,
        endDate: new Date(startDate.getTime() + 4 * HOUR),
        description: 'please',
      };
    };

    it('should create a booking and notify both parties', async () => {
      photoshootPackageRepository.findUniqueOrThrow.mockResolvedValue(
        photoshootPackage,
      );
      bookingRepository.create.mockResolvedValue({
        id: BOOKING_ID,
        status: 'REQUESTED',
      });
      const requestDto = makeRequestDto();

      const result = await service.requestBooking(
        CUSTOMER_ID,
        'package-id',
        requestDto,
      );

      expect(
        photoshootPackageRepository.findUniqueOrThrow,
      ).toHaveBeenCalledWith('package-id');
      expect(bookingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: requestDto.startDate,
          endDate: requestDto.endDate,
          status: 'REQUESTED',
          description: 'please',
          originalPhotoshootPackage: { connect: { id: 'package-id' } },
          user: { connect: { id: CUSTOMER_ID } },
        }),
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledTimes(
        2,
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: CUSTOMER_ID,
          referenceType: 'CUSTOMER_BOOKING_REQUEST',
        }),
      );
      expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: PHOTOGRAPHER_ID,
          referenceType: 'PHOTOGRAPHER_BOOKING_NEW_REQUEST',
        }),
      );
      expect(result).toBeInstanceOf(BookingDto);
    });

    it('should throw when booking own package', async () => {
      photoshootPackageRepository.findUniqueOrThrow.mockResolvedValue(
        photoshootPackage,
      );

      await expect(
        service.requestBooking(PHOTOGRAPHER_ID, 'package-id', makeRequestDto()),
      ).rejects.toThrow(CannotBookOwnedPhotoshootPackageException);
    });

    it('should throw when package is disabled', async () => {
      photoshootPackageRepository.findUniqueOrThrow.mockResolvedValue({
        ...photoshootPackage,
        status: 'DISABLED',
      });

      await expect(
        service.requestBooking(CUSTOMER_ID, 'package-id', makeRequestDto()),
      ).rejects.toThrow(PhotoshootPackageDisabledException);
    });

    it('should throw when overlapping booking exists', async () => {
      photoshootPackageRepository.findUniqueOrThrow.mockResolvedValue(
        photoshootPackage,
      );
      bookingRepository.findFirst.mockResolvedValue({ id: 'other' });

      await expect(
        service.requestBooking(CUSTOMER_ID, 'package-id', makeRequestDto()),
      ).rejects.toThrow(ExistBookingWithSelectedDateException);
      expect(bookingRepository.create).not.toHaveBeenCalled();
    });
  });
});
