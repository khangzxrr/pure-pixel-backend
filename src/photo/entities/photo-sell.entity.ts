import { PhotoSell } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class PhotoSellEntity implements PhotoSell {
  price: Decimal;
  colorGradingPhotoUrl: string;
  colorGradingPhotoWatermarkUrl: string;
  photoId: string;
  id: string;
  active: boolean;
  description: string;

  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
