import { ManagerBookingController } from './manager-booking.controller';
import { ManageBookingService } from '../services/manage-booking.service';

describe('ManagerBookingController', () => {
  let controller: ManagerBookingController;
  let manageBookingService: { findById: jest.Mock; updateStatus: jest.Mock };

  beforeEach(() => {
    manageBookingService = {
      findById: jest.fn().mockResolvedValue('detail'),
      updateStatus: jest.fn().mockResolvedValue('updated'),
    };

    controller = new ManagerBookingController(
      manageBookingService as unknown as ManageBookingService,
    );
  });

  it('getBookingDetail should delegate to findById', async () => {
    await expect(controller.getBookingDetail('booking-id')).resolves.toEqual(
      'detail',
    );
    expect(manageBookingService.findById).toHaveBeenCalledWith('booking-id');
  });

  it('updateBooking should delegate to updateStatus', async () => {
    const dto = { status: 'SUCCESSED' as const };

    await expect(controller.updateBooking('booking-id', dto)).resolves.toEqual(
      'updated',
    );
    expect(manageBookingService.updateStatus).toHaveBeenCalledWith(
      'booking-id',
      dto,
    );
  });
});
