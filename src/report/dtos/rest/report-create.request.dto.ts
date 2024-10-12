import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus, ReportType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ReportCreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    enum: ReportStatus,
  })
  @IsEnum(ReportStatus)
  reportStatus: ReportStatus;

  @ApiProperty({
    enum: ReportType,
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  referenceId: string;
}
