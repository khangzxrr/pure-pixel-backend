import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';

export class TopSoldPhotoDto {
  @ApiProperty()
  @Type(() => SignedPhotoDto)
  detail: SignedPhotoDto;

  @ApiProperty()
  soldCount: number;
}
