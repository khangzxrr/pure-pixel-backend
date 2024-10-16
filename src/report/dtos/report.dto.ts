import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus, ReportType } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/me.dto';

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
}
