import { ApiProperty } from '@nestjs/swagger';
import { BlogStatus, Prisma } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class BlogFindAllRequestDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiProperty({
    required: false,
    enum: BlogStatus,
  })
  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  orderByCreatedAt?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  orderByUpdatedAt?: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  orderByStatus?: Prisma.SortOrder;

  toWhere(): Prisma.BlogWhereInput {
    const where: Prisma.BlogWhereInput = {};
    if (this.content) {
      where.content = {
        search: this.content,
      };
    }

    if (this.status) {
      where.status = this.status;
    }

    return where;
  }

  toOrderBy(): Prisma.BlogOrderByWithRelationInput[] {
    const orderBy: Prisma.BlogOrderByWithRelationInput[] = [];

    if (this.orderByCreatedAt) {
      orderBy.push({
        createdAt: this.orderByCreatedAt,
      });
    }

    if (this.orderByUpdatedAt) {
      orderBy.push({
        updatedAt: this.orderByUpdatedAt,
      });
    }

    return orderBy;
  }
}