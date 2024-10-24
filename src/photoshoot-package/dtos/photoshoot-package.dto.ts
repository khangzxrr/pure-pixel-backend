import { ApiProperty } from '@nestjs/swagger';
import { PhotoshootPackageStatus } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
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

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;
}
