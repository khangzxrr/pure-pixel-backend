import { ApiProperty } from '@nestjs/swagger';
import { PhotoSellDto } from '../photo-sell.dto';
import { Exclude, Type } from 'class-transformer';
import { UserToUserTransactionDto } from 'src/payment/dtos/user-to-user-transaction.dto';
import { PhotoSellHistoryDto } from '../photo-sell-history.dto';

//TODO: add signed url to dto if user is paid
export class PhotoBuyResponseDto {
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
