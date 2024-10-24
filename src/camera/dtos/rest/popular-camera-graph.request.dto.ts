import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { GraphSeperator } from 'src/camera/enums/graph-seperator.enum';

export class PopularCameraGraphRequestDto {
  @ApiProperty({
    enum: GraphSeperator,
  })
  @IsEnum(GraphSeperator)
  seperator: GraphSeperator;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(200)
  topNumber: number;
}
