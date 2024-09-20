import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { ApplicationEntity } from 'src/infrastructure/entities/application.entity';

export class UserEntity extends ApplicationEntity<UserEntity> implements User {
  location: string;
  id: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  ftpUsername: string;

  @Exclude()
  ftpPassword: string;

  avatar: string;

  name: string;

  quote: string;

  @Exclude()
  maxPhotoCount: number;

  @Exclude()
  maxPackageCount: number;

  @Exclude()
  maxBookingPhotoCount: number;

  @Exclude()
  maxBookingVideoCount: number;
}
