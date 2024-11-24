import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Type } from 'class-transformer';
import { UserToUserTransactionDto } from 'src/payment/dtos/user-to-user-transaction.dto';
import { PhotoSellHistoryDto } from '../photo-sell-history.dto';
import { PaymentUrlDto } from 'src/payment/dtos/payment-url.dto';

export class PhotoBuyResponseDto extends PaymentUrlDto {
  @Exclude()
  photoSellHistoryId: string;

  @Exclude()
  userToUserTransactionId: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  photoSellId: string;

  @ApiProperty({
    type: () => PhotoSellHistoryDto,
  })
  @Type(() => PhotoSellHistoryDto)
  photoSellHistory: PhotoSellHistoryDto;

  @ApiProperty()
  @Type(() => UserToUserTransactionDto)
  userToUserTransaction: UserToUserTransactionDto;
}
