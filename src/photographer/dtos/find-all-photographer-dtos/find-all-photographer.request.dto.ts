import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';
import { Utils } from 'src/infrastructure/utils/utils';

export class FindAllPhotographerRequestDto extends PagingPaginatedRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isFollowed?: boolean;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt?: Prisma.SortOrder;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByPhotoCount?: Prisma.SortOrder;

  @ApiPropertyOptional({
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByVoteCount?: Prisma.SortOrder;

  toWhere(userId: string) {
    const where: Prisma.UserWhereInput = {};

    if (this.search) {
      where.normalizedName = {
        contains: Utils.normalizeText(this.search),
      };
    }

    if (this.isFollowed !== undefined) {
      if (this.isFollowed) {
        where.followings = {
          some: {
            followerId: userId
          }
        };
      } else {
        where.followings = {
          none: {
            followerId: userId
          }
        }
      }
    }


    return where;
  }

  toOrderBy() {
    const orderBys: Prisma.UserOrderByWithRelationInput[] = [];

    if (this.orderByCreatedAt) {
      orderBys.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    if (this.orderByPhotoCount) {
      orderBys.push({
        photos: {
          _count: this.orderByPhotoCount,
        },
      });
    }

    return orderBys;
  }
}
