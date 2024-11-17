import { ApiProperty } from '@nestjs/swagger';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
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

  @ApiProperty({
    required: false,
    description: 'order by paymentMethod asc|desc',
    default: 'asc',
  })
  @IsIn(Constants.SORT)
  orderByPaymentMethod: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    description: 'order by amount asc|desc',
    default: 'asc',
  })
  @IsIn(Constants.SORT)
  orderByAmount: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    description: 'order by type asc|desc',
    default: 'asc',
  })
  @IsIn(Constants.SORT)
  orderByType: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    description: 'order by created at asc|desc',
    default: 'asc',
  })
  @IsIn(Constants.SORT)
  orderByCreatedAt: Prisma.SortOrder;
}
