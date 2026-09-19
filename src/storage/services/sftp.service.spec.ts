import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { SftpService } from './sftp.service';
import { SftpFailedCreateUser } from '../exceptions/sftpFailedCreateUser.exception';

describe('SftpService', () => {
  const originalEnv = process.env;
  let httpService: { post: jest.Mock };
  let service: SftpService;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SFTPGO_ENDPOINT: 'http://sftpgo:8080',
      SFTPGO_API_KEY: 'api-key',
      S3_BUCKET: 'bucket',
      S3_REGION: 'region',
      S3_ACCESS_KEY_ID: 'key-id',
      S3_SECRET_ACCESS_KEY: 'secret',
      S3_URL: 'https://s3.example.com',
    };

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    httpService = { post: jest.fn() };
    service = new SftpService(httpService as unknown as HttpService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('posts the new user to sftpgo with the S3 filesystem configuration', async () => {
    httpService.post.mockReturnValue(of({ status: 201, data: { id: 1 } }));

    await expect(
      service.registerNewSftpUser('user-1', 'john', 'john@mail.com', 'pw'),
    ).resolves.toBeUndefined();

    expect(httpService.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = httpService.post.mock.calls[0];

    expect(url).toBe('http://sftpgo:8080/api/v2/users');
    expect(config).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'X-SFTPGO-API-KEY': 'api-key',
      },
    });
    expect(body).toEqual(
      expect.objectContaining({
        status: 1,
        username: 'john',
        email: 'john@mail.com',
        password: 'pw',
        has_password: true,
        home_dir: '/temp/sftpgo/user-1',
        quota_size: 5368709120,
        permissions: { '/': ['*'] },
      }),
    );
    expect(body.filesystem).toEqual({
      provider: 1,
      osconfig: {},
      s3config: expect.objectContaining({
        bucket: 'bucket',
        key_prefix: 'user-1/',
        region: 'region',
        access_key: 'key-id',
        access_secret: {
          status: 'Plain',
          payload: 'secret',
          additional_data: 'user-1',
        },
        endpoint: 'https://s3.example.com',
        force_path_style: false,
      }),
    });
  });

  it('throws SftpFailedCreateUser with the response data when the request fails', async () => {
    httpService.post.mockReturnValue(
      throwError(() => ({ response: { data: 'username taken' } })),
    );

    const promise = service.registerNewSftpUser('u', 'n', 'e', 'p');

    await expect(promise).rejects.toBeInstanceOf(SftpFailedCreateUser);
    await expect(promise).rejects.toHaveProperty(
      'subMessage',
      'username taken',
    );
  });
});
