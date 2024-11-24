import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { SignedPhotoDto } from 'src/photo/dtos/signed-photo.dto';
import { PhotoshootPackageHistoryDto } from 'src/photoshoot-package/dtos/photoshoot-package-history.dto';
import { PhotoshootPackageDto } from 'src/photoshoot-package/dtos/photoshoot-package.dto';
import { UserDto } from 'src/user/dtos/user.dto';
import { BookingBillItemDto } from './booking-bill-item.dto';
import { PhotoshootPackageReviewDto } from 'src/photoshoot-package/dtos/photoshoot-package-review.dto';

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

  @Exclude()
  photoshootPackageId: string;

  @Exclude()
  userId: string;

  @Exclude()
  photoshootPackageHistoryId: string;

  @Exclude()
  originalPhotoshootPackageId: string;

  @ApiPropertyOptional()
  @Type(() => PhotoshootPackageHistoryDto)
  photoshootPackageHistory?: PhotoshootPackageHistoryDto;

  @ApiPropertyOptional()
  @Type(() => PhotoshootPackageDto)
  originalPhotoshootPackage?: PhotoshootPackageDto;

  @ApiPropertyOptional()
  @Type(() => SignedPhotoDto)
  photos: SignedPhotoDto[];

  @ApiProperty()
  @Type(() => BookingBillItemDto)
  billItems: BookingBillItemDto[];

  @ApiProperty()
  @Type(() => Number)
  totalBillItem: number;

  @ApiPropertyOptional()
  @Type(() => UserDto)
  user?: UserDto;

  @ApiPropertyOptional()
  @Type(() => PhotoshootPackageReviewDto)
  reviews: PhotoshootPackageReviewDto;
}
