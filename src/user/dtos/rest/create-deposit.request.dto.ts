import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreateDepositRequestDto {
  @ApiProperty()
  @IsNumber()
  @Min(10000)
  amount: number;
}
