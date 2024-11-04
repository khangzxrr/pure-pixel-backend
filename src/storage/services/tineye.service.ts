import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { FileShouldNotBeNullException } from '../exceptions/file-should-not-be-null.exception';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { Readable } from 'stream';
@Injectable()
export class TineyeService {
  constructor(@Inject() private readonly httpService: HttpService) {}

  getAuthenticationHeader(headers: any) {
    const authStr = `${process.env.TINEYE_USERNAME}:${process.env.TINEYE_PASSWORD}`;
    const token = Buffer.from(authStr, 'binary').toString('base64');

    return {
      ...headers,
      Authorization: `Basic ${token}`,
    };
  }

  getEndpoint() {
    return process.env.TINEYE_ENDPOINT;
  }

  async searchByBuffer(buffer: Buffer, filename: string) {
    const formData = new FormData();
    formData.append('image', buffer, {
      filename,
    });

    //overcome tineye bug throw 500
    if (this.getEndpoint().indexOf('sandbox') > -1) {
      return {
        data: {
          method: 'search',
          status: 'ok',
          error: [],
          result: [],
          stats: {
            total_results: 0,
            total_filtered_results: 0,
            time_resize: 158.73,
            time_search: 155.84,
            time_total: 316.92,
          },
          query_image: {
            filepath: '6frkfz60z29hfbz4tjydtm1ph4.jpg',
          },
        },
      };
    }

    const response = await firstValueFrom(
      this.httpService.post(`${this.getEndpoint()}/rest/search`, formData, {
        headers: this.getAuthenticationHeader({
          ...formData.getHeaders(),
        }),
      }),
    );

    return response;
  }

  async search(url: string) {
    if (url === null || url.length === 0) {
      throw new FileShouldNotBeNullException();
    }

    const formData = new FormData();
    formData.append('url', url);
    formData.append('limit', 1);

    const response = await firstValueFrom(
      this.httpService.post(`${this.getEndpoint()}/rest/search`, formData, {
        headers: this.getAuthenticationHeader({
          'Content-Type': 'multipart/form-data',
        }),
      }),
    );

    return response;
  }

  async add(url: string) {
    if (url === null || url.length === 0) {
      throw new FileShouldNotBeNullException();
    }

    const formData = new FormData();
    formData.append('url', url);
    formData.append('filepath', url);

    const response = await firstValueFrom(
      this.httpService.post(`${this.getEndpoint()}/rest/add`, formData, {
        headers: this.getAuthenticationHeader({
          'Content-Type': 'multipart/form-data',
        }),
      }),
    );

    return response;
  }
}
