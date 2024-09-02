import { Prisma, User as PrismaUser } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class User implements PrismaUser {
  diskQuota: Decimal;
  diskUsage: Decimal;

  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(userId: string) {
    this.id = userId;
    this.diskQuota = new Prisma.Decimal(0.0);
    this.diskUsage = new Prisma.Decimal(0.0);
    this.ftpUsername = undefined;
    this.ftpEndpoint = undefined;
    this.ftpPassword = undefined;
  }
  ftpUsername: string;
  ftpPassword: string;
  ftpEndpoint: string;
}
