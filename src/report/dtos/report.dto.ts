import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus, ReportType } from '@prisma/client';

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
}
