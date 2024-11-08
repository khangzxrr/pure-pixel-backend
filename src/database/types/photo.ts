import { Prisma } from '@prisma/client';

export type PhotoDetail = Prisma.PhotoGetPayload<{
  include: {
    photoSellings: {
      include: {
        pricetags: true;
        photoSellHistories: {
          include: {
            photoBuy: true;
          };
        };
      };
    };
  };
}>;
