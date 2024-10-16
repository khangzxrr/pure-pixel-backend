import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class PhotoshootPackageDetailDto {
  @ApiProperty()
  id: string;

  @Exclude()
  photoshootPackageId: string;
}
