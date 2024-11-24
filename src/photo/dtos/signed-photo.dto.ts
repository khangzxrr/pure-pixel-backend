import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SignedUrl } from './photo-signed-url.dto';
import { PhotoDto } from './photo.dto';

export class SignedPhotoDto extends PhotoDto {
  @ApiProperty()
  @Type(() => SignedUrl)
  signedUrl: SignedUrl;
}
