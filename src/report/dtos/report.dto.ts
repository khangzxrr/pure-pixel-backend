import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus, ReportType } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { PhotoDto } from 'src/photo/dtos/photo.dto';

import { CommentDto } from 'src/photo/dtos/comment-dto';
import { UserDto } from 'src/user/dtos/user.dto';
import { BookingDto } from 'src/booking/dtos/booking.dto';

export class ReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  reportStatus: ReportStatus;

  @ApiProperty()
  reportType: ReportType;

  @Exclude()
  userId: string;

  @ApiProperty()
  referenceId: string;

  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  @Type(() => UserDto)
  referencedUser?: UserDto;

  @ApiPropertyOptional()
  @Type(() => PhotoDto)
  referencedPhoto?: PhotoDto;

  @ApiPropertyOptional()
  @Type(() => CommentDto)
  referencedComment?: CommentDto;

  @ApiPropertyOptional()
  @Type(() => BookingDto)
  referencedBooking?: BookingDto;
}
