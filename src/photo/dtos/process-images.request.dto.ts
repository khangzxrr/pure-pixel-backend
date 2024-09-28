import { ApiProperty } from '@nestjs/swagger';
import { SignedUpload } from './presigned-upload-url.response.dto';
import { IsNotEmptyObject, ValidateNested } from 'class-validator';

export class ProcessPhotosRequest {
  @ApiProperty()
  @ValidateNested()
  @IsNotEmptyObject()
  signedUpload: SignedUpload;
}
