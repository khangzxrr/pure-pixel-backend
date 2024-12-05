import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/user.dto';

export class TopSellerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  totalPhotoSale: number;

  @ApiProperty()
  @Type(() => UserDto)
  detail: UserDto;
}
