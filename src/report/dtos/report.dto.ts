import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus, ReportType } from '@prisma/client';
import { PhotoDto } from 'src/photo/dtos/photo.dto';
import { CommentEntity } from 'src/photo/entities/comment.entity';
import { MeDto } from 'src/user/dtos/me.dto';

export class ReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  reportStatus: ReportStatus;

  @ApiProperty()
  reportType: ReportType;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  referenceId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  user?: MeDto;

  @ApiPropertyOptional()
  photo?: PhotoDto;

  @ApiPropertyOptional()
  comment?: CommentEntity;
}
