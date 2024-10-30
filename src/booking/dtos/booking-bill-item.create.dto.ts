import { ApiProperty } from '@nestjs/swagger';
import { BookingBillItemType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class BookingBillItemCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  price: number;

  @ApiProperty({
    enum: BookingBillItemType,
  })
  @IsEnum(BookingBillItemType)
  type: BookingBillItemType;
}
