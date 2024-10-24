import { ApiProperty } from '@nestjs/swagger';
import { MakerDto } from './maker.dto';

export class MakerWithUserCountDto {
  @ApiProperty()
  maker: MakerDto;

  @ApiProperty()
  userCount: number;
}
