import { ApiProperty } from '@nestjs/swagger';

export class SingleSignedUrl {
  @ApiProperty()
  filename: string;
  @ApiProperty()
  uploadUrl: string;

  constructor(name: string, url: string) {
    this.filename = name;
    this.uploadUrl = url;
  }
}

export class PresignedUploadUrlResponse {
  @ApiProperty({ type: SingleSignedUrl })
  uploadUrls: SingleSignedUrl[];

  constructor(urls: SingleSignedUrl[]) {
    this.uploadUrls = urls;
  }
}
