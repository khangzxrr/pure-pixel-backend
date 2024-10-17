import { Prisma } from '@prisma/client';

export type BookingWithPhotoshootPackage = Prisma.BookingGetPayload<{
  include: {
    photoshootPackage: true;
  };
}>;
