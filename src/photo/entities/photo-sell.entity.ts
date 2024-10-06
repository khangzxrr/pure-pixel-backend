import { PhotoSell } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class PhotoSellEntity implements PhotoSell {
  id: string;
  active: boolean;
  price: Decimal;
  description: string;
  afterPhotoUrl: string;
  photoId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
