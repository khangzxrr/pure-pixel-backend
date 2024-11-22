import { Prisma } from '@prisma/client';

export type PhotoBuyDetail = Prisma.PhotoBuyGetPayload<{
  include: {
    userToUserTransaction: {
      include: {
        fromUserTransaction: {
          include: {
            user: true;
          };
        };
      };
    };
    photoSellHistory: {
      include: {
        originalPhotoSell: true;
      };
    };
  };
}>;
