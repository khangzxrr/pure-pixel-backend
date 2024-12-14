import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { Utils } from 'src/infrastructure/utils/utils';

export class PhotoBuyFindAllDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByUpdatedAt?: Prisma.SortOrder;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt?: Prisma.SortOrder;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  toOrderBy() {
    const orderBy: Prisma.PhotoOrderByWithRelationInput[] = [];

    if (this.orderByUpdatedAt) {
      orderBy.push({
        updatedAt: this.orderByUpdatedAt,
      });
    }

    if (this.orderByCreatedAt) {
      orderBy.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    return orderBy;
  }

  toWhere() {
    const where: Prisma.PhotoWhereInput = {};

    if (this.search) {
      where.OR = [
        {
          title: {
            contains: this.search,
          },
        },
        {
          normalizedTitle: {
            contains: Utils.normalizeText(this.search),
          },
        },
        {
          photographer: {
            name: {
              contains: this.search,
            },
          },
        },
        {
          photographer: {
            normalizedName: {
              contains: Utils.normalizeText(this.search),
            },
          },
        },
      ];
    }

    return where;
  }
}
