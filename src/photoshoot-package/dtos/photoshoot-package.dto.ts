import { ApiProperty } from '@nestjs/swagger';
import { PhotoshootPackageStatus } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/user.dto';
import { PhotoshootPackageShowcaseDto } from './photoshoot-package-showcase.dto';
import { PhotoshootPackageReviewDto } from './photoshoot-package-review.dto';

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
  description: string;

  @ApiProperty()
  status: PhotoshootPackageStatus;

  @Exclude()
  userId: string;

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    isArray: true,
  })
  @Type(() => PhotoshootPackageReviewDto)
  reviews: PhotoshootPackageReviewDto[];

  @ApiProperty({
    isArray: true,
  })
  @Type(() => PhotoshootPackageShowcaseDto)
  showcases: PhotoshootPackageShowcaseDto[];
}
