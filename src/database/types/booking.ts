import { Prisma } from '@prisma/client';

export type Booking = Prisma.BookingGetPayload<{
  include: {
    photoshootPackageHistory: true;
    originalPhotoshootPackage: {
      include: {
        user: true;
      };
    };
  };
}>;

export type BookingDetail = Prisma.BookingGetPayload<{
  include: {
    photos: true;
    photoshootPackageHistory: true;
    originalPhotoshootPackage: {
      include: {
        user: true;
      };
    };
  };
}>;
