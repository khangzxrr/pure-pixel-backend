import { Prisma } from '@prisma/client';

export type PhotoshootWithUserAndDetails = Prisma.PhotoshootPackageGetPayload<{
  include: {
    user: true;
    details: true;
  };
}>;
