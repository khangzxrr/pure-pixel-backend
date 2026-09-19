import { ApiProperty } from '@nestjs/swagger';

export class FeatureFlagsDto {
  @ApiProperty({
    description:
      'booking features (photoshoot packages, booking requests); off when FEATURE_BOOKING=false',
  })
  booking!: boolean;
}
