import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
import { MemoryStoredFile } from 'nestjs-form-data';
import { FileShouldNotBeNullException } from '../exceptions/file-should-not-be-null.exception';
import { v4 } from 'uuid';

@Injectable()
export class BunnyService {
  constructor(private httpService: HttpService) {}

  private getAccessHeader() {
    return {
      accessKey: process.env.BUNNY_STORAGE_ACCESS_KEY,
    };
  }

  async download(key: string) {
    if (key == null) {
      throw new FileShouldNotBeNullException();
    }

    const response = await firstValueFrom(
      this.httpService.get(
        `${process.env.BUNNY_EDGE_STORAGE_CDN}/${process.env.BUNNY_STORAGE_BUCKET}/${key}`,
        {
          headers: {
            accessKey: process.env.BUNNY_EDGE_STORAGE_ACCESS_KEY,
          },
          responseType: 'arraybuffer',
        },
      ),
    );

    return response.data;
  }

  async uploadFromBuffer(key: string, buffer: Buffer) {
    if (key == null || buffer == null) {
      throw new FileShouldNotBeNullException();
    }

    await firstValueFrom(
      this.httpService.put(
        `${process.env.BUNNY_EDGE_STORAGE_CDN}/${process.env.BUNNY_STORAGE_BUCKET}/${key}`,
        buffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            accept: 'application/json',
            accessKey: process.env.BUNNY_EDGE_STORAGE_ACCESS_KEY,
          },
        },
      ),
    );

    return key;
  }

  async upload(file: MemoryStoredFile) {
    if (file === null) {
      throw new FileShouldNotBeNullException();
    }

    const filekey = `${v4()}.${file.extension}`;

    await firstValueFrom(
      this.httpService.put(
        `${process.env.BUNNY_EDGE_STORAGE_CDN}/${process.env.BUNNY_STORAGE_BUCKET}/${filekey}`,
        file.buffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            accept: 'application/json',
            accessKey: process.env.BUNNY_EDGE_STORAGE_ACCESS_KEY,
          },
        },
      ),
    );

    return filekey;
  }

  getPresignedFile(filename: string, query: string = '') {
    return this.signUrl(
      `${process.env.BUNNY_STORAGE_CDN}/${filename}${query}`,
      `${process.env.BUNNY_CDN_ACCESS_KEY}`,
      3600,
      null,
      false,
      `/${filename}`,
      null,
      null,
    );
  }

  async bunnyFileList() {
    const url = `${process.env.BUNNY_STORAGE_CDN}/${process.env.BUNNY_STORAGE_BUCKET}/`;

    console.log(this.getAccessHeader());
    console.log(process.env.BUNNY_STORAGE_ACCESS_KEY);
    console.log(url);
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'Content-Type': 'application/json',
          accessKey: process.env.BUNNY_STORAGE_ACCESS_KEY,
        },
      }),
    );

    return response.data;
  }

  private addCountries(url: string, a: string, b: string) {
    let tempUrl = url;
    if (a != null) {
      const tempUrlOne = new URL(tempUrl);
      tempUrl += (tempUrlOne.search == '' ? '?' : '&') + 'token_countries=' + a;
    }
    if (b != null) {
      const tempUrlTwo = new URL(tempUrl);
      tempUrl +=
        (tempUrlTwo.search == '' ? '?' : '&') + 'token_countries_blocked=' + b;
    }
    return tempUrl;
  }

  private signUrl(
    url: string,
    securityKey: string,
    expirationTime = 3600,
    userIp: string,
    isDirectory = false,
    pathAllowed: string,
    countriesAllowed: string,
    countriesBlocked: string,
  ) {
    /*
		url: CDN URL w/o the trailing '/' - exp. http://test.b-cdn.net/file.png
		securityKey: Security token found in your pull zone
		expirationTime: Authentication validity (default. 86400 sec/24 hrs)
		userIp: Optional parameter if you have the User IP feature enabled
		isDirectory: Optional parameter - "true" returns a URL separated by forward slashes (exp. (domain)/bcdn_token=...)
		pathAllowed: Directory to authenticate (exp. /path/to/images)
		countriesAllowed: List of countries allowed (exp. CA, US, TH)
		countriesBlocked: List of countries blocked (exp. CA, US, TH)
	*/
    let parameterData = '',
      parameterDataUrl = '',
      signaturePath = '',
      hashableBase = '',
      token = '';

    const expires = Math.floor(new Date().getTime() / 1000) + expirationTime;

    url = this.addCountries(url, countriesAllowed, countriesBlocked);
    const parsedUrl = new URL(url);
    const parameters = new URL(url).searchParams;
    if (pathAllowed != '') {
      signaturePath = pathAllowed;
      parameters.set('token_path', signaturePath);
    } else {
      signaturePath = decodeURIComponent(parsedUrl.pathname);
    }
    parameters.sort();
    if (Array.from(parameters).length > 0) {
      parameters.forEach(function (value, key) {
        if (value == '') {
          return;
        }
        if (parameterData.length > 0) {
          parameterData += '&';
        }
        parameterData += key + '=' + value;
        parameterDataUrl += '&' + key + '=' + querystring.escape(value);
      });
    }
    hashableBase =
      securityKey +
      signaturePath +
      expires +
      (userIp != null ? userIp : '') +
      parameterData;
    token = Buffer.from(
      crypto.createHash('sha256').update(hashableBase).digest(),
    ).toString('base64');
    token = token
      .replace(/\n/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    if (isDirectory) {
      return (
        parsedUrl.protocol +
        '//' +
        parsedUrl.host +
        '/bcdn_token=' +
        token +
        parameterDataUrl +
        '&expires=' +
        expires +
        parsedUrl.pathname
      );
    } else {
      return (
        parsedUrl.protocol +
        '//' +
        parsedUrl.host +
        parsedUrl.pathname +
        '?token=' +
        token +
        parameterDataUrl +
        '&expires=' +
        expires
      );
    }
  }
}
