import { ManageBookingService } from './manage-booking.service';
import { BookingRepository } from 'src/database/repositories/booking.repository';
import { BookingService } from './booking.service';

describe('ManageBookingService', () => {
  let service: ManageBookingService;
  let bookingRepository: {
    findUniqueOrThrow: jest.Mock;
    updateById: jest.Mock;
  };
  let bookingService: { signBookingDetail: jest.Mock };

  beforeEach(() => {
    bookingRepository = {
      findUniqueOrThrow: jest.fn(),
      updateById: jest.fn(),
    };
    bookingService = { signBookingDetail: jest.fn() };

    service = new ManageBookingService(
      bookingRepository as unknown as BookingRepository,
      bookingService as unknown as BookingService,
    );
  });

  describe('findById', () => {
    it('should find booking and return signed detail', async () => {
      const booking = { id: 'booking-id' };
      const signed = { id: 'booking-id', signed: true };
      bookingRepository.findUniqueOrThrow.mockResolvedValue(booking);
      bookingService.signBookingDetail.mockResolvedValue(signed);

      const result = await service.findById('booking-id');

      expect(bookingRepository.findUniqueOrThrow).toHaveBeenCalledWith({
        id: 'booking-id',
      });
      expect(bookingService.signBookingDetail).toHaveBeenCalledWith(booking);
      expect(result).toBe(signed);
    });

    it('should propagate repository errors', async () => {
      bookingRepository.findUniqueOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.findById('booking-id')).rejects.toThrow('not found');
      expect(bookingService.signBookingDetail).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      const updated = { id: 'booking-id', status: 'FAILED' };
      bookingRepository.updateById.mockResolvedValue(updated);

      const result = await service.updateStatus('booking-id', {
        status: 'FAILED',
      });

      expect(bookingRepository.updateById).toHaveBeenCalledWith('booking-id', {
        status: 'FAILED',
      });
      expect(result).toBe(updated);
    });
  });
});
