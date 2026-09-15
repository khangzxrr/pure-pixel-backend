import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { TineyeService } from 'src/storage/services/tineye.service';
import { PhotoConstant } from '../constants/photo.constant';
import { FailToPerformOnDuplicatedPhotoException } from '../exceptions/fail-to-perform-on-duplicated-photo.exception';
import { PhotoProcessService } from './photo-process.service';
import { PhotoValidateService } from './photo-validate.service';

type SearchResponse = Awaited<ReturnType<TineyeService['searchByBuffer']>>;
type Hashes = Awaited<ReturnType<PhotoRepository['findAllHash']>>;
type SharpInstance = Awaited<
  ReturnType<PhotoProcessService['sharpInitFromBuffer']>
>;

describe('PhotoValidateService', () => {
  let tineyeService: jest.Mocked<Pick<TineyeService, 'searchByBuffer'>>;
  let photoProcessService: jest.Mocked<
    Pick<
      PhotoProcessService,
      'getHashFromBuffer' | 'isExistHash' | 'sharpInitFromBuffer' | 'resize'
    >
  >;
  let photoRepository: jest.Mocked<Pick<PhotoRepository, 'findAllHash'>>;
  let service: PhotoValidateService;

  const buffer = Buffer.from('image');
  const sharp = {} as SharpInstance;
  const resized = Buffer.from('resized');

  const searchResponse = (result: unknown) =>
    ({ data: { result } }) as unknown as SearchResponse;

  beforeEach(() => {
    tineyeService = {
      searchByBuffer: jest.fn().mockResolvedValue(searchResponse([])),
    };
    photoProcessService = {
      getHashFromBuffer: jest.fn().mockResolvedValue('hash'),
      isExistHash: jest.fn().mockReturnValue(false),
      sharpInitFromBuffer: jest.fn().mockResolvedValue(sharp),
      resize: jest.fn().mockResolvedValue(resized),
    };
    photoRepository = {
      findAllHash: jest.fn().mockResolvedValue([
        { id: 'p1', hash: 'h1' },
        { id: 'p2', hash: 'h2' },
      ] as Hashes),
    };

    service = new PhotoValidateService(
      tineyeService as unknown as TineyeService,
      photoProcessService as unknown as PhotoProcessService,
      photoRepository as unknown as PhotoRepository,
    );
  });

  it('throws when the hash matches a previous photo', async () => {
    photoProcessService.isExistHash.mockReturnValue(true);

    await expect(
      service.validateHashAndMatching(buffer, 'a.jpg'),
    ).rejects.toBeInstanceOf(FailToPerformOnDuplicatedPhotoException);
    expect(photoProcessService.isExistHash).toHaveBeenCalledWith('hash', [
      'h1',
      'h2',
    ]);
    expect(tineyeService.searchByBuffer).not.toHaveBeenCalled();
  });

  it('throws when tineye finds a match with at least 40 percent', async () => {
    tineyeService.searchByBuffer.mockResolvedValue(
      searchResponse([{ match_percent: 40 }]),
    );

    await expect(
      service.validateHashAndMatching(buffer, 'a.jpg'),
    ).rejects.toBeInstanceOf(FailToPerformOnDuplicatedPhotoException);
    expect(photoProcessService.resize).toHaveBeenCalledWith(
      sharp,
      PhotoConstant.TINEYE_MIN_PHOTO_WIDTH,
    );
    expect(tineyeService.searchByBuffer).toHaveBeenCalledWith(resized, 'a.jpg');
  });

  it('passes when tineye match is below 40 percent', async () => {
    tineyeService.searchByBuffer.mockResolvedValue(
      searchResponse([{ match_percent: 39 }]),
    );

    await expect(
      service.validateHashAndMatching(buffer, 'a.jpg'),
    ).resolves.toBeUndefined();
  });

  it('passes when tineye result is empty', async () => {
    await expect(
      service.validateHashAndMatching(buffer, 'a.jpg'),
    ).resolves.toBeUndefined();
  });

  it('passes when tineye returns no result', async () => {
    tineyeService.searchByBuffer.mockResolvedValue(searchResponse(undefined));

    await expect(
      service.validateHashAndMatching(buffer, 'a.jpg'),
    ).resolves.toBeUndefined();
  });
});
