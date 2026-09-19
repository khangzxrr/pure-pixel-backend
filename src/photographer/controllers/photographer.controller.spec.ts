import { FindAllPhotoFilterDto } from 'src/photo/dtos/find-all.filter.dto';
import { ParsedUserDto } from 'src/user/dtos/parsed-user.dto';
import { FindAllPhotographerRequestDto } from '../dtos/find-all-photographer-dtos/find-all-photographer.request.dto';
import { PhotographerService } from '../services/photographer.service';
import { PhotographerController } from './photographer.controller';

describe('PhotographerController', () => {
  const user = { sub: 'me' };
  const anonymous = undefined as unknown as ParsedUserDto;
  let photographerService: {
    getAllPhotographer: jest.Mock;
    getPhotographerProfileById: jest.Mock;
    getPhotosOfMe: jest.Mock;
  };
  let controller: PhotographerController;

  beforeEach(() => {
    photographerService = {
      getAllPhotographer: jest.fn().mockResolvedValue('all'),
      getPhotographerProfileById: jest.fn().mockResolvedValue('profile'),
      getPhotosOfMe: jest.fn().mockResolvedValue('photos'),
    };
    controller = new PhotographerController(
      photographerService as unknown as PhotographerService,
    );
  });

  describe('findAllPhotographers', () => {
    const dto = new FindAllPhotographerRequestDto();

    it('passes the logged user id', async () => {
      await expect(controller.findAllPhotographers(user, dto)).resolves.toBe(
        'all',
      );
      expect(photographerService.getAllPhotographer).toHaveBeenCalledWith(
        'me',
        dto,
      );
    });

    it('passes an empty user id for anonymous requests', async () => {
      await controller.findAllPhotographers(anonymous, dto);

      expect(photographerService.getAllPhotographer).toHaveBeenCalledWith(
        '',
        dto,
      );
    });
  });

  describe('getPhotographerProfile', () => {
    it('passes the logged user id', async () => {
      await expect(controller.getPhotographerProfile(user, 'p1')).resolves.toBe(
        'profile',
      );
      expect(
        photographerService.getPhotographerProfileById,
      ).toHaveBeenCalledWith('me', 'p1');
    });

    it('passes an empty user id for anonymous requests', async () => {
      await controller.getPhotographerProfile(anonymous, 'p1');

      expect(
        photographerService.getPhotographerProfileById,
      ).toHaveBeenCalledWith('', 'p1');
    });
  });

  it('getPhotoOfMine lists photos of the logged user', async () => {
    const filter = new FindAllPhotoFilterDto();

    await expect(controller.getPhotoOfMine(user, filter)).resolves.toBe(
      'photos',
    );
    expect(photographerService.getPhotosOfMe).toHaveBeenCalledWith(
      'me',
      filter,
    );
  });
});
