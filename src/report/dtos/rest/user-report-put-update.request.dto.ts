import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class UserReportPutUpdateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

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
