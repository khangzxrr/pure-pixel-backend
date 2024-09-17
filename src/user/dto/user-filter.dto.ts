import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';

export class UserFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by id, leave blank if get current logged user',
    example: '5f9d5b6b-9e1b-4e9f-9f9f-9e9e9e9e9e9e',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Include all transactions',
    example: true,
  })
  @ToBoolean()
  @IsBoolean()
  transactions: boolean;

  @ApiPropertyOptional({
    description: 'Include all upgrade orders',
    example: true,
  })
  @ToBoolean()
  @IsBoolean()
  upgradeOrders: boolean;
}
