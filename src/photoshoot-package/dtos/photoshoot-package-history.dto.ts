import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PhotoshootPackageHistoryDto {
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
  description: string;
}
