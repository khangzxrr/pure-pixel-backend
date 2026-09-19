import { FindAllPhotoFilterDto } from '../dtos/find-all.filter.dto';
import { PhotoUpdateRequestDto } from '../dtos/rest/photo-update.request.dto';
import { ManagePhotoService } from '../services/manage-photo.service';
import { ManagePhotoController } from './manage-photo.controller';

describe('ManagePhotoController', () => {
  let managePhotoService: Record<
    'findAll' | 'findById' | 'update' | 'delete' | 'ban' | 'unban',
    jest.Mock
  >;
  let controller: ManagePhotoController;

  beforeEach(() => {
    managePhotoService = {
      findAll: jest.fn().mockResolvedValue('all'),
      findById: jest.fn().mockResolvedValue('one'),
      update: jest.fn().mockResolvedValue('updated'),
      delete: jest.fn().mockResolvedValue('deleted'),
      ban: jest.fn().mockResolvedValue(true),
      unban: jest.fn().mockResolvedValue(true),
    };
    controller = new ManagePhotoController(
      managePhotoService as unknown as ManagePhotoService,
    );
  });

  it('finds all photos', async () => {
    const dto = new FindAllPhotoFilterDto();

    await expect(controller.findAllPhotos(dto)).resolves.toBe('all');
    expect(managePhotoService.findAll).toHaveBeenCalledWith(dto);
  });

  it('finds a photo by id', async () => {
    await expect(controller.findPhotoById('p1')).resolves.toBe('one');
    expect(managePhotoService.findById).toHaveBeenCalledWith('p1');
  });

  it('updates a photo', async () => {
    const dto: PhotoUpdateRequestDto = { title: 't' };

    await expect(controller.updatePhoto('p1', dto)).resolves.toBe('updated');
    expect(managePhotoService.update).toHaveBeenCalledWith('p1', dto);
  });

  it('deletes a photo', async () => {
    await expect(controller.deletePhoto('p1')).resolves.toBe('deleted');
    expect(managePhotoService.delete).toHaveBeenCalledWith('p1');
  });

  it('bans a photo', async () => {
    await expect(controller.banPhoto('p1')).resolves.toBe(true);
    expect(managePhotoService.ban).toHaveBeenCalledWith('p1');
  });

  it('unbans a photo', async () => {
    await expect(controller.unbanPhoto('p1')).resolves.toBe(true);
    expect(managePhotoService.unban).toHaveBeenCalledWith('p1');
  });
});
