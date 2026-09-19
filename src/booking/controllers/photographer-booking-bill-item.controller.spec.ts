import { PhotographerBookingBillItemController } from './photographer-booking-bill-item.controller';
import { BookingBillItemService } from '../services/bill-item.service';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BookingBillItemFindAllRequestDto } from '../dtos/rest/booking-bill-item-find-all.request.dto';
import { BookingBillItemCreateDto } from '../dtos/booking-bill-item.create.dto';
import { BookingBillItemUpdateDto } from '../dtos/booking-bill-item.update.dto';

describe('PhotographerBookingBillItemController', () => {
  let controller: PhotographerBookingBillItemController;
  let billItemService: {
    findAll: jest.Mock;
    createBillItem: jest.Mock;
    updateBillItem: jest.Mock;
    deleteBillItem: jest.Mock;
  };

  const user: ParsedUserDto = { sub: 'photographer-id' };
  const billItemDto: BookingBillItemCreateDto = {
    title: 'extra',
    description: 'extra',
    price: 1000,
    type: 'DECREASE',
  };

  beforeEach(() => {
    billItemService = {
      findAll: jest.fn().mockResolvedValue('find-all'),
      createBillItem: jest.fn().mockResolvedValue('created'),
      updateBillItem: jest.fn().mockResolvedValue('updated'),
      deleteBillItem: jest.fn().mockResolvedValue('deleted'),
    };

    controller = new PhotographerBookingBillItemController(
      billItemService as unknown as BookingBillItemService,
    );
  });

  it('findAllBookingBillItems should delegate to findAll', async () => {
    const dto = new BookingBillItemFindAllRequestDto();

    await expect(
      controller.findAllBookingBillItems(user, 'booking-id', dto),
    ).resolves.toEqual('find-all');
    expect(billItemService.findAll).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      dto,
    );
  });

  it('createBillItem should delegate to createBillItem', async () => {
    await expect(
      controller.createBillItem(user, 'booking-id', billItemDto),
    ).resolves.toEqual('created');
    expect(billItemService.createBillItem).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      billItemDto,
    );
  });

  it('updateBillItem should delegate to updateBillItem', async () => {
    const updateDto = billItemDto as BookingBillItemUpdateDto;

    await expect(
      controller.updateBillItem(user, 'booking-id', 'bill-item-id', updateDto),
    ).resolves.toEqual('updated');
    expect(billItemService.updateBillItem).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      'bill-item-id',
      updateDto,
    );
  });

  it('deleteBillItem should delegate to deleteBillItem', async () => {
    await expect(
      controller.deleteBillItem(user, 'booking-id', 'bill-item-id'),
    ).resolves.toEqual('deleted');
    expect(billItemService.deleteBillItem).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      'bill-item-id',
    );
  });
});
