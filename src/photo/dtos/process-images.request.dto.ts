import { ApiProperty } from '@nestjs/swagger';
import { SignedUpload } from './presigned-upload-url.response.dto';
import { IsNotEmptyObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessPhotosRequest {
  @ApiProperty()
  @ValidateNested()
  @IsNotEmptyObject()
  @Type(() => SignedUpload)
  signedUpload: SignedUpload;
}
