import { Prisma } from '@prisma/client';

export type PhotoshootPackage = Prisma.PhotoshootPackageGetPayload<{
  include: {
    user: true;
    _count: {
      select: {
        bookings: true;
      };
    };
  };
}>;

export type PhotoshootPackageDetail = Prisma.PhotoshootPackageGetPayload<{
  include: {
    user: true;
    showcases: true;
    reviews: {
      include: {
        user: true;
      };
    };
    _count: {
      select: {
        bookings: true;
      };
    };
  };
}>;
