import { ApiProperty } from '@nestjs/swagger';
import { PhotoshootPackageStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class PhotoshootPackageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subtitle: string;

  @ApiProperty()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  status: PhotoshootPackageStatus;
}
