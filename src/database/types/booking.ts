import { Prisma } from '@prisma/client';

export type BookingWithPhotoshootPackage = Prisma.BookingGetPayload<{
  include: {
    photoshootPackageHistory: true;
  };
}>;

export type BookingWithPhotoshootPackageIncludedUser =
  Prisma.BookingGetPayload<{
    include: {
      photoshootPackageHistory: {
        include: {
          originalPhotoshootPackage: {
            include: {
              user: true;
            };
          };
        };
      };
    };
  }>;
