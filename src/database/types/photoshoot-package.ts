import { Prisma } from '@prisma/client';

export type PhotoshootWithUser = Prisma.PhotoshootPackageGetPayload<{
  include: {
    user: true;
  };
}>;
