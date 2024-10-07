import { ApiProperty } from '@nestjs/swagger';
import { PhotoSellDto } from '../photo-sell.dto';
import { Exclude, Type } from 'class-transformer';
import { UserToUserTransactionDto } from 'src/payment/dtos/user-to-user-transaction.dto';

export class PhotoBuyResponseDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  photoSellId: string;

  @ApiProperty()
  @Type(() => PhotoSellDto)
  photoSell: PhotoSellDto;

  @ApiProperty()
  resolution: string;

  @Exclude()
  resolutionUrl: string;

  @ApiProperty()
  @Type(() => UserToUserTransactionDto)
  userToUserTransaction: UserToUserTransactionDto;
}
