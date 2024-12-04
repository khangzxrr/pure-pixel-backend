import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentMethod,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { Constants } from 'src/infrastructure/utils/constants';

export class FindAllTransactionDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
    description: 'filter by type',
    enum: TransactionType,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    required: false,
    description: 'filter by status',
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'filter by payment method',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    required: false,
    description: 'order by paymentMethod asc|desc',
  })
  @IsOptional()
  @IsIn(Constants.SORT)
  orderByPaymentMethod?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    description: 'order by amount asc|desc',
  })
  @IsOptional()
  @IsIn(Constants.SORT)
  orderByAmount?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    description: 'order by type asc|desc',
  })
  @IsOptional()
  @IsIn(Constants.SORT)
  orderByType?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    description: 'order by created at asc|desc',
  })
  @IsOptional()
  @IsIn(Constants.SORT)
  orderByCreatedAt?: Prisma.SortOrder;

  toOrderBy(query: string) {
    const orderBy = [
      {
        type: this.orderByType,
        index: query.indexOf(`orderByType`),
      },
      {
        amount: this.orderByAmount,
        index: query.indexOf(`orderByAmount`),
      },
      {
        createdAt: this.orderByCreatedAt,
        index: query.indexOf(`orderByCreatedAt`),
      },
      {
        paymentMethod: this.orderByPaymentMethod,
        index: query.indexOf(`orderByPaymentMethod`),
      },
    ];

    const sortedOrderBy = orderBy
      .sort((ob) => ob.index)
      .map((ob) => {
        return {
          type: ob.type,
          amount: ob.amount,
          createdAt: ob.createdAt,
          paymentMethod: ob.paymentMethod,
        };
      });

    return sortedOrderBy;
  }
}
