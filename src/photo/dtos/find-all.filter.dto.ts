import { ApiProperty } from '@nestjs/swagger';
import { PhotoStatus, PhotoVisibility, Prisma } from '@prisma/client';
import { Exclude } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';

export class FindAllPhotoFilterDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryName?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  photographerId?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  photographerName?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @ToBoolean()
  @IsBoolean()
  watermark?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @ToBoolean()
  @IsBoolean()
  selling?: boolean;

  @Exclude()
  visibility: PhotoVisibility;

  @Exclude()
  status: PhotoStatus;

  @ApiProperty({
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray({})
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags?: string[];

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByUpdatedAt?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByUpvote?: Prisma.SortOrder;

  toOrderBy(): Prisma.PhotoOrderByWithRelationInput[] {
    const orderBys: Prisma.PhotoOrderByWithRelationInput[] = [];

    if (this.orderByCreatedAt) {
      orderBys.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    if (this.orderByUpdatedAt) {
      orderBys.push({
        updatedAt: this.orderByUpdatedAt,
      });
    }

    if (this.orderByUpvote) {
      orderBys.push({
        votes: {
          _count: this.orderByUpvote,
        },
      });
    }

    return orderBys;
  }

  toWhere(): Prisma.PhotoWhereInput {
    const where: Prisma.PhotoWhereInput = {};

    if (this.selling) {
      where.photoSellings = {
        some: {
          active: this.selling,
        },
      };
    }

    if (this.categoryName) {
      where.category = {
        name: {
          search: this.categoryName,
        },
      };
    }

    if (this.photographerId) {
      where.photographerId = this.photographerId;
    }

    if (this.photographerName) {
      where.photographer = {
        name: {
          search: this.photographerName,
        },
      };
    }

    if (this.title) {
      where.title = {
        search: this.title,
      };
    }

    if (this.watermark) {
      where.watermark = this.watermark;
    }

    if (this.tags) {
      where.tags = {
        some: {
          name: {
            in: this.tags,
          },
        },
      };
    }

    return where;
  }
}
