import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ReportCreateRequestDto {
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
