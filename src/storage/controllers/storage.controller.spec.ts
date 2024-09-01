import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { Client } from 'minio';
describe('StorageController', () => {
  let controller: StorageController;
  let minioClient: Client;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: Client,
          useValue: {
            presignedPutObject: jest
              .fn()
              .mockResolvedValue('https://example.com/presigned-url'),
            listBuckets: jest.fn().mockResolvedValue(['bucket1', 'bucket2']),
          },
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
    minioClient = module.get<Client>(Client);
  });

  it('should return "hello storage"', () => {
    expect(controller.getStorage()).toBe('hello storage');
  });

  it('should return a presigned URL', async () => {
    const presignedUrl = await controller.getPutObjectPresignedUrl();
    expect(presignedUrl).toBe('https://example.com/presigned-url');
    expect(minioClient.presignedPutObject).toHaveBeenCalledWith(
      'upload',
      'abc.test',
    );
  });

  it('should return a list of buckets', async () => {
    const buckets = await controller.getBuckets();
    expect(buckets).toEqual(['bucket1', 'bucket2']);
    expect(minioClient.listBuckets).toHaveBeenCalled();
  });
});
