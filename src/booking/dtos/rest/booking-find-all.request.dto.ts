import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, Prisma } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PagingPaginatedRequestDto } from 'src/infrastructure/restful/paging-paginated.request.dto';

export class BookingFindAllRequestDto extends PagingPaginatedRequestDto {
  @Exclude()
  photographerId?: string;

  @Exclude()
  userId?: string;

  @ApiPropertyOptional({
    enum: BookingStatus,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  toWhere(): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = {};

    if (this.status) {
      where.status = this.status;
    }

    if (this.photographerId) {
      where.originalPhotoshootPackage = {
        userId: this.photographerId,
      };
    }

    if (this.userId) {
      where.userId = this.userId;
    }

    return where;
  }
}
