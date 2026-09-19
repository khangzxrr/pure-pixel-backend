import { PhotographerBookingController } from './photographer-booking.controller';
import { BookingService } from '../services/booking.service';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { BookingFindAllRequestDto } from '../dtos/rest/booking-find-all.request.dto';
import { FileSystemBookngUploadDto } from '../dtos/rest/file-system-booking-upload.request.dto';
import { BookingUploadRequestDto } from '../dtos/rest/booking-upload.request.dto';

describe('PhotographerBookingController', () => {
  let controller: PhotographerBookingController;
  let bookingService: {
    findAllByPhotographerId: jest.Mock;
    findById: jest.Mock;
    filesystemUploadPhoto: jest.Mock;
    uploadPhoto: jest.Mock;
    deletePhoto: jest.Mock;
    accept: jest.Mock;
    deny: jest.Mock;
    updateById: jest.Mock;
    updateBookingToPaid: jest.Mock;
  };

  const user: ParsedUserDto = { sub: 'photographer-id' };

  beforeEach(() => {
    bookingService = {
      findAllByPhotographerId: jest.fn().mockResolvedValue('find-all'),
      findById: jest.fn().mockResolvedValue('detail'),
      filesystemUploadPhoto: jest.fn().mockResolvedValue('fs-upload'),
      uploadPhoto: jest.fn().mockResolvedValue('upload'),
      deletePhoto: jest.fn().mockResolvedValue('delete-photo'),
      accept: jest.fn().mockResolvedValue('accepted'),
      deny: jest.fn().mockResolvedValue('denied'),
      updateById: jest.fn().mockResolvedValue('updated'),
      updateBookingToPaid: jest.fn().mockResolvedValue('paid'),
    };

    controller = new PhotographerBookingController(
      bookingService as unknown as BookingService,
    );
  });

  it('findAllBooking should delegate to findAllByPhotographerId', async () => {
    const dto = new BookingFindAllRequestDto();

    await expect(controller.findAllBooking(user, dto)).resolves.toEqual(
      'find-all',
    );
    expect(bookingService.findAllByPhotographerId).toHaveBeenCalledWith(
      'photographer-id',
      dto,
    );
  });

  it('getBookingDetail should delegate to findById', async () => {
    await expect(
      controller.getBookingDetail(user, 'booking-id'),
    ).resolves.toEqual('detail');
    expect(bookingService.findById).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
    );
  });

  it('filesystemUpload should delegate to filesystemUploadPhoto', async () => {
    const dto = { file: {} } as unknown as FileSystemBookngUploadDto;

    await expect(
      controller.filesystemUpload(user, 'booking-id', dto),
    ).resolves.toEqual('fs-upload');
    expect(bookingService.filesystemUploadPhoto).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      dto,
    );
  });

  it('uploadPhoto should delegate to uploadPhoto', async () => {
    const dto = { file: {} } as unknown as BookingUploadRequestDto;

    await expect(
      controller.uploadPhoto(user, 'booking-id', dto),
    ).resolves.toEqual('upload');
    expect(bookingService.uploadPhoto).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      dto,
    );
  });

  it('deletePhotoBooking should delegate to deletePhoto', async () => {
    await expect(
      controller.deletePhotoBooking(user, 'booking-id', 'photo-id'),
    ).resolves.toEqual('delete-photo');
    expect(bookingService.deletePhoto).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      'photo-id',
    );
  });

  it('acceptBooking should delegate to accept', async () => {
    await expect(controller.acceptBooking(user, 'booking-id')).resolves.toEqual(
      'accepted',
    );
    expect(bookingService.accept).toHaveBeenCalledWith(
      'booking-id',
      'photographer-id',
    );
  });

  it('denyBooking should delegate to deny', async () => {
    const dto = { reason: 'busy' };

    await expect(
      controller.denyBooking(user, 'booking-id', dto),
    ).resolves.toEqual('denied');
    expect(bookingService.deny).toHaveBeenCalledWith(
      'booking-id',
      'photographer-id',
      dto,
    );
  });

  it('updateBooking should delegate to updateById', async () => {
    const dto = { description: 'note' };

    await expect(
      controller.updateBooking(user, 'booking-id', dto),
    ).resolves.toEqual('updated');
    expect(bookingService.updateById).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
      dto,
    );
  });

  it('paidBooking should delegate to updateBookingToPaid', async () => {
    await expect(controller.paidBooking(user, 'booking-id')).resolves.toEqual(
      'paid',
    );
    expect(bookingService.updateBookingToPaid).toHaveBeenCalledWith(
      'photographer-id',
      'booking-id',
    );
  });
});
