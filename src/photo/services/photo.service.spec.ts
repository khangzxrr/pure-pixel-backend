import { Test } from '@nestjs/testing';
import { PhotoService } from './photo.service';
import { StorageModule } from 'src/storage/storage.module';
import { QueueModule } from 'src/queue/queue.module';
import { PresignedUploadUrlRequest } from '../dtos/presigned-upload-url.request';
import { FileIsNotValidException } from '../exceptions/file-is-not-valid.exception';
import { PhotoRepository } from 'src/database/repositories/photo.repository';
import { SignedUpload } from '../dtos/presigned-upload-url.response.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { PhotographerNotFoundException } from 'src/photographer/exceptions/photographer-not-found.exception';
import { RunOutPhotoQuotaException } from '../exceptions/run-out-photo-quota.exception';
import { DatabaseModule } from 'src/database/database.module';
import { ShareStatusIsNotReadyException } from '../exceptions/share-status-is-not-ready.exception';
import { PhotoNotFoundException } from '../exceptions/photo-not-found.exception';
import { NotBelongPhotoException } from '../exceptions/not-belong-photo.exception';
import { PhotoProcessService } from './photo-process.service';
import { HttpModule } from '@nestjs/axios';
import { ShareStatus } from '@prisma/client';
import { SharePhotoRequestDto } from '../dtos/share-photo.request.dto';
import { JsonObject } from '@prisma/client/runtime/library';
import { ChoosedShareQualityIsNotFoundException } from '../exceptions/choosed-share-quality-is-not-found.exception';
import { SharePhotoUrlIsEmptyException } from '../exceptions/share-photo-url-is-empty.exception';

