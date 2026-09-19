import { PhotoTagRepository } from 'src/database/repositories/photo-tag.repository';
import { PhotoTagService } from './photo-tag.service';

describe('PhotoTagService', () => {
  let photoTagRepository: jest.Mocked<Pick<PhotoTagRepository, 'groupBy'>>;
  let service: PhotoTagService;

  beforeEach(() => {
    photoTagRepository = {
      groupBy: jest.fn(),
    };

    service = new PhotoTagService(
      photoTagRepository as unknown as PhotoTagRepository,
    );
  });

  it('should return grouped top tags from repository', async () => {
    const tags = [{ name: 'sunset', _count: { name: 3 } }];
    photoTagRepository.groupBy.mockResolvedValue(tags as never);

    const result = await service.getTop(5);

    expect(photoTagRepository.groupBy).toHaveBeenCalledWith(5);
    expect(result).toBe(tags);
  });

  it('should propagate repository errors', async () => {
    photoTagRepository.groupBy.mockRejectedValue(new Error('db down'));

    await expect(service.getTop(1)).rejects.toThrow('db down');
  });
});
