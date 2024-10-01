import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { ApplicationEntity } from 'src/infrastructure/entities/application.entity';

export class UserEntity extends ApplicationEntity<UserEntity> implements User {
  mail: string;

  phonenumber: string;

  socialLinks: string[];

  expertises: string[];

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

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  ftpUsername: string;

  @Exclude()
  ftpPassword: string;

  cover: string;

  location: string;

  id: string;

  avatar: string;

  name: string;

  quote: string;
}
