import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data';
import { of } from 'rxjs';
import { TineyeService } from './tineye.service';
import { FileShouldNotBeNullException } from '../exceptions/file-should-not-be-null.exception';

describe('TineyeService', () => {
  const originalEnv = process.env;
  let httpService: { post: jest.Mock; delete: jest.Mock };
  let service: TineyeService;

  const expectedAuthorization = `Basic ${Buffer.from('tin:eye', 'binary').toString('base64')}`;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TINEYE_USERNAME: 'tin',
      TINEYE_PASSWORD: 'eye',
      TINEYE_ENDPOINT: 'https://tineye.example.com',
    };

    httpService = { post: jest.fn(), delete: jest.fn() };
    service = new TineyeService(httpService as unknown as HttpService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('getAuthenticationHeader merges basic auth into the given headers', () => {
    expect(service.getAuthenticationHeader({ 'X-Test': '1' })).toEqual({
      'X-Test': '1',
      Authorization: expectedAuthorization,
    });
  });

  it('getEndpoint returns TINEYE_ENDPOINT', () => {
    expect(service.getEndpoint()).toBe('https://tineye.example.com');
  });

  describe('searchByBuffer', () => {
    it('returns a canned empty result for the sandbox endpoint without calling tineye', async () => {
      process.env.TINEYE_ENDPOINT = 'https://sandbox.tineye.com';

      const result = await service.searchByBuffer(Buffer.from('img'), 'a.jpg');

      expect(httpService.post).not.toHaveBeenCalled();
      expect(result.data).toEqual(
        expect.objectContaining({
          method: 'search',
          status: 'ok',
          result: [],
        }),
      );
    });

    it('posts the image as multipart form data with auth headers', async () => {
      const response = { data: { result: [1] } };
      httpService.post.mockReturnValue(of(response));

      await expect(
        service.searchByBuffer(Buffer.from('img'), 'a.jpg'),
      ).resolves.toBe(response);

      const [url, form, config] = httpService.post.mock.calls[0];
      expect(url).toBe('https://tineye.example.com/rest/search');
      expect(form).toBeInstanceOf(FormData);
      expect(config.headers.Authorization).toBe(expectedAuthorization);
      expect(config.headers['content-type']).toMatch(
        /^multipart\/form-data; boundary=/,
      );
    });
  });

  it('delete sends a delete request for the filepath', async () => {
    const response = { data: { status: 'ok' } };
    httpService.delete.mockReturnValue(of(response));

    await expect(service.delete('a/b.jpg')).resolves.toBe(response);
    expect(httpService.delete).toHaveBeenCalledWith(
      'https://tineye.example.com/rest/delete/?filepath=a/b.jpg',
      { headers: { Authorization: expectedAuthorization } },
    );
  });

  describe('search', () => {
    it('throws when url is null', async () => {
      await expect(
        service.search(null as unknown as string),
      ).rejects.toBeInstanceOf(FileShouldNotBeNullException);
    });

    it('throws when url is empty', async () => {
      await expect(service.search('')).rejects.toBeInstanceOf(
        FileShouldNotBeNullException,
      );
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('posts the url to the search endpoint', async () => {
      const response = { data: { result: [] } };
      httpService.post.mockReturnValue(of(response));

      await expect(service.search('https://img')).resolves.toBe(response);

      const [url, form, config] = httpService.post.mock.calls[0];
      expect(url).toBe('https://tineye.example.com/rest/search');
      expect(form).toBeInstanceOf(FormData);
      expect(config).toEqual({
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: expectedAuthorization,
        },
      });
    });
  });

  it('add posts the signed url and original filepath', async () => {
    const response = { data: { status: 'ok' } };
    httpService.post.mockReturnValue(of(response));

    await expect(service.add('orig.jpg', 'https://signed')).resolves.toBe(
      response,
    );

    const [url, form, config] = httpService.post.mock.calls[0];
    expect(url).toBe('https://tineye.example.com/rest/add');
    const body = (form as FormData).getBuffer().toString();
    expect(body).toContain('name="url"');
    expect(body).toContain('https://signed');
    expect(body).toContain('name="filepath"');
    expect(body).toContain('orig.jpg');
    expect(config.headers.Authorization).toBe(expectedAuthorization);
  });
});
