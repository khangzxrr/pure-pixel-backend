import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { PhotoshootPackageDto } from 'src/photoshoot-package/dtos/photoshoot-package.dto';
import { UserDto } from 'src/user/dtos/me.dto';

export class BookingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  status: BookingStatus;

  @ApiProperty()
  description: string;

  @ApiProperty()
  photoshootPackageId: string;

  @Exclude()
  userId: string;

  @ApiPropertyOptional()
  @Type(() => PhotoshootPackageDto)
  photoshootPackage?: PhotoshootPackageDto;

  @ApiPropertyOptional()
  @Type(() => UserDto)
  user?: UserDto;
}
