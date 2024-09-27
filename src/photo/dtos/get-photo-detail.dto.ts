import { ApiProperty } from '@nestjs/swagger';
import { ToBoolean } from 'src/infrastructure/transforms/to-boolean';

export class GetPhotoDetailDto {
  @ApiProperty({
    required: false,
  })
  @ToBoolean()
  shared?: boolean;
}
