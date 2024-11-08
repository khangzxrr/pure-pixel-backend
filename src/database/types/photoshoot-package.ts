import { Prisma } from '@prisma/client';

export type PhotoshootWithUser = Prisma.PhotoshootPackageGetPayload<{
  include: {
    user: true;
  };
}>;

export type PhotoshootPackageDetail = Prisma.PhotoshootPackageGetPayload<{
  include: {
    user: true;
    showcases: true;
  };
}>;
