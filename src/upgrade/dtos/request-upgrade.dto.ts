import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';

export class RequestUpgradeDto {
  @ApiProperty({
    description:
      'accept transfer days from current to new order package, this must be true if user already activate an upgrade package',
  })
  @ToBoolean()
  @IsBoolean()
  acceptTransfer: boolean;

  @ApiProperty({
    description:
      'accept remove all previous pending upgrade order, this must be true if user has pending upgrade order',
  })
  @ToBoolean()
  @IsBoolean()
  acceptRemovePendingUpgradeOrder: boolean;

  @ApiProperty({
    description: 'upgrade package ID',
  })
  @IsString()
  upgradePackageId: string;
}
