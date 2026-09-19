import { PhotoTagService } from '../services/photo-tag.service';
import { PhotoTagGetTopDto } from '../dtos/rest/photo-tag-get-top.request.dto';
import { PhotoTagController } from './photo-tag.controller';

describe('PhotoTagController', () => {
  let photoTagService: jest.Mocked<Pick<PhotoTagService, 'getTop'>>;
  let controller: PhotoTagController;

  beforeEach(() => {
    photoTagService = {
      getTop: jest.fn(),
    };

    controller = new PhotoTagController(
      photoTagService as unknown as PhotoTagService,
    );
  });

  it('should delegate to service with requested top count', async () => {
    const tags = [{ name: 'city', _count: { name: 10 } }];
    photoTagService.getTop.mockResolvedValue(tags as never);

    const dto = Object.assign(new PhotoTagGetTopDto(), { top: 7 });

    await expect(controller.getTopTags(dto)).resolves.toBe(tags);
    expect(photoTagService.getTop).toHaveBeenCalledWith(7);
  });
});
