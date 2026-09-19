import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { BookingBillItemService } from './bill-item.service';
import { BookingBillItemRepository } from 'src/database/repositories/booking-bill-item.repository';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { NotificationService } from 'src/notification/services/notification.service';
import { BookingNotBelongException } from '../exceptions/booking-not-belong.exception';
import { BookingNotInValidStateException } from '../exceptions/booking-not-in-valid-state.exception';
import { BookingBillItemDto } from '../dtos/booking-bill-item.dto';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItemFindAllResponseDto } from '../dtos/rest/booking-bill-item-find-all.response.dto';
import { BookingBillItemCreateDto } from '../dtos/booking-bill-item.create.dto';
import { BookingBillItemUpdateDto } from '../dtos/booking-bill-item.update.dto';

const PHOTOGRAPHER_ID = 'photographer-id';
const CUSTOMER_ID = 'customer-id';
const BOOKING_ID = 'booking-id';
const BILL_ITEM_ID = 'bill-item-id';

const makeBooking = (overrides: Record<string, unknown> = {}) => ({
  id: BOOKING_ID,
  userId: CUSTOMER_ID,
  status: 'ACCEPTED',
  originalPhotoshootPackage: {
    id: 'package-id',
    userId: PHOTOGRAPHER_ID,
  },
  photoshootPackageHistory: {
    title: 'package title',
  },
  ...overrides,
});

