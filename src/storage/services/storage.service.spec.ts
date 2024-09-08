import { StorageService } from './storage.service';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3FailedUploadException } from '../exceptions/s3-failed-upload.exception';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    service = new StorageService();
    process.env.S3_BUCKET = 'test-bucket';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw S3FailedUploadException when upload fails', async () => {
    // Mock the sendCommand method to return a failed result
    service.sendCommand = jest.fn().mockResolvedValue({
      $metadata: { httpStatusCode: 500 },
    });

    // Attempt to upload
    await expect(
      service.uploadFromBytes('test-key', Buffer.from('test')),
    ).rejects.toThrow(S3FailedUploadException);

    // Verify that sendCommand was called with the correct parameters
    expect(service.sendCommand).toHaveBeenCalledWith(
      expect.any(PutObjectCommand),
    );
  });

  it('should return a presigned URL for a given key', async () => {
    const mockSignedUrl = 'https://example.com/signed-url';
    (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

    const result = await service.getSignedGetUrl('test-key');

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Key: 'test-key',
      Bucket: 'test-bucket',
    });
    expect(getSignedUrl).toHaveBeenCalled();
    expect(result).toBe(mockSignedUrl);
  });
});
