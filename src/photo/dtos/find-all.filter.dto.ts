import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PhotoStatus,
  PhotoType,
  PhotoVisibility,
  Prisma,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';
import { ToArray } from 'src/infrastructure/transforms/to-array';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';
import { Utils } from 'src/infrastructure/utils/utils';

export class FindAllPhotoFilterDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  bookmarked?: boolean;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @ApiProperty({
    required: false,
    enum: PhotoType,
  })
  @IsOptional()
  @IsEnum(PhotoType)
  photoType?: PhotoType;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  gps?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brandId?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cameraId?: string;

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

  @ApiProperty({
    required: false,
    enum: PhotoStatus,
    isArray: true,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(PhotoStatus, { each: true })
  statuses?: PhotoStatus[];

  @ApiPropertyOptional({})
  @IsOptional()
  @ToBoolean()
  isFollowed?: boolean;

  @ApiPropertyOptional({
    enum: PhotoVisibility,
  })
  @IsOptional()
  @IsEnum(PhotoVisibility)
  visibility?: PhotoVisibility;

  @ApiProperty({
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray({})
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : Array(value)))
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

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @ToArray()
  @IsArray()
  @IsNotEmpty({ each: true })
  ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

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

  toWhere(userId: string): Prisma.PhotoWhereInput {
    const where: Prisma.PhotoWhereInput = {};

    if (this.id) {
      where.id = {
        contains: this.id,
      };
    }

    if (this.bookmarked) {
      where.bookmarks = {
        some: {
          userId,
        },
      };
    }
    if (this.ids) {
      where.id = {
        in: this.ids,
      };
    }

    if (this.gps) {
      where.exif = {
        path: ['latitude'],
        not: null,
      };
    }

    if (this.photoType) {
      where.photoType = this.photoType;
    }

    if (this.cameraId) {
      where.camera = {
        id: this.cameraId,
      };
    }

    if (this.brandId) {
      where.camera = {
        cameraMaker: {
          id: this.brandId,
        },
      };
    }

    if (this.visibility) {
      where.visibility = this.visibility;
    }

    if (this.statuses) {
      where.status = {
        in: this.statuses,
      };
    }

    if (this.isFollowed !== undefined) {
      if (this.isFollowed === true) {
        where.photographer = {
          followers: {
            some: {
              followerId: userId,
            },
          },
        };
      } else {
        where.photographer = {
          followers: {
            none: {
              followerId: userId,
            },
          },
        };
      }
    }

    if (this.selling !== undefined) {
      if (this.selling === true) {
        where.photoSellings = {
          some: {
            active: true,
          },
        };
      } else {
        where.photoSellings = {
          every: {
            active: false,
          },
        };
      }
    }

    if (this.categoryName) {
      where.categories = {
        some: {
          name: {
            mode: 'insensitive',
            contains: this.categoryName,
          },
        },
      };
    }

    if (this.photographerId) {
      where.photographerId = this.photographerId;
    }

    if (this.photographerName) {
      where.photographer = {
        OR: [
          {
            name: {
              contains: this.photographerName,
              mode: 'insensitive',
            },
          },
          {
            normalizedName: {
              contains: Utils.normalizeText(this.photographerName),
            },
          },
        ],
      };
    }

    if (this.title) {
      where.OR = [
        {
          title: {
            contains: this.title,
            mode: 'insensitive',
          },
        },
        {
          normalizedTitle: {
            contains: Utils.normalizeText(this.title),
          },
        },
      ];
    }

    if (this.search) {
      where.OR = [
        {
          photographer: {
            name: {
              contains: this.search,
              mode: 'insensitive',
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
        {
          title: {
            contains: this.search,
            mode: 'insensitive',
          },
        },
        {
          normalizedTitle: {
            contains: Utils.normalizeText(this.search),
          },
        },
      ];
    }

    if (this.watermark) {
      where.watermark = this.watermark;
    }

    if (this.tags) {
      where.photoTags = {
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
