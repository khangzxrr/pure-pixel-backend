import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import { MemoryStoredFile } from 'nestjs-form-data';
import { BunnyService } from './bunny.service';
import { FileShouldNotBeNullException } from '../exceptions/file-should-not-be-null.exception';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');

  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

jest.mock('uuid', () => ({
  v4: () => '11111111-2222-3333-4444-555555555555',
}));

const S3ClientMock = S3Client as unknown as jest.Mock;

describe('BunnyService', () => {
  const originalEnv = process.env;
  let service: BunnyService;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STORAGE_ENDPOINT: 'http://minio.internal:9000',
      STORAGE_REGION: 'ap-southeast-1',
      STORAGE_ACCESS_KEY: 'access-key',
      STORAGE_SECRET_KEY: 'secret-key',
      STORAGE_BUCKET: 'private-bucket',
      STORAGE_PUBLIC_BUCKET: 'public-bucket',
      STORAGE_PUBLIC_URL: 'https://cdn.example.com',
    };

    mockSend.mockReset();
    S3ClientMock.mockClear();

    service = new BunnyService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  const lastCommand = () =>
    mockSend.mock.calls[mockSend.mock.calls.length - 1][0];

  describe('S3 client', () => {
    it('creates the client lazily once with the storage configuration', async () => {
      mockSend.mockResolvedValue({});

      await service.delete('a.jpg');
      await service.delete('b.jpg');

      expect(S3ClientMock).toHaveBeenCalledTimes(1);
      expect(S3ClientMock).toHaveBeenCalledWith({
        endpoint: 'http://minio.internal:9000',
        region: 'ap-southeast-1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
        },
      });
    });

    it('falls back to us-east-1 when STORAGE_REGION is not set', async () => {
      delete process.env.STORAGE_REGION;
      mockSend.mockResolvedValue({});

      await service.delete('a.jpg');

      expect(S3ClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'us-east-1' }),
      );
    });
  });

  describe('delete', () => {
    it('throws when key is null', async () => {
      await expect(
        service.delete(null as unknown as string),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('sends a DeleteObjectCommand with leading slashes removed', async () => {
      const output = { DeleteMarker: true };
      mockSend.mockResolvedValue(output);

      const result = await service.delete('//photos/a.jpg');

      expect(result).toBe(output);
      const command = lastCommand();
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'private-bucket',
        Key: 'photos/a.jpg',
      });
    });
  });

  describe('download', () => {
    it('throws when key is null', async () => {
      await expect(
        service.download(null as unknown as string),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
    });

    it('returns the object body as a buffer', async () => {
      mockSend.mockResolvedValue({
        Body: {
          transformToByteArray: jest
            .fn()
            .mockResolvedValue(new Uint8Array([1, 2, 3])),
        },
      });

      const result = await service.download('/photos/a.jpg');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect([...result]).toEqual([1, 2, 3]);
      const command = lastCommand();
      expect(command).toBeInstanceOf(GetObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'private-bucket',
        Key: 'photos/a.jpg',
      });
    });

    it('throws when the response has no body', async () => {
      mockSend.mockResolvedValue({});

      await expect(service.download('a.jpg')).rejects.toThrow(
        'object a.jpg has no body',
      );
    });
  });

  describe('uploadFromBuffer', () => {
    it('throws when key is null', async () => {
      await expect(
        service.uploadFromBuffer(null as unknown as string, Buffer.from('x')),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
    });

    it('throws when buffer is null', async () => {
      await expect(
        service.uploadFromBuffer('a.jpg', null as unknown as Buffer),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
    });

    it('puts the buffer to the private bucket and returns the key', async () => {
      mockSend.mockResolvedValue({});
      const buffer = Buffer.from('content');

      const result = await service.uploadFromBuffer('/a/b.jpg', buffer);

      expect(result).toBe('/a/b.jpg');
      const command = lastCommand();
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toEqual({
        Bucket: 'private-bucket',
        Key: 'a/b.jpg',
        Body: buffer,
      });
    });
  });

  describe('pruneCache', () => {
    it('does nothing because there is no CDN cache', async () => {
      await expect(service.pruneCache('any')).resolves.toBeUndefined();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('uploadPublicFromBuffer', () => {
    it('throws when buffer is null', async () => {
      await expect(
        service.uploadPublicFromBuffer(null as unknown as Buffer, 'a.jpg'),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
    });

    it('puts the buffer to the public bucket and returns the public url', async () => {
      mockSend.mockResolvedValue({});
      const buffer = Buffer.from('content');

      const url = await service.uploadPublicFromBuffer(buffer, '/avatar/u.png');

      expect(url).toBe('https://cdn.example.com/public-bucket/avatar/u.png');
      expect(lastCommand().input).toEqual({
        Bucket: 'public-bucket',
        Key: 'avatar/u.png',
        Body: buffer,
      });
    });
  });

  describe('uploadPublic', () => {
    it('throws when file is null', async () => {
      await expect(
        service.uploadPublic(null as unknown as MemoryStoredFile, 'a.jpg'),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
    });

    it('puts the file buffer to the public bucket and returns the public url', async () => {
      mockSend.mockResolvedValue({});
      const buffer = Buffer.from('content');
      const file = { buffer } as unknown as MemoryStoredFile;

      const url = await service.uploadPublic(file, 'cover/u.jpg');

      expect(url).toBe('https://cdn.example.com/public-bucket/cover/u.jpg');
      expect(lastCommand()).toBeInstanceOf(PutObjectCommand);
      expect(lastCommand().input).toEqual({
        Bucket: 'public-bucket',
        Key: 'cover/u.jpg',
        Body: buffer,
      });
    });
  });

  describe('upload', () => {
    it('throws when file is null', async () => {
      await expect(
        service.upload(null as unknown as MemoryStoredFile),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
    });

    it('puts the file with a generated key and returns the key', async () => {
      mockSend.mockResolvedValue({});
      const buffer = Buffer.from('content');
      const file = { buffer, extension: 'png' } as unknown as MemoryStoredFile;

      const key = await service.upload(file);

      expect(key).toBe('11111111-2222-3333-4444-555555555555.png');
      expect(lastCommand().input).toEqual({
        Bucket: 'private-bucket',
        Key: key,
        Body: buffer,
      });
    });
  });

  describe('bunnyFileList', () => {
    it('returns the listed contents', async () => {
      const contents = [{ Key: 'a.jpg' }, { Key: 'b.jpg' }];
      mockSend.mockResolvedValue({ Contents: contents });

      await expect(service.bunnyFileList()).resolves.toBe(contents);
      expect(lastCommand()).toBeInstanceOf(ListObjectsV2Command);
      expect(lastCommand().input).toEqual({ Bucket: 'private-bucket' });
    });

    it('returns an empty list when the bucket is empty', async () => {
      mockSend.mockResolvedValue({});

      await expect(service.bunnyFileList()).resolves.toEqual([]);
    });
  });

  describe('getPresignedFile', () => {
    const now = new Date('2024-03-05T06:07:08.910Z');

    beforeEach(() => {
      jest.useFakeTimers({ now });
    });

    const referencePresign = async (
      publicUrl: string,
      canonicalUri: string,
      region: string,
    ) => {
      const url = new URL(publicUrl);
      const signer = new SignatureV4({
        credentials: {
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
        },
        region,
        service: 's3',
        sha256: Sha256,
        uriEscapePath: false,
        applyChecksum: false,
      });

      const presigned = await signer.presign(
        new HttpRequest({
          method: 'GET',
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port ? Number(url.port) : undefined,
          path: canonicalUri,
          headers: {
            host: url.host,
            'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
          },
        }),
        {
          signingDate: now,
          expiresIn: 3600,
          unsignableHeaders: new Set(['x-amz-content-sha256']),
          unhoistableHeaders: new Set(['x-amz-content-sha256']),
        },
      );

      return presigned.query as Record<string, string>;
    };

    it('builds a SigV4 presigned url on the public host', async () => {
      const result = service.getPresignedFile('/photos/a.jpg');
      const url = new URL(result);

      expect(url.origin).toBe('https://cdn.example.com');
      expect(url.pathname).toBe('/private-bucket/photos/a.jpg');
      expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
      expect(url.searchParams.get('X-Amz-Credential')).toBe(
        'access-key/20240305/ap-southeast-1/s3/aws4_request',
      );
      expect(url.searchParams.get('X-Amz-Date')).toBe('20240305T060708Z');
      expect(url.searchParams.get('X-Amz-Expires')).toBe('3600');
      expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
      expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
      expect([...url.searchParams.keys()]).toEqual([
        'X-Amz-Algorithm',
        'X-Amz-Credential',
        'X-Amz-Date',
        'X-Amz-Expires',
        'X-Amz-SignedHeaders',
        'X-Amz-Signature',
      ]);

      const reference = await referencePresign(
        'https://cdn.example.com',
        '/private-bucket/photos/a.jpg',
        'ap-southeast-1',
      );
      expect(url.searchParams.get('X-Amz-Signature')).toBe(
        reference['X-Amz-Signature'],
      );
    });

    it('is deterministic for the same time and ignores the query argument', () => {
      const withoutQuery = service.getPresignedFile('photos/a.jpg');
      const withQuery = service.getPresignedFile(
        'photos/a.jpg',
        '?width=200&updatedAt=123',
      );

      expect(withQuery).toBe(withoutQuery);
      expect(withQuery).not.toContain('width');
      expect(withQuery).not.toContain('updatedAt');
    });

    it('changes the signature when the time changes', () => {
      const first = service.getPresignedFile('photos/a.jpg');
      jest.setSystemTime(new Date('2024-03-05T06:07:09.000Z'));
      const second = service.getPresignedFile('photos/a.jpg');

      expect(second).not.toBe(first);
    });

    it('keeps the base path of the public url and encodes key segments (RFC 3986)', async () => {
      process.env.STORAGE_PUBLIC_URL = 'http://localhost:9000/minio/';
      delete process.env.STORAGE_REGION;

      const result = service.getPresignedFile("album/my photo (1)!'*.jpg");
      const url = new URL(result);

      expect(url.origin).toBe('http://localhost:9000');
      expect(result).toContain(
        'http://localhost:9000/minio/private-bucket/album/my%20photo%20%281%29%21%27%2A.jpg?',
      );
      expect(url.searchParams.get('X-Amz-Credential')).toBe(
        'access-key/20240305/us-east-1/s3/aws4_request',
      );

      const reference = await referencePresign(
        'http://localhost:9000',
        '/minio/private-bucket/album/my%20photo%20%281%29%21%27%2A.jpg',
        'us-east-1',
      );
      expect(url.searchParams.get('X-Amz-Signature')).toBe(
        reference['X-Amz-Signature'],
      );
    });
  });
});
