import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentMethod,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';

import { IsArray, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { ToArray } from 'src/infrastructure/transforms/to-array';
import { Constants } from 'src/infrastructure/utils/constants';
import { Utils } from 'src/infrastructure/utils/utils';

export class FindAllTransactionDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    required: false,
    description: 'filter by type',
    enum: TransactionType,
    isArray: true,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(TransactionType, { each: true })
  types?: TransactionType[];

  @ApiProperty({
    required: false,
    description: 'filter by status',
    enum: TransactionStatus,
    isArray: true,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(TransactionStatus, { each: true })
  statuses?: TransactionStatus[];

  @ApiPropertyOptional({
    description: 'filter by payment method',
    enum: PaymentMethod,
    isArray: true,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethods?: PaymentMethod[];

  @ApiProperty({
    required: false,
    description: 'order by amount asc|desc',
  })
  @IsOptional()
  @IsIn(Constants.SORT)
  orderByAmount?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    description: 'order by created at asc|desc',
  })
  @IsOptional()
  @IsIn(Constants.SORT)
  orderByCreatedAt?: Prisma.SortOrder;

  toWhere() {
    const where: Prisma.TransactionWhereInput = {};

    if (this.id) {
      where.id = {
        contains: this.id,
      };
    }

    if (this.search) {
      where.OR = [
        {
          id: {
            contains: this.search,
          },
        },
        {
          userId: {
            contains: this.search,
          },
        },
        {
          user: {
            name: {
              contains: this.search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            normalizedName: {
              contains: Utils.normalizeText(this.search),
              mode: 'insensitive',
            },
          },
        },
      ];

      if (Number(this.search)) {
        where.OR.push({
          fee: Number(this.search),
        });

        where.OR.push({
          amount: Number(this.search),
        });
      }
    }

    if (this.types) {
      where.type = {
        in: this.types,
      };
    }

    if (this.statuses) {
      where.status = {
        in: this.statuses,
      };
    }

    if (this.paymentMethods) {
      where.paymentMethod = {
        in: this.paymentMethods,
      };
    }

    return where;
  }

  toOrderBy(query: string) {
    const orderBy = [
      {
        createdAt: this.orderByCreatedAt,
        index: query.indexOf(`orderByCreatedAt`),
      },
      {
        amount: this.orderByAmount,
        index: query.indexOf(`orderByAmount`),
      },
    ];

    const sortedOrderBy = orderBy
      .sort((ob) => ob.index)
      .map((ob) => {
        return {
          createdAt: ob.createdAt,
          amount: ob.amount,
        };
      });

    return sortedOrderBy;
  }
}
