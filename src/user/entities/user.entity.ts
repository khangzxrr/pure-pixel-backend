import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  @Exclude()
  diskQuota: Decimal;

  @Exclude()
  diskUsage: Decimal;

  id: string;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  ftpUsername: string;

  @Exclude()
  ftpPassword: string;
  avatar: string;
  name: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
