import { ApiProperty } from '@nestjs/swagger';
import { ChangeLogStatus, Prisma } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class ChangeLogFindAllRequestDto extends PagingPaginatedRequestDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: ChangeLogStatus,
  })
  @IsOptional()
  @IsEnum(ChangeLogStatus)
  status?: ChangeLogStatus;

  toWhere(): Prisma.ChangeLogWhereInput {
    const where: Prisma.ChangeLogWhereInput = {};

    if (this.search) {
      where.OR = [
        {
          version: {
            contains: this.search,
            mode: 'insensitive',
          },
        },
        {
          title: {
            contains: this.search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: this.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (this.status) {
      where.status = this.status;
    }

    return where;
  }
}
