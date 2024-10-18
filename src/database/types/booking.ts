import { Prisma } from '@prisma/client';

export type BookingWithPhotoshootPackage = Prisma.BookingGetPayload<{
  include: {
    photoshootPackage: true;
  };
}>;

export type BookingWithPhotoshootPackageIncludedUser =
  Prisma.BookingGetPayload<{
    include: {
      photoshootPackage: {
        include: {
          user: true;
        };
      };
    };
  }>;
