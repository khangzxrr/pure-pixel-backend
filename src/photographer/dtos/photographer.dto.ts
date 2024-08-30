import { Prisma } from '@prisma/client';

export class PhotographerDTO {
  id: string;

  diskQuota: Prisma.Decimal;
  diskUsage: Prisma.Decimal;

  createdAt: Date;
  updatedAt: Date;
}
