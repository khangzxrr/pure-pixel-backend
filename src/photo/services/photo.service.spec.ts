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

describe('PhotoService', () => {
  let photoService: PhotoService;
  const photoRepository = {
    getPhotoById: (id: string) => {
      const photo = {
        id: id,
        photographerId: 'feecbedf-16a5-42a2-ad81-9d3c3b13809d',
      };

      return Promise.resolve(photo);
    },
    //lazy mock, write full object if required
    createTemporaryPhotos: (userId: string, signedUpload: SignedUpload) => {
      const result = {
        id: '90ff5312-51e1-456b-ad05-67e175ac532c',
        originalPhotoUrl: signedUpload.storageObject,
        photographerId: userId,
      };
      return Promise.resolve(result);
    },
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

  const userId = '6db1c6a1-f4ab-4ecb-a489-9285ebb53135';
  const presignedUploadUrlRequest = new PresignedUploadUrlRequest();

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
        PhotoProcessService,
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
        .mockImplementation(async () => Promise.resolve(null));

      expect(async () => {
        const photo =
          await photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
            userId,
            'randomIdWithoutKnowledge',
          );

        console.log(photo);

        return photo;
      }).rejects.toThrow(PhotoNotFoundException);
    });
    it(`it should throw ${NotBelongPhotoException.name} when photographerId != userId`, () => {
      jest.spyOn(photoRepository, 'getPhotoById').mockImplementation(async () =>
        Promise.resolve({
          id: 'aebf9a74-8c69-44b2-a317-1d57d874b12a',
          photographerId: 'not_found_id',
        }),
      );

      expect(
        async () =>
          await photoService.findAndValidatePhotoIsNotFoundAndBelongToPhotographer(
            userId,
            'photoId',
          ),
      ).rejects.toThrow(NotBelongPhotoException);
    });
  });

  describe('sharePhoto', () => {
    it(`should throw ${ShareStatusIsNotReadyException.name} when share status is not READY`, () => {});
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

      const result = await photoService.getPresignedUploadUrl(
        userId,
        presignedUploadUrlRequest,
      );

      expect(result).toHaveProperty('signedUpload');
      expect(result.signedUpload.uploadUrl.length > 0).toBeTruthy();
    });

    it('should throw PhotographerNotFoundException when userid is not found', () => {
      jest
        .spyOn(userRepository, 'findUserQuotaById')
        .mockImplementation(async () => Promise.resolve(null));

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
