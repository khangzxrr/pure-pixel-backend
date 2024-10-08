import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SepayRequestDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  gateway: string;

  @ApiProperty()
  transactionDate: Date;

  @ApiProperty()
  accountNumber: string;

  @ApiPropertyOptional()
  code: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  transferType: string;

  @ApiProperty()
  transferAmount: number;

  @ApiProperty()
  accumulated: number;

  @ApiPropertyOptional()
  subAccount: string;

  @ApiProperty()
  referenceCode: string;

  @ApiProperty()
  description: string;
}
