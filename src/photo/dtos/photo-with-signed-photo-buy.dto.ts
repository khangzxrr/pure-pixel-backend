import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PhotoDto } from './photo.dto';
import { SignedPhotoBuyDto } from './rest/signed-photo-buy.response.dto';

export class PhotoWithSignedPhotoBuys {
  @ApiProperty()
  @Type(() => PhotoDto)
  photo: PhotoDto;

  @ApiProperty({
    isArray: true,
    type: SignedPhotoBuyDto,
  })
  @Type(() => SignedPhotoBuyDto)
  photoBuys: SignedPhotoBuyDto[];
}
