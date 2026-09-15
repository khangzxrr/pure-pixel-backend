import {
  DeleteObjectsCommand,
  GetBucketCorsCommand,
  GetObjectAclCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { getSignedUrl as getSignedUrlByCloudfront } from '@aws-sdk/cloudfront-signer';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { StorageService } from './storage.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');

  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

jest.mock('@aws-sdk/client-cloudfront', () => ({
  CloudFrontClient: jest.fn().mockImplementation(() => ({ kind: 'cf' })),
}));

jest.mock('@aws-sdk/cloudfront-signer', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn(),
}));

const S3ClientMock = S3Client as unknown as jest.Mock;
const CloudFrontClientMock = CloudFrontClient as unknown as jest.Mock;
const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;
const getSignedUrlByCloudfrontMock =
  getSignedUrlByCloudfront as jest.MockedFunction<
    typeof getSignedUrlByCloudfront
  >;
const UploadMock = Upload as unknown as jest.Mock;

describe('StorageService', () => {
  const originalEnv = process.env;
  let httpService: { get: jest.Mock };
  let service: StorageService;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      S3_REGION: 'ap-southeast-1',
      S3_ENABLE_ACCELERATE: 'true',
      S3_ACCESS_KEY_ID: 'key-id',
      S3_SECRET_ACCESS_KEY: 'secret',
      S3_BUCKET: 'bucket',
      AWS_CLOUDFRONT_S3_ORIGIN: 'https://cf.example.com',
      AWS_CLOUDFRONT_ACCESS_KEY: 'KPAIR',
      AWS_CLOUDFRONT_PRIVATE_KEY: 'line1\\nline2',
    };

    jest.clearAllMocks();
    mockSend.mockReset();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    httpService = { get: jest.fn() };
    service = new StorageService(httpService as unknown as HttpService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const lastCommand = () =>
    mockSend.mock.calls[mockSend.mock.calls.length - 1][0];

  it('bunnyFileList returns the http response', async () => {
    const response = { data: [1] };
    httpService.get.mockReturnValue(of(response));

    await expect(service.bunnyFileList()).resolves.toBe(response);
    expect(httpService.get).toHaveBeenCalledWith('https://example.com/data');
  });

  describe('getS3', () => {
    it('creates the client once with the configured options', () => {
      const first = service.getS3();
      const second = service.getS3();

      expect(second).toBe(first);
      expect(S3ClientMock).toHaveBeenCalledTimes(1);
      expect(S3ClientMock).toHaveBeenCalledWith({
        region: 'ap-southeast-1',
        useAccelerateEndpoint: true,
        credentials: {
          accessKeyId: 'key-id',
          secretAccessKey: 'secret',
        },
      });
    });

    it('disables acceleration unless S3_ENABLE_ACCELERATE is "true"', () => {
      process.env.S3_ENABLE_ACCELERATE = 'false';

      service.getS3();

      expect(S3ClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ useAccelerateEndpoint: false }),
      );
    });
  });

  describe('getCloudfront', () => {
    it('creates a CloudFront client once and reuses it', () => {
      service.getCloudfront();
      const cached = service.getCloudfront();

      expect(CloudFrontClientMock).toHaveBeenCalledTimes(1);
      expect(CloudFrontClientMock).toHaveBeenCalledWith({});
      expect(cached).toBe(CloudFrontClientMock.mock.results[0].value);
    });
  });

  it('signUrlByCloudfront signs the origin url valid for one hour', async () => {
    const now = new Date('2024-01-01T00:00:00.000Z');
    jest.useFakeTimers({ now });
    getSignedUrlByCloudfrontMock.mockReturnValue('https://signed');

    await expect(service.signUrlByCloudfront('a/b.jpg')).resolves.toBe(
      'https://signed',
    );

    expect(getSignedUrlByCloudfrontMock).toHaveBeenCalledWith({
      url: 'https://cf.example.com/a/b.jpg',
      keyPairId: 'KPAIR',
      privateKey: 'line1\nline2',
      dateLessThan: new Date(now.getTime() + 60 * 60 * 1000).toString(),
    });
  });

  it('sendCommand sends the command through the S3 client', async () => {
    const output = { ok: true };
    mockSend.mockResolvedValue(output);
    const command = new HeadObjectCommand({ Bucket: 'b', Key: 'k' });

    await expect(service.sendCommand(command)).resolves.toBe(output);
    expect(mockSend).toHaveBeenCalledWith(command);
  });

  it('getS3SignedUrl presigns a GetObjectCommand', async () => {
    getSignedUrlMock.mockResolvedValue('https://presigned-get');

    await expect(service.getS3SignedUrl('k.jpg')).resolves.toBe(
      'https://presigned-get',
    );

    const [client, command, options] = getSignedUrlMock.mock.calls[0];
    expect(client).toBe(service.getS3());
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect((command as GetObjectCommand).input).toEqual({
      Key: 'k.jpg',
      Bucket: 'bucket',
    });
    expect(options).toEqual({});
  });

  describe('getObjectToByteArray', () => {
    it('returns the body bytes', async () => {
      const bytes = new Uint8Array([9, 8]);
      mockSend.mockResolvedValue({
        Body: { transformToByteArray: jest.fn().mockResolvedValue(bytes) },
      });

      await expect(service.getObjectToByteArray('k')).resolves.toBe(bytes);
      expect(lastCommand()).toBeInstanceOf(GetObjectCommand);
      expect(lastCommand().input).toEqual({ Key: 'k', Bucket: 'bucket' });
    });

    it('throws when the object has no body', async () => {
      mockSend.mockResolvedValue({});

      await expect(service.getObjectToByteArray('k')).rejects.toThrow(
        'object k has no body',
      );
    });
  });

  it('deleteKeys sends a DeleteObjectsCommand with all keys', async () => {
    mockSend.mockResolvedValue({ Deleted: [] });

    await service.deleteKeys(['a', 'b']);

    expect(lastCommand()).toBeInstanceOf(DeleteObjectsCommand);
    expect(lastCommand().input).toEqual({
      Bucket: 'bucket',
      Delete: { Objects: [{ Key: 'a' }, { Key: 'b' }] },
    });
  });

  it('getBucketCors sends a GetBucketCorsCommand', async () => {
    mockSend.mockResolvedValue({ CORSRules: [] });

    await expect(service.getBucketCors()).resolves.toEqual({ CORSRules: [] });
    expect(lastCommand()).toBeInstanceOf(GetBucketCorsCommand);
    expect(lastCommand().input).toEqual({ Bucket: 'bucket' });
  });

  it('setBucketCors sends a permissive PutBucketCorsCommand', async () => {
    mockSend.mockResolvedValue({});

    await service.setBucketCors();

    expect(lastCommand()).toBeInstanceOf(PutBucketCorsCommand);
    expect(lastCommand().input).toEqual({
      Bucket: 'bucket',
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['Access-Control-Allow-Origin'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });
  });

  it('getPresignedUploadUrl presigns a jpeg PutObjectCommand', async () => {
    getSignedUrlMock.mockResolvedValue('https://presigned-put');

    await expect(service.getPresignedUploadUrl('up.jpg')).resolves.toBe(
      'https://presigned-put',
    );

    const command = getSignedUrlMock.mock.calls[0][1] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Key: 'up.jpg',
      ContentType: 'image/jpeg',
      Bucket: 'bucket',
    });
  });

  it('getObjectHead sends a HeadObjectCommand', async () => {
    const head = { ContentLength: 10 };
    mockSend.mockResolvedValue(head);

    await expect(service.getObjectHead('k')).resolves.toBe(head);
    expect(lastCommand()).toBeInstanceOf(HeadObjectCommand);
    expect(lastCommand().input).toEqual({ Key: 'k', Bucket: 'bucket' });
  });

  describe('uploadFromBytes', () => {
    it('uploads privately, logs progress and waits for completion', async () => {
      const on = jest.fn();
      const done = jest.fn().mockResolvedValue({});
      UploadMock.mockImplementation(() => ({ on, done }));
      const bytes = Buffer.from('bytes');

      await service.uploadFromBytes('big.bin', bytes);

      expect(UploadMock).toHaveBeenCalledWith({
        client: service.getS3(),
        params: {
          Key: 'big.bin',
          Bucket: 'bucket',
          ACL: 'private',
          Body: bytes,
        },
      });
      expect(done).toHaveBeenCalledTimes(1);
      expect(on).toHaveBeenCalledWith(
        'httpUploadProgress',
        expect.any(Function),
      );

      const progress = on.mock.calls[0][1] as (p: {
        loaded: number;
        total: number;
      }) => void;
      progress({ loaded: 5, total: 10 });

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'upload big.bin progress: 5/10',
      );
    });

    it('propagates upload failures', async () => {
      UploadMock.mockImplementation(() => ({
        on: jest.fn(),
        done: jest.fn().mockRejectedValue(new Error('upload failed')),
      }));

      await expect(
        service.uploadFromBytes('big.bin', Buffer.from('x')),
      ).rejects.toThrow('upload failed');
    });
  });

  it('grantObjectPublicReadAccess sends a public-read PutObjectAclCommand', async () => {
    mockSend.mockResolvedValue({ RequestCharged: 'x' });

    await expect(service.grantObjectPublicReadAccess('k')).resolves.toEqual({
      RequestCharged: 'x',
    });
    expect(lastCommand()).toBeInstanceOf(PutObjectAclCommand);
    expect(lastCommand().input).toEqual({
      Key: 'k',
      Bucket: 'bucket',
      ACL: 'public-read',
    });
  });

  it('getObjectAcl sends a GetObjectAclCommand', async () => {
    mockSend.mockResolvedValue({ Grants: [] });

    await expect(service.getObjectAcl('k')).resolves.toEqual({ Grants: [] });
    expect(lastCommand()).toBeInstanceOf(GetObjectAclCommand);
    expect(lastCommand().input).toEqual({ Key: 'k', Bucket: 'bucket' });
  });
});
