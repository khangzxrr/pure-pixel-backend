import { Prisma } from '@prisma/client';

export type PhotoDetail = Prisma.PhotoGetPayload<{
  include: {
    categories: true;
    _count: {
      select: {
        comments: true;
        votes: true;
      };
    };
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
