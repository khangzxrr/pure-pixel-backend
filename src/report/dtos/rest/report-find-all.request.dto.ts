import { ApiProperty } from '@nestjs/swagger';
import { Prisma, ReportStatus, ReportType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class ReportFindAllRequestDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    required: false,
    enum: ReportStatus,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  reportStatus?: ReportStatus;

  @ApiProperty({
    required: false,
    isArray: true,
    enum: ReportType,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ReportType, { each: true })
  reportTypes?: ReportType[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByCreatedAt: Prisma.SortOrder;

  @ApiProperty({
    required: false,
    enum: Prisma.SortOrder,
  })
  @IsOptional()
  @IsEnum(Prisma.SortOrder)
  orderByUpdatedAt: Prisma.SortOrder;

  toWhere(): Prisma.ReportWhereInput {
    const where: Prisma.ReportWhereInput = {};

    if (this.content) {
      where.content = {
        contains: this.content,
      };
    }

    if (this.reportStatus) {
      where.reportStatus = this.reportStatus;
    }

    if (this.reportTypes) {
      where.reportType = {
        in: this.reportTypes,
      };
    }

    if (this.userId) {
      where.userId = this.userId;
    }

    if (this.referenceId) {
      where.referenceId = this.referenceId;
    }

    return where;
  }

  toOrderBy(): Prisma.ReportOrderByWithRelationInput[] {
    const orderBy: Prisma.ReportOrderByWithRelationInput[] = [];

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
