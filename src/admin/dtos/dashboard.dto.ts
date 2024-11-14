import { ApiProperty } from '@nestjs/swagger';
import { TimelineDatapointDto } from './timeline-datapoint.dto';
import { Type } from 'class-transformer';

export class DashboardDto {
  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  totalCustomer: TimelineDatapointDto;

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  totalPhotographer: TimelineDatapointDto;

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  totalEmployeGraph: TimelineDatapointDto;

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  totalRevenueGraph: TimelineDatapointDto[];

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  revenueFromUpgradePackageGraph: TimelineDatapointDto[];

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  revenueFromSellingPhotoGraph: TimelineDatapointDto[];

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  photoTotalGraph: TimelineDatapointDto[];

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  userTotalGraph: TimelineDatapointDto[];

  @ApiProperty()
  @Type(() => TimelineDatapointDto)
  topUsedPackageGraph: TimelineDatapointDto[];
}
