import { BookingBillItemType } from '@prisma/client';
import { BookingBillItemCreateDto } from './booking-bill-item.create.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class BookingBillItemUpdateDto implements BookingBillItemCreateDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  price: number;

  @ApiProperty({
    required: false,
    enum: BookingBillItemType,
  })
  @IsOptional()
  @IsEnum(BookingBillItemType)
  type: BookingBillItemType;
}
