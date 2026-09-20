import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';
import { PhotoProcessService } from './photo-process.service';
import { PhotoValidateService } from './photo-validate.service';

type Hashes = Awaited<ReturnType<PhotoRepository['findAllHash']>>;

describe('PhotoValidateService', () => {
  let photoProcessService: jest.Mocked<
    Pick<PhotoProcessService, 'getHashFromBuffer' | 'isExistHash'>
  >;
  let photoRepository: jest.Mocked<Pick<PhotoRepository, 'findAllHash'>>;
  let service: PhotoValidateService;

  const buffer = Buffer.from('image');

  beforeEach(() => {
    photoProcessService = {
      getHashFromBuffer: jest.fn().mockResolvedValue('hash'),
      isExistHash: jest.fn().mockReturnValue(false),
    };
    photoRepository = {
      findAllHash: jest.fn().mockResolvedValue([
        { id: 'p1', hash: 'h1' },
        { id: 'p2', hash: 'h2' },
      ] as Hashes),
    };

    service = new PhotoValidateService(
      photoProcessService as unknown as PhotoProcessService,
      photoRepository as unknown as PhotoRepository,
    );
  });

  it('throws when the hash matches a previous photo', async () => {
    photoProcessService.isExistHash.mockReturnValue(true);

    await expect(service.validateHash(buffer)).rejects.toBeInstanceOf(
      FailToPerformOnDuplicatedPhotoException,
    );
    expect(photoProcessService.isExistHash).toHaveBeenCalledWith('hash', [
      'h1',
      'h2',
    ]);
  });

  it('passes when no previous photo has a close hash', async () => {
    await expect(service.validateHash(buffer)).resolves.toBeUndefined();
    expect(photoProcessService.getHashFromBuffer).toHaveBeenCalledWith(buffer);
  });
});