describe('BookingBillItemService', () => {
  let service: BookingBillItemService;
  let billItemRepository: {
    updateById: jest.Mock;
    deleteById: jest.Mock;
    create: jest.Mock;
    aggregate: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
  };
  let bookingRepository: { findUniqueOrThrow: jest.Mock };
  let notificationService: { addNotificationToQueue: jest.Mock };

  beforeEach(() => {
    billItemRepository = {
      updateById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    };
    bookingRepository = { findUniqueOrThrow: jest.fn() };
    notificationService = {
      addNotificationToQueue: jest.fn().mockResolvedValue(undefined),
    };

    service = new BookingBillItemService(
      billItemRepository as unknown as BookingBillItemRepository,
      bookingRepository as unknown as BookingRepository,
      notificationService as unknown as NotificationService,
    );
  });

  const billItemDto: BookingBillItemCreateDto = {
    title: 'extra',
    description: 'extra hour',
    price: 2000,
    type: 'INCREASE',
  };

  type Operation = {
    name: string;
    run: () => Promise<unknown>;
    runAs: (userId: string) => Promise<unknown>;
    repositoryMock: () => jest.Mock;
  };

  const operations: Operation[] = [
    {
      name: 'updateBillItem',
      run: () =>
        service.updateBillItem(
          PHOTOGRAPHER_ID,
          BOOKING_ID,
          BILL_ITEM_ID,
          billItemDto as BookingBillItemUpdateDto,
        ),
      runAs: (userId) =>
        service.updateBillItem(
          userId,
          BOOKING_ID,
          BILL_ITEM_ID,
          billItemDto as BookingBillItemUpdateDto,
        ),
      repositoryMock: () => billItemRepository.updateById,
    },
    {
      name: 'deleteBillItem',
      run: () =>
        service.deleteBillItem(PHOTOGRAPHER_ID, BOOKING_ID, BILL_ITEM_ID),
      runAs: (userId) =>
        service.deleteBillItem(userId, BOOKING_ID, BILL_ITEM_ID),
      repositoryMock: () => billItemRepository.deleteById,
    },
    {
      name: 'createBillItem',
      run: () =>
        service.createBillItem(PHOTOGRAPHER_ID, BOOKING_ID, billItemDto),
      runAs: (userId) =>
        service.createBillItem(userId, BOOKING_ID, billItemDto),
      repositoryMock: () => billItemRepository.create,
    },
  ];

  describe.each(operations)('$name', (operation) => {
    it('should throw when original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(operation.run()).rejects.toThrow(
        new NotFoundException('OriginalPhotoshootPackageNotFound'),
      );
      expect(operation.repositoryMock()).not.toHaveBeenCalled();
    });

    it('should throw when user is not the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(operation.runAs(CUSTOMER_ID)).rejects.toThrow(
        BookingNotBelongException,
      );
    });

    it.each(['SUCCESSED', 'FAILED', 'DENIED'])(
      'should throw when booking status is %s',
      async (status) => {
        bookingRepository.findUniqueOrThrow.mockResolvedValue(
          makeBooking({ status }),
        );

        await expect(operation.run()).rejects.toThrow(
          BookingNotInValidStateException,
        );
        expect(operation.repositoryMock()).not.toHaveBeenCalled();
      },
    );

    it.each(['REQUESTED', 'ACCEPTED'])(
      'should succeed when booking status is %s',
      async (status) => {
        bookingRepository.findUniqueOrThrow.mockResolvedValue(
          makeBooking({ status }),
        );
        operation.repositoryMock().mockResolvedValue({
          id: BILL_ITEM_ID,
          title: 'extra',
          bookingId: BOOKING_ID,
        });

        const result = await operation.run();

        expect(bookingRepository.findUniqueOrThrow).toHaveBeenCalledWith({
          id: BOOKING_ID,
        });
        expect(result).toBeInstanceOf(BookingBillItemDto);
        expect(result).toMatchObject({ id: BILL_ITEM_ID, title: 'extra' });
        expect(notificationService.addNotificationToQueue).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: CUSTOMER_ID,
            referenceType: 'CUSTOMER_BOOKING_BILL_UPDATE',
            payload: { id: BOOKING_ID },
          }),
        );
      },
    );
  });

  it('updateBillItem should pass bill item id and dto to repository', async () => {
    bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
    billItemRepository.updateById.mockResolvedValue({ id: BILL_ITEM_ID });

    await operations[0].run();

    expect(billItemRepository.updateById).toHaveBeenCalledWith(
      BILL_ITEM_ID,
      billItemDto,
    );
  });

  it('deleteBillItem should pass booking id and bill item id to repository', async () => {
    bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
    billItemRepository.deleteById.mockResolvedValue({ id: BILL_ITEM_ID });

    await operations[1].run();

    expect(billItemRepository.deleteById).toHaveBeenCalledWith(
      BOOKING_ID,
      BILL_ITEM_ID,
    );
  });

  it('createBillItem should connect the bill item to the booking', async () => {
    bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
    billItemRepository.create.mockResolvedValue({ id: BILL_ITEM_ID });

    await operations[2].run();

    expect(billItemRepository.create).toHaveBeenCalledWith({
      ...billItemDto,
      booking: { connect: { id: BOOKING_ID } },
    });
  });

  describe('sumBookingBill', () => {
    it('should subtract decreases from increases', async () => {
      billItemRepository.aggregate
        .mockResolvedValueOnce({ _sum: { price: new Decimal(1000) } })
        .mockResolvedValueOnce({ _sum: { price: new Decimal(250) } });

      const total = await service.sumBookingBill(BOOKING_ID);

      expect(total.toNumber()).toEqual(750);
      expect(billItemRepository.aggregate).toHaveBeenNthCalledWith(1, {
        where: { bookingId: BOOKING_ID, type: 'INCREASE' },
        _sum: { price: true },
      });
      expect(billItemRepository.aggregate).toHaveBeenNthCalledWith(2, {
        where: { bookingId: BOOKING_ID, type: 'DECREASE' },
        _sum: { price: true },
      });
    });

    it('should return zero when there are no bill items', async () => {
      billItemRepository.aggregate.mockResolvedValue({ _sum: { price: null } });

      const total = await service.sumBookingBill(BOOKING_ID);

      expect(total.toNumber()).toEqual(0);
    });
  });

  describe('findAll', () => {
    const makeFindAllDto = () =>
      Object.assign(new BookingBillItemFindAllRequestDto(), {
        limit: 10,
        page: 0,
      });

    const arrangeList = () => {
      billItemRepository.count.mockResolvedValue(2);
      billItemRepository.findMany.mockResolvedValue([
        { id: 'b1', bookingId: BOOKING_ID },
        { id: 'b2', bookingId: BOOKING_ID },
      ]);
      billItemRepository.aggregate
        .mockResolvedValueOnce({ _sum: { price: new Decimal(500) } })
        .mockResolvedValueOnce({ _sum: { price: null } });
    };

    it('should return bill items for the customer without checking package', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );
      arrangeList();
      const dto = makeFindAllDto();

      const result = await service.findAll(CUSTOMER_ID, BOOKING_ID, dto);

      expect(dto.bookingId).toEqual(BOOKING_ID);
      expect(billItemRepository.count).toHaveBeenCalledWith({
        bookingId: BOOKING_ID,
      });
      expect(billItemRepository.findMany).toHaveBeenCalledWith(0, 10, {
        bookingId: BOOKING_ID,
      });
      expect(result).toBeInstanceOf(BookingBillItemFindAllResponseDto);
      expect(result.totalAmount).toEqual(500);
      expect(result.totalRecord).toEqual(2);
      expect(result.totalPage).toEqual(1);
      expect(result.objects).toHaveLength(2);
      expect(result.objects[0]).toBeInstanceOf(BookingBillItemDto);
    });

    it('should return bill items for the photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());
      arrangeList();

      const result = await service.findAll(
        PHOTOGRAPHER_ID,
        BOOKING_ID,
        makeFindAllDto(),
      );

      expect(result.objects).toHaveLength(2);
    });

    it('should throw when user is not customer and original package is null', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(
        makeBooking({ originalPhotoshootPackage: null }),
      );

      await expect(
        service.findAll(PHOTOGRAPHER_ID, BOOKING_ID, makeFindAllDto()),
      ).rejects.toThrow(NotFoundException);
      expect(billItemRepository.count).not.toHaveBeenCalled();
    });

    it('should throw when user is neither customer nor photographer', async () => {
      bookingRepository.findUniqueOrThrow.mockResolvedValue(makeBooking());

      await expect(
        service.findAll('stranger', BOOKING_ID, makeFindAllDto()),
      ).rejects.toThrow(BookingNotBelongException);
    });
  });
});