describe('PhotoService', () => {
  interface PhotoType {
    id?: string;
    photographerId?: string;
    originalPhotoUrl?: string;
    shareStatus?: ShareStatus;
    sharePayload?: JsonObject;
    currentSharePhotoUrl?: string;
  }

  let photoService: PhotoService;
  const photoRepository = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getPhotoDetailById: (id: string): Promise<PhotoType> =>
      Promise.resolve(null),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getPhotoById: (id: string): Promise<PhotoType> => Promise.resolve(null), //lazy mock, write full object if required
    createTemporaryPhotos: (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      userId: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      signedUpload: SignedUpload,
    ): Promise<PhotoType> => Promise.resolve(null),
  };

  const userRepository = {
    findUserQuotaById: () => {
      return Promise.resolve({
        maxPhotoQuota: 0,
        maxBookingPhotoQuota: 0,
        maxBookingVideoQuota: 0,
        maxPackageCount: 0,
      });
    },
  };

  const photoProcessService = {
    getSignedObjectUrl: (key: string): Promise<string> => Promise.resolve(key),
    getPresignUploadUrl: (key: string): Promise<string> => Promise.resolve(key),
  };

  const userId = '6db1c6a1-f4ab-4ecb-a489-9285ebb53135';
  const presignedUploadUrlRequest = new PresignedUploadUrlRequest();

  const photo: PhotoType = {
    id: '3cb95f2e-4164-47ec-84ef-418c247c1963',
    photographerId: 'd682487e-e941-48e8-b7e8-e96f2a4674f9',
    originalPhotoUrl: 'https://example.com',
    shareStatus: ShareStatus.NOT_READY,
    sharePayload: {},
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        StorageModule,
        QueueModule,
        HttpModule.register({
          timeout: 30000,
          maxRedirects: 10,
        }),
      ],
      providers: [
        PhotoService,
        {
          provide: PhotoRepository,
          useValue: photoRepository,
        },
        {
          provide: UserRepository,
          useValue: userRepository,
        },
        {
          provide: PhotoProcessService,
          useValue: photoProcessService,
        },
      ],
    }).compile();

    photoService = moduleRef.get<PhotoService>(PhotoService);
  });

  it('should define service', async () => {
    expect(photoService).toBeDefined();
  });

  describe('findAndValidatePhotoIsNotFoundAndBelongToPhotographer', () => {
    it(`it should throw ${PhotoNotFoundException.name} when photo is null`, () => {
      jest
        .spyOn(photoRepository, 'getPhotoById')
        .mockReturnValue(Promise.resolve(null));

      expect(async () => {
        const photo =
          await photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
            userId,
            'randomIdWithoutKnowledge',
          );

        return photo;
      }).rejects.toThrow(PhotoNotFoundException);
    });
    it(`it should throw ${NotBelongPhotoException.name} when photographerId != userId`, () => {
      photo.photographerId = 'random_string_photographer_id';
      jest
        .spyOn(photoRepository, 'getPhotoById')
        .mockReturnValue(Promise.resolve(photo));

      expect(
        async () =>
          await photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
            userId,
            'photoId',
          ),
      ).rejects.toThrow(NotBelongPhotoException);
    });
    it(`it should return photo when photo is found and belong to photographer`, async () => {
      const photoId = '8fec219d-d840-41f4-8ead-ff84526c2ee0';

      photo.id = photoId;
      photo.photographerId = userId;

      jest
        .spyOn(photoRepository, 'getPhotoById')
        .mockReturnValue(Promise.resolve(photo));

      const result =
        await photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
          userId,
          photoId,
        );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('photographerId');
    });
  });

  describe('sharePhoto', () => {
    it(`should throw ${ShareStatusIsNotReadyException.name} when share status is not READY`, () => {
      photo.shareStatus = ShareStatus.NOT_READY;
      photo.photographerId = userId;

      jest
        .spyOn(photoRepository, 'getPhotoById')
        .mockReturnValue(Promise.resolve(photo));

      const shareRequest = new SharePhotoRequestDto();

      expect(
        async () => await photoService.sharePhoto(userId, shareRequest),
      ).rejects.toThrow(ShareStatusIsNotReadyException);
    });
    it(`should throw ${ChoosedShareQualityIsNotFoundException.name} when share quality supply is not found`, () => {
      photo.id = 'd02936b6-281e-40bd-b9ac-36631e073242';
      photo.shareStatus = ShareStatus.READY;
      photo.sharePayload = {
        '4K': 'https://example.com',
      };

      jest
        .spyOn(photoRepository, 'getPhotoById')
        .mockReturnValue(Promise.resolve(photo));

      const shareRequest = new SharePhotoRequestDto();
      shareRequest.photoId = photo.id;
      shareRequest.quality = 'NOT_FOUND_CHOOSED_QUALITY';

      expect(
        async () => await photoService.sharePhoto(userId, shareRequest),
      ).rejects.toThrow(ChoosedShareQualityIsNotFoundException);
    });
  });

  describe(`getSharedPhoto`, () => {
    it(`should throw ${ShareStatusIsNotReadyException.name} when share status is not READY`, () => {
      photo.id = '767dcf23-eea7-42df-ba26-c9ea482beeae';
      photo.shareStatus = ShareStatus.NOT_READY;

      jest
        .spyOn(photoRepository, 'getPhotoById')
        .mockReturnValue(Promise.resolve(photo));

      expect(
        async () => await photoService.getSharedPhoto(userId, photo.id),
      ).rejects.toThrow(ShareStatusIsNotReadyException);
    });
    it(`should throw ${SharePhotoUrlIsEmptyException.name} when current share photo url is empty`, () => {
      photo.currentSharePhotoUrl = '';
      photo.id = 'dfa01247-4728-4585-8ed8-5b6876c7fd66';
      photo.shareStatus = ShareStatus.READY;

      jest
        .spyOn(photoRepository, 'getPhotoById')
        .mockReturnValue(Promise.resolve(photo));

      expect(
        async () => await photoService.getSharedPhoto(userId, photo.id),
      ).rejects.toThrow(SharePhotoUrlIsEmptyException);
    });
    it(`should return signed object with not empty signed photo url when share status is valid and currentShareUrl is not empty`, async () => {
      photo.currentSharePhotoUrl = 'https://example.com';
      photo.id = '23330d5f-0c0f-4906-8659-457f76ada3f6';
      photo.shareStatus = ShareStatus.READY;

      jest
        .spyOn(photoRepository, 'getPhotoDetailById')
        .mockReturnValue(Promise.resolve(photo));

      const result = await photoService.getSharedPhoto(userId, photo.id);

      expect(result.signedUrl.url.trim().length !== 0).toBeTruthy();
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should throw FileIsNotValidException when extension is empty', () => {
      presignedUploadUrlRequest.filename = 'test';

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(FileIsNotValidException);
    });

    it('should throw FileIsNotValidException when extension is not valid', async () => {
      presignedUploadUrlRequest.filename = 'test.abc';

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(FileIsNotValidException);
    });

    it('should return correct SignedUpload when filename is valid', async () => {
      presignedUploadUrlRequest.filename = 'test.jpg';

      const signedUpload = new SignedUpload(
        'name',
        'url',
        'object',
        'be1fe599-7aab-4a04-8620-dac51c6bc31e',
      );

      jest.spyOn(userRepository, 'findUserQuotaById').mockReturnValue(
        Promise.resolve({
          maxPhotoQuota: 999,
          maxPackageCount: 999,
          maxBookingPhotoQuota: 999,
          maxBookingVideoQuota: 999,
        }),
      );

      jest.spyOn(photoRepository, 'createTemporaryPhotos').mockReturnValue(
        Promise.resolve({
          photographerId: userId,
          originalPhotoUrl: 'https://example.com',
          sharePayload: {},
          shareStatus: ShareStatus.NOT_READY,
          id: signedUpload.photoId,
        }),
      );

      const result = await photoService.getPresignedUploadUrl(
        userId,
        presignedUploadUrlRequest,
      );

      expect(result).toHaveProperty('signedUpload');
      expect(result.signedUpload.photoId.length > 0).toBeTruthy();
      expect(result.signedUpload.uploadUrl.length > 0).toBeTruthy();
    });

    it('should throw PhotographerNotFoundException when userid is not found', () => {
      jest
        .spyOn(userRepository, 'findUserQuotaById')
        .mockReturnValue(Promise.resolve(null));

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(PhotographerNotFoundException);
    });

    it('should throw RunOutPhotoQuotaException when current quota usage is larger or equal max photo quota', () => {
      jest
        .spyOn(userRepository, 'findUserQuotaById')
        .mockImplementation(async () =>
          Promise.resolve({
            photoQuotaUsage: 5242880, //bytes
            maxPhotoQuota: 5242880,

            maxPackageCount: 0,
            maxBookingPhotoQuota: 0,
            maxBookingVideoQuota: 0,
          }),
        );

      expect(
        async () =>
          await photoService.getPresignedUploadUrl(
            userId,
            presignedUploadUrlRequest,
          ),
      ).rejects.toThrow(RunOutPhotoQuotaException);
    });
  });
});
