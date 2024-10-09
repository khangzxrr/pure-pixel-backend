import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class PhotographerDTO implements User {
  @Exclude()
  maxPhotoQuota: bigint;

  @Exclude()
  maxPackageCount: bigint;

  @Exclude()
  maxBookingPhotoQuota: bigint;

  @Exclude()
  maxBookingVideoQuota: bigint;

  @Exclude()
  photoQuotaUsage: bigint;

  @Exclude()
  packageCount: bigint;

  @Exclude()
  bookingPhotoQuotaUsage: bigint;

  @Exclude()
  bookingVideoQuotaUsage: bigint;

  @ApiProperty()
  mail: string;

  @ApiProperty()
  phonenumber: string;

  @ApiProperty()
  socialLinks: string[];

  @ApiProperty()
  expertises: string[];

  @Exclude()
  ftpUsername: string;

  @Exclude()
  ftpPassword: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  cover: string;

  @ApiProperty()
  quote: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
