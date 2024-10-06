import { PhotoSell } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class PhotoSellEntity implements PhotoSell {
  photoId: string;
  id: string;
  active: boolean;
  price: Decimal;
  description: string;
  afterPhotoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
