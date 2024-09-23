import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { ApplicationEntity } from 'src/infrastructure/entities/application.entity';

export class UserEntity extends ApplicationEntity<UserEntity> implements User {
  @Exclude()
  photoQuotaUsage: number;

  @Exclude()
  packageCount: number;

  @Exclude()
  bookingPhotoQuotaUsage: number;

  @Exclude()
  bookingVideoQuotaUsage: number;

  @Exclude()
  maxPhotoQuota: number;

  @Exclude()
  maxPackageCount: number;

  @Exclude()
  maxBookingPhotoQuota: number;

  @Exclude()
  maxBookingVideoQuota: number;

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
