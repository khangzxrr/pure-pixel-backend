import { ApiProperty } from '@nestjs/swagger';
import { SignedUpload } from './presigned-upload-url.response.dto';

export class ProcessPhotosRequest {
  @ApiProperty()
  signedUpload: SignedUpload;
}
