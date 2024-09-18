import { ApiProperty } from '@nestjs/swagger';
import { SignedUpload } from './presigned-upload-url.response.dto';

export class ProcessImagesRequest {
  @ApiProperty({ type: [SignedUpload] })
  signedUploads: SignedUpload[];
}
