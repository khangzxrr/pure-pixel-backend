import {
  GetBucketPolicyCommand,
  ListBucketsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageController } from './storage.controller';
import { StorageService } from '../services/storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

describe('StorageController', () => {
  const originalEnv = process.env;
  let send: jest.Mock;
  let s3: { send: jest.Mock };
  let storageService: jest.Mocked<
    Pick<
      StorageService,
      | 'getBucketCors'
      | 'setBucketCors'
      | 'grantObjectPublicReadAccess'
      | 'getObjectAcl'
      | 'getS3'
      | 'signUrlByCloudfront'
    >
  >;
  let controller: StorageController;

  beforeEach(() => {
    process.env = { ...originalEnv, S3_BUCKET: 'bucket' };
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    getSignedUrlMock.mockReset();

    send = jest.fn();
    s3 = { send };
    storageService = {
      getBucketCors: jest.fn(),
      setBucketCors: jest.fn(),
      grantObjectPublicReadAccess: jest.fn(),
      getObjectAcl: jest.fn(),
      getS3: jest.fn(),
      signUrlByCloudfront: jest.fn(),
    };
    (storageService.getS3 as jest.Mock).mockReturnValue(s3);

    controller = new StorageController(
      storageService as unknown as StorageService,
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('getBucketCors delegates to the service', async () => {
    storageService.getBucketCors.mockResolvedValue({ CORSRules: [] } as never);

    await expect(controller.getBucketCors()).resolves.toEqual({
      CORSRules: [],
    });
  });

  it('setBucketCors delegates to the service', async () => {
    storageService.setBucketCors.mockResolvedValue({} as never);

    await expect(controller.setBucketCors()).resolves.toEqual({});
  });

  it('grantPublicAccess delegates with the key', async () => {
    storageService.grantObjectPublicReadAccess.mockResolvedValue({} as never);

    await controller.grantPublicAccess('k');

    expect(storageService.grantObjectPublicReadAccess).toHaveBeenCalledWith(
      'k',
    );
  });

  it('getObjectAcl delegates with the key', async () => {
    storageService.getObjectAcl.mockResolvedValue({ Grants: [] } as never);

    await expect(controller.getObjectAcl('k')).resolves.toEqual({ Grants: [] });
    expect(storageService.getObjectAcl).toHaveBeenCalledWith('k');
  });

  it('getObject signs the key by cloudfront', async () => {
    storageService.signUrlByCloudfront.mockResolvedValue('https://cf');

    await expect(controller.getObject('k')).resolves.toBe('https://cf');
    expect(storageService.signUrlByCloudfront).toHaveBeenCalledWith('k');
  });

  describe('getPutObjectPresignedUrl', () => {
    it('returns a presigned put url for the test object', async () => {
      getSignedUrlMock.mockResolvedValue('https://presigned');

      await expect(controller.getPutObjectPresignedUrl()).resolves.toBe(
        'https://presigned',
      );

      const [client, command] = getSignedUrlMock.mock.calls[0];
      expect(client).toBe(s3);
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect((command as PutObjectCommand).input).toEqual({
        Key: 'test.txt',
        Bucket: 'sftpgo',
      });
    });

    it('logs and resolves undefined when presigning fails', async () => {
      const error = new Error('no creds');
      getSignedUrlMock.mockRejectedValue(error);

      await expect(
        controller.getPutObjectPresignedUrl(),
      ).resolves.toBeUndefined();
      expect(console.log).toHaveBeenCalledWith(error);
    });
  });

  it('setBucketPolicy puts the cloudfront policy on S3_BUCKET', async () => {
    send.mockResolvedValue({});

    await expect(controller.setBucketPolicy()).resolves.toBeUndefined();

    const command = send.mock.calls[0][0] as PutBucketPolicyCommand;
    expect(command).toBeInstanceOf(PutBucketPolicyCommand);
    expect(command.input.Bucket).toBe('bucket');
    const policy = JSON.parse(command.input.Policy as string);
    expect(policy.Statement[0]).toEqual(
      expect.objectContaining({
        Effect: 'Allow',
        Action: 's3:GetObject',
        Principal: { Service: 'cloudfront.amazonaws.com' },
      }),
    );
  });

  describe('getBucketPolicy', () => {
    it('puts then reads the policy of the bucket and returns the put output', async () => {
      const putOutput = { put: true };
      send
        .mockResolvedValueOnce(putOutput)
        .mockResolvedValueOnce({ Policy: '{}' });

      await expect(controller.getBucketPolicy('my-bucket')).resolves.toBe(
        putOutput,
      );

      const putCommand = send.mock.calls[0][0] as PutBucketPolicyCommand;
      expect(putCommand).toBeInstanceOf(PutBucketPolicyCommand);
      expect(putCommand.input.Bucket).toBe('my-bucket');
      expect(JSON.parse(putCommand.input.Policy as string).Statement.Sid).toBe(
        'AllowCloudFrontServicePrincipalReadOnly',
      );

      const getCommand = send.mock.calls[1][0] as GetBucketPolicyCommand;
      expect(getCommand).toBeInstanceOf(GetBucketPolicyCommand);
      expect(getCommand.input).toEqual({ Bucket: 'my-bucket' });
    });

    it('logs and resolves undefined when S3 fails', async () => {
      send.mockRejectedValue(new Error('denied'));

      await expect(controller.getBucketPolicy('b')).resolves.toBeUndefined();
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('getBuckets', () => {
    it('lists the buckets', async () => {
      const output = { Buckets: [{ Name: 'a' }] };
      send.mockResolvedValue(output);

      await expect(controller.getBuckets()).resolves.toBe(output);
      expect(send.mock.calls[0][0]).toBeInstanceOf(ListBucketsCommand);
    });

    it('logs and resolves undefined when listing fails', async () => {
      send.mockRejectedValue(new Error('denied'));

      await expect(controller.getBuckets()).resolves.toBeUndefined();
    });
  });
});
