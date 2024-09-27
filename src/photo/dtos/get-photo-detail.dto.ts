import { ApiProperty } from '@nestjs/swagger';

export class GetPhotoDetailDto {
  @ApiProperty({
    required: false,
  })
  shared?: boolean;
}
