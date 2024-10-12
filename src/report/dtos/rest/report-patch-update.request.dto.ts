import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus, ReportType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReportPathUpdateDto {
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
    enum: ReportType,
  })
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
