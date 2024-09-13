import { ApiProperty } from '@nestjs/swagger';
import { SignedUpload } from './presigned-upload-url.response.dto';

export class ProcessImagesRequest {
  @ApiProperty({ type: SignedUpload, isArray: true })
  signedUploads: SignedUpload[];

  constructor(urls: SignedUpload[]) {
    this.signedUploads = urls;
  }
}
