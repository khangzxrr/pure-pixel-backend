import { Prisma } from '@prisma/client';

export type PhotoBuyDetail = Prisma.PhotoBuyGetPayload<{
  include: {
    userToUserTransaction: {
      include: {
        fromUserTransaction: true;
      };
    };
    photoSellHistory: {
      include: {
        originalPhotoSell: true;
      };
    };
  };
}>;
