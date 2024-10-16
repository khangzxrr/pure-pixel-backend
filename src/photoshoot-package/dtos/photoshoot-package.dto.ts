import { ApiProperty } from '@nestjs/swagger';
import { PhotoshootPackageStatus } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { PhotoshootPackageDetailDto } from './photoshoot-package-detail.dto';
import { UserDto } from 'src/user/dtos/me.dto';

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

  @Exclude()
  userId: string;

  @ApiProperty({
    isArray: true,
  })
  @Type(() => PhotoshootPackageDetailDto)
  details: PhotoshootPackageDetailDto[];

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;
}
