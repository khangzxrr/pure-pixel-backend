import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Type } from 'class-transformer';
import { UserToUserTransactionDto } from 'src/payment/dtos/user-to-user-transaction.dto';
import { PhotoSellHistoryDto } from '../photo-sell-history.dto';
import { PaymentUrlDto } from 'src/payment/dtos/payment-url.dto';

//TODO: add signed url to dto if user is paid
export class PhotoBuyResponseDto extends PaymentUrlDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  photoSellId: string;

  @ApiProperty()
  @Type(() => PhotoSellHistoryDto)
  photoSellHistory: PhotoSellHistoryDto;

  @ApiProperty()
  resolution: string;

  @Exclude()
  resolutionUrl: string;

  @ApiProperty()
  @Type(() => UserToUserTransactionDto)
  userToUserTransaction: UserToUserTransactionDto;
}
