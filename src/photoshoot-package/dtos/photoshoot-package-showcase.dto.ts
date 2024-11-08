import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsUrl } from 'class-validator';

export class PhotoshootPackageShowcaseDto {
  @ApiProperty()
  id: string;

  @Exclude()
  photoshootPackageId: string;

  @ApiProperty()
  @IsUrl()
  photoUrl: string;
}
