import { StreamableFile } from '@nestjs/common';
import { CustomerBookingController } from './customer-booking.controller';
import { BookingService } from '../services/booking.service';
import { BookingBillItemService } from '../services/bill-item.service';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { RequestPhotoshootBookingRequestDto } from '../dtos/rest/request-photoshoot-booking.request.dto';
import { CreatePhotoshootPackageReviewDto } from 'src/photoshoot-package/dtos/rest/create-photoshoot-package-review.dto';

describe('CustomerBookingController', () => {
  let controller: CustomerBookingController;
  let bookingService: {
    findAllByUserId: jest.Mock;
    compressZip: jest.Mock;
    findById: jest.Mock;
    requestBooking: jest.Mock;
    createReview: jest.Mock;
  };
  let billItemService: { findAll: jest.Mock };

  const user: ParsedUserDto = { sub: 'user-id' };

  beforeEach(() => {
    bookingService = {
      findAllByUserId: jest.fn().mockResolvedValue('find-all-result'),
      compressZip: jest.fn().mockResolvedValue(Buffer.from('zip')),
      findById: jest.fn().mockResolvedValue('find-by-id-result'),
      requestBooking: jest.fn().mockResolvedValue('request-result'),
      createReview: jest.fn().mockResolvedValue('review-result'),
    };
    billItemService = {
      findAll: jest.fn().mockResolvedValue('bill-items-result'),
    };

    controller = new CustomerBookingController(
      bookingService as unknown as BookingService,
      billItemService as unknown as BookingBillItemService,
    );
  });

  it('findAllBooking should delegate to findAllByUserId', async () => {
    const dto = new BookingFindAllRequestDto();

    await expect(controller.findAllBooking(user, dto)).resolves.toEqual(
      'find-all-result',
    );
    expect(bookingService.findAllByUserId).toHaveBeenCalledWith('user-id', dto);
  });

  it('downloadAll should return a zip streamable file', async () => {
    const result = await controller.downloadAll(user, 'booking-id');

    expect(bookingService.compressZip).toHaveBeenCalledWith(
      'user-id',
      'booking-id',
    );
    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getHeaders()).toMatchObject({
      disposition: 'attachment; filename="booking-id.zip"',
      type: 'application/zip',
    });
  });

  it('getBookingId should delegate to findById', async () => {
    await expect(controller.getBookingId(user, 'booking-id')).resolves.toEqual(
      'find-by-id-result',
    );
    expect(bookingService.findById).toHaveBeenCalledWith(
      'user-id',
      'booking-id',
    );
  });

  it('findAllBookingBillItems should delegate to bill item service', async () => {
    const dto = new BookingBillItemFindAllRequestDto();

    await expect(
      controller.findAllBookingBillItems(user, 'booking-id', dto),
    ).resolves.toEqual('bill-items-result');
    expect(billItemService.findAll).toHaveBeenCalledWith(
      'user-id',
      'booking-id',
      dto,
    );
  });

  it('requestBooking should delegate to requestBooking', async () => {
    const dto: RequestPhotoshootBookingRequestDto = {
      startDate: new Date(),
      endDate: new Date(),
      description: 'desc',
    };

    await expect(
      controller.requestBooking(user, 'package-id', dto),
    ).resolves.toEqual('request-result');
    expect(bookingService.requestBooking).toHaveBeenCalledWith(
      'user-id',
      'package-id',
      dto,
    );
  });

  it('createReview should delegate to createReview', async () => {
    const dto: CreatePhotoshootPackageReviewDto = {
      star: 4,
      description: 'nice',
      photoshootPackageId: 'package-id',
      bookingId: 'booking-id',
    };

    await expect(
      controller.createReview(user, 'booking-id', dto),
    ).resolves.toEqual('review-result');
    expect(bookingService.createReview).toHaveBeenCalledWith(
      'user-id',
      'booking-id',
      dto,
    );
  });
});
