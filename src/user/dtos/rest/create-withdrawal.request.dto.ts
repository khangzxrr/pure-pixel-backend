import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsString,
  Min,
} from 'class-validator';

export class CreateWithdrawalRequestDto {
  @ApiProperty()
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNumberString()
  bankNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankUsername: string;
}
