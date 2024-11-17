import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class TransactionUpdateDto {
  @ApiPropertyOptional({
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
